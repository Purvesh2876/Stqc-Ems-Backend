const Firmware = require('../models/firmware');
const axios = require('axios');
const https = require('https');
const fs = require('fs');
const FormData = require('form-data');
const FirmwareOtaRelease = require('../models/firmwareOtaRelease');
const apiUrl = `${process.env.MQTT_CONNECTED_DEVICES}`;


const httpsAgent = new https.Agent({
    cert: fs.readFileSync(path.join(__dirname, "/etc/ssl/rahul-arcisai-hsm/wildcard.crt")),
    key: fs.readFileSync(path.join(__dirname, "/etc/ssl/rahul-arcisai-hsm/wildcard.key")),
    ca: fs.readFileSync(path.join(__dirname, "/etc/ssl/rahul-arcisai-hsm/ca-chain.pem")),
    rejectUnauthorized: true, // IMPORTANT for production
});


// @desc    Get all firmware versions
// @route   GET /api/firmware
// @access  Admin
exports.cameraList = async (req, res, next) => {
    const { page = 1, limit = 10, searchQuery } = req.query;

    try {
        // Fetch devices from the API
        const devicesResponse = await axios.get(apiUrl, { httpsAgent });
        const devices = devicesResponse.data; // Assuming this contains the array of devices

        // Extract device IDs into an array
        const deviceIds = devices.map(device => device.deviceId);

        if (!deviceIds.length) {
            return res.status(400).json({
                success: false,
                message: 'No devices found for OTA',
            });
        }

        // Build the query using device IDs and optional search query
        const query = { deviceId: { $in: deviceIds } };
        if (searchQuery) {
            query.$or = [
                { deviceId: { $regex: searchQuery, $options: 'i' } },
                { firmware: { $regex: searchQuery, $options: 'i' } }
            ];
        }

        // Calculate pagination parameters
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Query the database for matching firmware versions
        const firmwareVersions = await Firmware.find(query)
            .skip(skip)
            .limit(parseInt(limit))
            .select('deviceId productType firmware releaseDate currentFirmware');

        // Add online/offline status to each firmware version
        const filteredFirmwareVersions = firmwareVersions.map(firmwareVersion => {
            const deviceId = firmwareVersion.deviceId;
            const isOnline = deviceIds.includes(deviceId);
            return {
                ...firmwareVersion.toObject(),
                status: isOnline ? 'online' : 'offline' // Add status based on presence in the deviceIds array
            };
        });

        if (!filteredFirmwareVersions.length) {
            return res.status(400).json({
                success: false,
                message: "No matching devices found for OTA update.",
            });
        }

        // Calculate total count and pages
        const totalCount = await Firmware.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);

        res.status(200).json({
            success: true,
            message: 'data fetched successfully',
            data: filteredFirmwareVersions,
            totalPages,
            currentPage: parseInt(page),
            totalCount
        });
    } catch (error) {
        next(error);
    }
};
// @desc    relese firmware version
// @route   POST /api/firmware
// @access  Admin

// exports.releseFirmware = async (req, res, next) => {
//     const { productType, firmware, description } = req.body;

//     // get today's date in DD-MM-YYYY format
//     const releseDate = new Date().toLocaleDateString('en-GB');

//     try {
//         const relese = await Firmware.updateMany(
//             { productType: productType },
//             { $set: { firmware, releseDate, description } }
//         );

//         res.status(200).json({
//             success: true,
//             data: relese
//         });
//     }
//     catch (error) {
//         next(error);
//     }
// }

exports.releseFirmware = async (req, res, next) => {
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, message: "No file uploaded" });

    const { productType, firmware, description, isLatest } = req.body;

    try {
        const form = new FormData();
        form.append('folder', productType);
        form.append('version', firmware);
        form.append('file', fs.createReadStream(file.path), file.originalname);

        // Upload to Prong
        const uploadResponse = await axios.post(
            'https://ems.devices.arcisai.io/upload',
            form,
            { headers: { ...form.getHeaders() } }
        );

        // DELETE LOCAL FILE IMMEDIATELY AFTER UPLOAD ATTEMPT (Success Case)
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

        if (uploadResponse.status === 200) {
            const remoteData = uploadResponse.data;

            // 1. Toggle latest flags
            if (isLatest === 'true' || isLatest === true) {
                await FirmwareOtaRelease.updateMany(
                    { productType, latestFirmware: true },
                    { $set: { latestFirmware: false } }
                );
            }

            // 2. Create History Record
            await FirmwareOtaRelease.create({
                versionNo: firmware,
                productType,
                description,
                releaseDate: new Date().toLocaleDateString('en-GB'),
                fileName: remoteData.fileName,
                downloadUrl: remoteData.downloadUrl,
                latestFirmware: isLatest === 'true' || isLatest === true
            });

            // 3. Update individual device records
            // await Firmware.updateMany(
            //     { productType },
            //     { $set: { firmware, releseDate: new Date().toLocaleDateString('en-GB'), description } }
            // );
            // 3. UPDATED: Dynamic Bulk Update for Devices
            // If the product contains "Augentix", we update all variants using Regex.
            // Otherwise, we perform an exact match.
            const filter = productType.toLowerCase().includes('augentix')
                ? { productType: { $regex: /Augentix/i } }
                : { productType: productType };

            await Firmware.updateMany(
                filter,
                {
                    $set: {
                        firmware,
                        releseDate: new Date().toLocaleDateString('en-GB'),
                        description
                    }
                }
            );

            return res.status(200).json({ success: true, message: 'Release successful' });
        }
    } catch (err) {
        // DELETE LOCAL FILE IMMEDIATELY (Failure Case)
        if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);

        console.error("Upload failed", err);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error during upload',
            error: err.message
        });
    }
};

// @desc    check firmware update
// @route   GET /api/firmware/check
// @access  Admin
exports.getOTA = async (req, res) => {

    const deviceId = req.query.deviceId;
    let responseSent = false; // Flag to prevent multiple responses

    try {
        const options = {
            username: process.env.mqttuser,
            password: process.env.password,
        };

        const client = mqtt.connect(process.env.mqtt_broker_url, options);

        client.on('message', (topic, message) => {
            if (!responseSent) {
                responseSent = true; // Set the flag to true
                const messageString = message.toString();
                console.log(`Message on topic ${topic}:`, messageString);

                try {
                    const parsedMessage = JSON.parse(messageString);
                    console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

                    client.end(() => {
                        res.status(200).json(parsedMessage);
                    });
                } catch (err) {
                    console.error('Error parsing JSON:', err);
                    res.status(500).send('Invalid JSON format in the message body.');
                    client.end();
                }
            }
        });

        client.on('connect', () => {
            console.log('Connected to the device');

            client.subscribe(`${appTopicReceive}${deviceId}/35`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/35`, 'get ota');
                }
            });
        });

        client.on('error', (err) => {
            if (!responseSent) {
                responseSent = true;
                console.error('MQTT Client Error:', err);
                res.status(500).json({ message: 'Error with MQTT client' });
            }
        });
    } catch (error) {
        console.error('Error updating Set UnattendedObjDetect:', error);
        res.status(500).json({
            statusCode: 1,
            statusMessage: 'Error updating Set UnattendedObjDetect',
        });
    }
};

// @desc    set firmware update
// @route   GET /api/firmware/set
// @access  Admin
exports.setOTA = async (req, res) => {

    const deviceId = req.query.deviceId;
    let responseSent = false; // Flag to prevent multiple responses

    try {
        const options = {
            username: process.env.mqttuser,
            password: process.env.password,
        };

        const client = mqtt.connect(process.env.mqtt_broker_url, options);

        client.on('message', (topic, message) => {
            if (!responseSent) {
                responseSent = true; // Set the flag to true
                const messageString = message.toString();
                console.log(`Message on topic ${topic}:`, messageString);

                try {
                    const parsedMessage = { data: messageString };
                    console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);
                    // Create a buffer from the array
                    const buffer = Buffer.from(parsedMessage.data);

                    // Convert the buffer to a string
                    const resultString = buffer.toString('utf-8');
                    client.end(() => {
                        res.status(200).json(resultString);
                    });
                } catch (err) {
                    console.error('Error parsing JSON:', err);
                    res.status(500).send('Invalid JSON format in the message body.');
                    client.end();
                }

            }
        });

        client.on('connect', () => {
            console.log('Connected to the device');

            client.subscribe(`${appTopicReceive}${deviceId}/36`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/36`, 'set ota');
                }
            });
        });

        client.on('error', (err) => {
            if (!responseSent) {
                responseSent = true;
                console.error('MQTT Client Error:', err);
                res.status(500).json({ message: 'Error with MQTT client' });
            }
        });
    } catch (error) {
        console.error('Error updating Set UnattendedObjDetect:', error);
        res.status(500).json({
            statusCode: 1,
            statusMessage: 'Error updating Set UnattendedObjDetect',
        });
    }
};

// Function to create or update firmware release
exports.updateOtaLatestRelease = async (req, res) => {
    try {
        const { productType, versionNo, versionName, updates } = req.body;
        const file = req.file;

        if (!versionNo || !versionName || !file || !productType) {
            return res.status(400).json({
                message: 'Version number, name, file, and product type are required.'
            });
        }

        // Prepare release data
        const releaseData = {
            productType,
            versionNo,
            versionName,
            releaseDate: new Date().toISOString(),
            updates: updates || []
        };

        const existingRelease = await releaseFirmwareModel.findOne({ versionNo });

        if (existingRelease) {
            await releaseFirmwareModel.updateOne({ versionNo }, releaseData);
        } else {
            const newRelease = new releaseFirmwareModel(releaseData);
            await newRelease.save();
        }

        // Upload to external server
        const form = new FormData();
        // Add folder BEFORE file to avoid undefined issue in multer destination
        form.append('folder', productType);
        form.append('file', fs.createReadStream(file.path), file.originalname);

        const uploadResponse = await axios.post(
            'http://prong.arcisai.io:6000/upload',
            form,
            { headers: form.getHeaders() }
        );

        if (uploadResponse.status !== 200) {
            return res.status(500).json({
                message: 'File uploaded locally, but remote upload failed.'
            });
        }

        // Remove local file after successful upload
        try {
            fs.unlinkSync(file.path);
        } catch (cleanupErr) {
            console.warn(`⚠ Failed to remove local file ${file.path}:`, cleanupErr.message);
        }

        return res.status(existingRelease ? 200 : 201).json({
            message: `Firmware release ${existingRelease ? 'updated' : 'created'} and uploaded successfully.`,
            remoteUpload: uploadResponse.data
        });
    } catch (error) {
        console.error('Error creating or updating firmware release:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// create new device
// @route   POST /api/device
// @access  Admin
