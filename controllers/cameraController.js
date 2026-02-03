const Config = require('../models/Config');
const deviceinfo = require('../models/deviceinfo');
const firmware = require('../models/firmware');
const image = require('../models/image');
const network = require('../models/network');
const p2predirect = require('../models/p2predirect');
const time = require('../models/time');
const video1 = require('../models/video1');
const video101 = require('../models/video101');
const video102 = require('../models/video102');
const nvr = require('../models/nvrList');
const History = require('../models/history');
const Uids = require('../models/masterUid');
const macModel = require('../models/macModel');
const macWifiModel = require('../models/macWifimodel');
const mongoose = require('mongoose');
const https = require('https');
const axios = require('axios');
const apiUrl = 'https://p2p.arcisai.io:7201/api/proxy/http';
const basicAuth = `Basic ${Buffer.from(`admin:admin`).toString('base64')}`;
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

// create instance of axios with custom config
const instance = axios.create({
    // baseURL: 'https://dev.arcisai.io/backend/api/admin',
    baseURL: 'https://view.arcisai.io/backend/api/admin',
    httpsAgent: new https.Agent({
        rejectUnauthorized: false
    })
});


// Create a camera with all the required entries
exports.addCamera = async (req, res) => {
    const { deviceId, planName = "LIVE" } = req.body;

    // Regular expression for the format XXXX-XXXXXX-XXXXX
    const deviceIdPattern = /^[A-Z0-9]{4}-[A-Z0-9]{6}-[A-Z0-9]{5}$/;

    // Validate deviceId format
    if (!deviceIdPattern.test(deviceId)) {
        return res.status(400).json({ message: 'Invalid Device ID format. Expected format: XXXX-000000-XXXXX' });
    }

    if (!deviceId || !planName) {
        return res.status(400).json({ message: 'Device ID and plan are required' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Fetch p2p record first to check existence and productType
        const existp2p = await p2predirect.findOne({ deviceId });

        if (!existp2p) {
            await session.abortTransaction(); // Good practice to abort if returning early
            session.endSession();
            return res.status(400).json({ message: 'Device ID does not exist' });
        }

        // 2. Determine cameraType and localPort based on productType
        // Using optional chaining and default logic
        const isAugentix = existp2p.productType && existp2p.productType.toLowerCase().includes('augentix');
        const cameraType = isAugentix ? 'https' : 'http';
        const localPort = isAugentix ? 443 : 80;

        const existingConfig = await Config.findOne({ topic: deviceId }).session(session);
        if (existingConfig) {
            throw new Error('Camera already exists');
        }

        // Config
        const cfgdata = {
            topic: deviceId,
            type: cameraType, // Set dynamically based on DB productType
            local_port: localPort, // Set dynamically based on DB productType
            local_ip: '127.0.0.1',
            subdomain: deviceId,
            host_header_rewrite: 'torqueverse.dev',
            server_addr: 'p2p.arcisai.io',
            server_port: 7000,
            token: '12345678',
            planName: existp2p.productType === 'vod' ? 'DVR-30' : planName,
        };
        await Config.updateOne({ topic: deviceId }, cfgdata, { upsert: true, session });

        // Video1
        const vid1data = {
            brightnessLevel: 50,
            contrastLevel: 50,
            enabled: true,
            flipEnabled: true,
            hueLevel: 50,
            mirrorEnabled: true,
            powerLineFrequencyMode: 50,
            privacyMask: Array.from({ length: 4 }, (_, i) => ({
                id: i + 1,
                enabled: false,
                regionX: 0,
                regionY: 0,
                regionWidth: 0,
                regionHeight: 0,
                regionColor: '0',
            })),
            saturationLevel: 50,
            sharpnessLevel: 50,
        };
        await video1.updateOne({ deviceId }, { $set: vid1data }, { upsert: true, session });

        // Video101
        const vid101data = {
            ImageTransmissionModel: 2,
            bitRateControlType: 'VBR',
            channelName: 'ARCIS AI',
            channelNameOverlay: {
                enabled: true,
                regionX: 1.15,
                regionY: 4.444445,
            },
            codecType: 'H.264',
            constantBitRate: 250,
            datetimeOverlay: {
                enabled: true,
                regionX: 1.15,
                regionY: 0,
                dateFormat: 'YYYY-MM-DD',
                timeFormat: 24,
                displayWeek: false,
                displayChinese: false,
            },
            deviceIDOverlay: {
                enabled: false,
                regionX: 0,
                regionY: 0,
            },
            enabled: true,
            expandChannelNameOverlay: Array.from({ length: 4 }, (_, i) => ({
                expandChannelName: '',
                id: i + 1,
                enabled: false,
                regionX: 0,
                regionY: 0,
            })),
            frameRate: 15,
            freeResolution: false,
            gop: 2,
            h264Profile: 'high',
            id: 101,
            keyFrameInterval: 30,
            resolution: '1280x720',
            textOverlays: '',
            videoInputChannelID: 101,
        };
        await video101.updateOne({ deviceId }, { $set: vid101data }, { upsert: true, session });

        // Video102
        const vid102data = {
            ImageTransmissionModel: 2,
            bitRateControlType: "VBR",
            channelName: "ARCIS AI",
            codecType: "H.264",
            constantBitRate: 100,
            enabled: true,
            frameRate: 10,
            freeResolution: false,
            gop: 2,
            h264Profile: "baseline",
            id: 102,
            keyFrameInterval: 30,
            resolution: "640x360",
            videoInputChannelID: 102
        };
        await video102.updateOne({ deviceId }, { $set: vid102data }, { upsert: true, session });

        // Image
        const imgdata = {
            BLcompensationMode: 'auto',
            WDR: {
                enabled: true,
                WDRStrength: 1,
            },
            awbMode: 'indoor',
            denoise3d: {
                enabled: true,
                denoise3dStrength: 3,
            },
            exposureMode: 'auto',
            imageStyle: 1,
            irCutFilter: {
                irCutControlMode: 'hardware',
                irCutMode: 'smart',
            },
            lowlightMode: 'only night',
            manualSharpness: {
                enabled: true,
                sharpnessLevel: 1,
            },
            sceneMode: 'indoor',
            videoMode: {
                FixParam: Array.from({ length: 2 }, (_, i) => ({
                    id: i,
                    CenterCoordinateX: 0,
                    CenterCoordinateY: 0,
                    Radius: 0,
                    AngleX: 0,
                    AngleY: 0,
                    AngleZ: 0,
                })),
            },
        };
        await image.updateOne({ deviceId }, { $set: imgdata }, { upsert: true, session });

        // Firmware
        let firmwareName = null;
        let productTypeValue = "PTZ_S_Series";
        console.log('existp2p.productType:', existp2p.productType);
        if (existp2p.productType?.includes("Augentix")) {
            firmwareName = "A_Series_0.10.1"; // this is for augentix and need to replace it during next kitty update
            productTypeValue = "Augentix";
        } else if (deviceId.startsWith('ATPL')) {
            firmwareName = "S_Series_0.10.0";
            productTypeValue = "S_Series";
        } else if (deviceId.startsWith('VSPL')) {
            firmwareName = "A_series_0.10.0";
            productTypeValue = "VSPL";
        }

        let firmwareData = null;
        if (firmwareName) {
            // Re-using the logic from top, checking isAugentix from 'existp2p' or 'productTypeValue'
            // Since productTypeValue logic matches the initial check logic, we can reuse 'isAugentix' here
            // if strict alignment is needed, or stick to the logic below:
            const isAugentixFirmware = productTypeValue.toLowerCase().includes("augentix");
            firmwareData = {
                deviceId,
                mqttUrl:"mqtts://pro.arcisai.io:8883",
                productType: productTypeValue,
                p2pAmbicam: "P2Pambicam_0.8",
                vcamAmbicam: "vcamclient-uclinux_0.9",
                firmware: firmwareName
            };
            await firmware.updateOne({ deviceId }, { $set: firmwareData }, { upsert: true, session });
        }

        // Get previous state
        const [prevConfig, prevVideo1, prevVideo101, prevVideo102, prevImage, prevFirmware] = await Promise.all([
            Config.findOne({ topic: deviceId }).lean(),
            video1.findOne({ deviceId }).lean(),
            video101.findOne({ deviceId }).lean(),
            video102.findOne({ deviceId }).lean(),
            image.findOne({ deviceId }).lean(),
            firmware.findOne({ deviceId }).lean()
        ]);

        // History change log
        const afterChange = {
            config: cfgdata,
            video1: vid1data,
            video101: vid101data,
            video102: vid102data,
            image: imgdata,
            firmware: firmwareData || null
        };

        await History.create({
            email: req.user?.email || "system",
            deviceId,
            beforeChange: {
                config: prevConfig || null,
                video1: prevVideo1 || null,
                video101: prevVideo101 || null,
                video102: prevVideo102 || null,
                image: prevImage || null,
                firmware: prevFirmware || null,
            },
            afterChange,
            actionType: "add_camera",
        });

        await session.commitTransaction();
        res.status(201).json({ message: 'Camera added successfully' });

    } catch (error) {
        await session.abortTransaction();
        console.log(error);
        res.status(500).json({ message: error.message });
    } finally {
        session.endSession();
    }
};


// define https agent 
const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});

// Object to track ongoing streams
const activeStreams = {};

// Function to stream the video to RTMP
const streamVideo = (videoPath, deviceId) => {
    const rtmpUrl = `rtmp://media2.arcisai.io:1935/DVR-30/RTSP-${deviceId}`;
    console.log(`Starting stream for video: ${videoPath}`);
    console.log(`Streaming to RTMP URL: ${rtmpUrl}`);

    const startStream = () => {
        const stream = ffmpeg(videoPath)
            .inputOptions(['-re']) // Real-time input
            .outputOptions(['-c:v', 'libx264', '-c:a', 'aac', '-f', 'flv', '-strict', '-2'])
            .output(rtmpUrl)
            .on('start', () => {
                console.log(`Started streaming ${videoPath} to ${rtmpUrl}`);
                activeStreams[deviceId] = stream; // Store the active stream process
            })
            .on('stderr', (stderr) => {
                console.log('FFmpeg stderr: ', stderr);
            })
            .on('end', () => {
                console.log(`Streaming ended for ${videoPath}. Restarting immediately...`);
                startStream(); // Restart immediately when streaming ends
            })
            .on('error', (err) => {
                console.error(`Error streaming video (${videoPath}):`, err.message);
                console.log('Attempting to restart the stream immediately...');
                startStream(); // Retry immediately on error
            })
            .run();
    };

    startStream();
};

const updateCamerasFromProxy = async () => {
    try {
        console.log('Fetching proxy data...');

        // Fetch proxy data
        const response = await axios.get(apiUrl, {
            httpsAgent,
            headers: { 'Authorization': basicAuth },
        });

        const proxies = response.data.proxies;

        // Log to see if proxies are received
        console.log('Received Proxies:', JSON.stringify(proxies, null, 2));

        if (!proxies || proxies.length === 0) {
            console.log('No proxies found.');
            return;
        }

        // Prepare bulk update operations
        const bulkOperations = proxies.map(proxy => {
            // console.log(`Processing proxy: ${proxy.name}`);

            return {
                updateOne: {
                    filter: { deviceId: proxy.name }, // Ensure deviceId matches exactly
                    update: {
                        $set: {
                            lastStartTime: proxy.lastStartTime,
                            lastCloseTime: proxy.lastCloseTime,
                            status: proxy.status || 'offline'
                        }
                    }
                }
            };
        });

        console.log(`Total Updates Prepared: ${bulkOperations.length}`);

        // Execute bulkWrite if there are updates
        if (bulkOperations.length > 0) {
            const result = await p2predirect.bulkWrite(bulkOperations);
            console.log('MongoDB Update Result:', result);
        } else {
            console.log('No updates to perform.');
        }
    } catch (error) {
        console.error('Error updating cameras:', error.message);
    }
};

// Run the function every 10 seconds
// setInterval(updateCamerasFromProxy, 10000);

// list of all p2p cameras
exports.getP2PCameras = async (req, res) => {
    try {
        const { querySearch, page = 1, sortBy, order = 'desc', status } = req.query;

        // Validate page number
        let pageNumber = parseInt(page, 10);
        if (isNaN(pageNumber) || pageNumber < 1) {
            return res.status(400).json({ message: 'Invalid page number. Page number must be a positive number.' });
        }

        // Pagination
        const limit = 10;
        const offset = (pageNumber - 1) * limit;

        // Construct query filter
        let query = {};
        if (querySearch) {
            query.deviceId = { $regex: querySearch, $options: 'i' };
        }
        if (status && ['online', 'offline'].includes(status.toLowerCase())) {
            query.status = status.toLowerCase(); // Filter by status if provided
        }

        // Count total cameras matching the query
        const totalCamerasCount = await p2predirect.countDocuments(query);
        const totalPages = Math.ceil(totalCamerasCount / limit);

        // Sorting field validation
        const sortField = ['lastCloseTime', 'lastStartTime'].includes(sortBy) ? sortBy : 'lastCloseTime';
        const sortOrder = order === 'asc' ? 1 : -1;

        // Fetch cameras with sorting and filters
        const cameras = await p2predirect
            .find(query)
            .select('-__v -_id -productType')
            .sort({ [sortField]: sortOrder })
            .skip(offset)
            .limit(limit)
            .lean();

        if (!cameras.length) {
            return res.status(404).json({ message: 'No cameras found' });
        }

        res.status(200).json({
            data: cameras,
            resultPerPage: limit,
            currentPage: pageNumber,
            totalPages: totalPages,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.addP2PCamera = async (req, res) => {
    const { deviceId, productType, isPTZ } = req.body;
    try {
        const userEmail = req.user.email;
        // Regular expression for the format XXXX-XXXXXX-XXXXX
        const deviceIdPattern = /^[A-Z0-9]{4}-[A-Z0-9]{6}-[A-Z0-9]{5}$/;

        // Validate deviceId format
        if (!deviceIdPattern.test(deviceId)) {
            return res.status(400).json({ message: 'Invalid Device ID format. Expected format: XXXX-000000-XXXXX' });
        }


        if (!deviceId || !productType) {
            return res.status(400).json({ message: 'Device ID/ productType are required' });
        }

        // Check if the camera already exists
        const existp2p = await p2predirect.findOne({ deviceId });
        if (existp2p) {
            return res.status(400).json({ message: 'camera already exists' });
        }

        let mqttUrl = "mqtts://pro.arcisai.io:8883";

        if (productType.toLowerCase().includes("augentix")) {
            mqttUrl = "mqtts://pro.arcisai.io:8883";
        }

        const newp2p = new p2predirect({
            deviceId,
            productType,
            mqttUrl,
            isPTZ
        });
        await newp2p.save();

        const history = new History({
            email: userEmail,
            deviceId,
            afterChange: deviceId,
            actionType: "Added",
            timestamp: new Date(),
        });
        await history.save();

        // Handle Video on Demand product type
        // if (productType === "vod") {
        //     if (!req.file) {
        //         return res.status(400).send('No file uploaded.');
        //     }

        //     const videoPath = path.resolve(req.file.path);
        //     console.log(`Video file path resolved: ${videoPath}`);

        //     // Check if the video file exists
        //     if (!fs.existsSync(videoPath)) {
        //         return res.status(400).send('Uploaded video file not found.');
        //     }

        //     // Check if a stream for this deviceId is already running
        //     if (activeStreams[deviceId]) {
        //         return res.status(400).send(`Streaming is already active for Device ID: ${deviceId}.`);
        //     }

        //     // Start the video streaming
        //     console.log(`Starting video stream for device ID: ${deviceId}`);
        //     streamVideo(videoPath, deviceId);
        // }

        return res.status(201).json({ message: 'P2P camera added successfully' });
    } catch (error) {
        console.error("Error in addP2PCamera:", error);
        res.status(500).json({ message: error.message });
    }
};

// checck p2p camera exists or not
exports.checkP2PCameraExists = async (req, res) => {
    try {
        const { deviceId } = req.body;
        const existp2p = await p2predirect.findOne({ deviceId });
        if (existp2p) {
            return res.status(200).json({ exist: true, data: existp2p.productType, isPTZ: existp2p.isPTZ });
        }

        res.status(200).json({ exist: false });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// get config
exports.getConfig = async (req, res) => {
    try {
        const deviceId = req.query.deviceId;

        if (!deviceId) {
            return res.status(400).json({ message: 'Device ID is required' });
        }

        const config = await Config.findOne({ topic: deviceId });
        if (!config) {
            return res.status(404).json({ message: 'Config not found' });
        }
        return res.status(200).json(config);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// update config
exports.updateConfig = async (req, res) => {
    try {
        const { topic } = req.params;
        const existConfig = await Config.findOne({ topic });
        if (!existConfig) {
            return res.status(404).json({ message: 'Config not found' });
        }

        const updatedConfig = await Config.findOneAndUpdate({ topic }, req.body, { new: true });

        return res.status(200).json({ message: 'Config updated successfully' });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

// enable rtsp
exports.enableRtsp = async (req, res) => {
    try {
        const { deviceId, port } = req.body;
        const existp2p = await p2predirect.findOne({ deviceId });
        if (!existp2p) {
            return res.status(400).json({ message: 'P2P camera not found' });
        }
        console.log('Requested port:', port);
        const remotePortRtspexist = await Config.findOne({ remotePortRtsp: Math.floor(port) });
        console.log('remotePortRtspexist', remotePortRtspexist)
        if (!remotePortRtspexist) {
            const updateConfig = await Config.findOneAndUpdate(
                { topic: deviceId },
                { $set: { typeRtsp: "tcp", local_portRtsp: 554, local_ipRtsp: "127.0.0.1", remotePortRtsp: port, subdomainRtsp: `RTSP-${deviceId}` } },
                { new: true }
            );
            console.log('Updated Config:', updateConfig);
            return res.status(200).json({ message: 'RTSP enabled successfully', data: updateConfig });
        }
        else if (remotePortRtspexist.topic === deviceId) {
            return res.status(200).json({ message: 'RTSP port matches existing deviceId' });
        }
        else if (remotePortRtspexist) {
            return res.status(400).json({ message: 'RTSP port already exists' });
        }

    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// disable rtsp
exports.disableRtsp = async (req, res) => {
    try {
        const { deviceId } = req.body;

        // Check if the P2P camera exists
        const existp2p = await p2predirect.findOne({ deviceId });
        if (!existp2p) {
            return res.status(400).json({ message: 'P2P camera not found' });
        }

        // Remove the specified fields from the document
        const updateConfig = await Config.findOneAndUpdate(
            { topic: deviceId },
            {
                $unset: {
                    typeRtsp: "",
                    local_portRtsp: "",
                    local_ipRtsp: "",
                    remotePortRtsp: "",
                    subdomainRtsp: ""
                }
            },
            { new: true }
        );

        if (!updateConfig) {
            return res.status(404).json({ message: 'Configuration not found' });
        }

        res.status(200).json({ message: 'RTSP fields removed successfully', updateConfig });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// get all planNames from Configs
exports.getAllPlanNames = async (req, res) => {
    const deviceId = req.body.deviceId;
    try {
        const planNames = await Config.find({ topic: { $in: deviceId } }).select('planName topic')

        res.status(200).json({ planNames });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Add multi P2P camera
exports.addMultipleP2PCameras = async (req, res) => {
    // 1. We expect the Excel row to have: deviceId, productType, and isPTZ
    const cameras = req.body.cameras;

    if (!Array.isArray(cameras) || cameras.length === 0) {
        return res.status(400).json({ message: 'Invalid input. Please provide an array of cameras.' });
    }

    try {
        const historyEntries = [];

        // Get existing devices for "beforeChange" logging
        const existingDocs = await p2predirect.find({
            deviceId: { $in: cameras.map(c => c.deviceId.trim()) }
        }).lean();

        const existingMap = new Map();
        existingDocs.forEach(doc => {
            existingMap.set(doc.deviceId, doc);
        });

        const bulkOps = cameras.map(({ deviceId, productType, isPTZ }) => {
            const trimmedId = deviceId.trim();
            const trimmedType = productType.trim();

            // 2. Logic: Ensure it is strictly 0 or 1
            // If Excel sends "1" or 1, save 1. Everything else becomes 0.
            const ptzValue = (isPTZ == 1) ? 1 : 0;

            const beforeChange = existingMap.get(trimmedId) || null;

            // Determine mqttUrl based on productType
            const mqttUrl = "mqtts://pro.arcisai.io:8883";

            // Prepare history entry
            historyEntries.push({
                email: req.user?.email || "system",
                deviceId: trimmedId,
                beforeChange,
                afterChange: {
                    productType: trimmedType,
                    mqttUrl,
                    isPTZ: ptzValue // Logs 0 or 1
                },
                actionType: beforeChange ? "update" : "insert",
            });

            return {
                updateOne: {
                    filter: { deviceId: trimmedId },
                    update: {
                        $set: {
                            productType: trimmedType,
                            mqttUrl,
                            isPTZ: ptzValue // Saves 0 or 1 to DB
                        }
                    },
                    upsert: true
                }
            };
        });

        const result = await p2predirect.bulkWrite(bulkOps);
        await History.insertMany(historyEntries);

        return res.status(201).json({
            message: 'P2P cameras processed successfully',
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount,
            upsertedCount: result.upsertedCount,
        });
    } catch (error) {
        console.error("Error in addMultipleP2PCameras:", error);
        res.status(500).json({ message: error.message });
    }
};


// add multi camera
exports.addMultipleCameras = async (req, res) => {
    const cameras = req.body.cameras; // Expecting an array of camera objects with deviceId and planName

    if (!Array.isArray(cameras) || cameras.length === 0) {
        return res.status(400).json({ message: 'Invalid input. Please provide an array of cameras.' });
    }

    try {
        // Validate the existence of the camera
        const deviceIds = cameras.map((camera) => camera.deviceId);

        // Regular expression for validating deviceId format
        // const deviceIdPattern = /^[A-Z0-9]{4}-[A-Z0-9]{6}-[A-Z0-9]{5}$/;

        // // Collect invalid device IDs
        // const invalidDeviceIds = cameras
        //     .filter(({ deviceId }) => !deviceIdPattern.test(deviceId))
        //     .map(({ deviceId }) => deviceId);

        // // If there are invalid device IDs, return them in the response
        // if (invalidDeviceIds.length > 0) {
        //     return res.status(400).json({
        //         message: 'Invalid Excel Format.'
        //     });
        // }

        // Fetch all p2predirect entries in one query
        const existingDevices = await p2predirect.find({ deviceId: { $in: deviceIds } });
        const existingDeviceMap = new Map(existingDevices.map((device) => [device.deviceId, device]));
        // Start a session for transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // const results = [];
            const configOps = [];
            const video1Ops = [];
            const video101Ops = [];
            const video102Ops = [];
            const imageOps = [];
            const firmwareOps = []; // Array to hold firmware data operations
            const historyOps = [];

            // Map through cameras and prepare operations
            await Promise.all(cameras.map(async (camera) => {
                const deviceId = camera.deviceId.replace(/\s+/g, '')

                // Determine type and local_port based on deviceId
                const type = deviceId.includes('AUGEN') ? 'https' : 'http';
                const localPort = deviceId.includes('AUGEN') ? 443 : 80;

                // Prepare Config Data
                const cfgdata = {
                    topic: deviceId,
                    type: type,
                    local_port: localPort,
                    local_ip: '127.0.0.1',
                    subdomain: deviceId,
                    host_header_rewrite: 'torqueverse.dev',
                    server_addr: 'p2p.arcisai.io',
                    server_port: 7000,
                    token: '12345678',
                    planName: 'LIVE',
                };
                configOps.push({
                    updateOne: {
                        filter: { topic: deviceId },
                        update: { $set: cfgdata },
                        upsert: true,
                    },
                });

                // Prepare Video1, Video101, Video102, and Image Data (omitted for brevity, unchanged from original code)
                const vid1data = {
                    brightnessLevel: 50,
                    contrastLevel: 50,
                    enabled: true,
                    flipEnabled: true,
                    hueLevel: 50,
                    mirrorEnabled: true,
                    powerLineFrequencyMode: 50,
                    privacyMask: Array.from({ length: 4 }, (_, i) => ({
                        id: i + 1,
                        enabled: false,
                        regionX: 0,
                        regionY: 0,
                        regionWidth: 0,
                        regionHeight: 0,
                        regionColor: '0',
                    })),
                    saturationLevel: 50,
                    sharpnessLevel: 50,
                };
                video1Ops.push({
                    updateOne: {
                        filter: { deviceId },
                        update: { $set: vid1data },
                        upsert: true,
                    }
                });

                const vid101data = {
                    ImageTransmissionModel: 2,
                    bitRateControlType: 'VBR',
                    channelName: 'ARCIS AI',
                    channelNameOverlay: { enabled: true, regionX: 1.15, regionY: 4.444445 },
                    codecType: 'H.264',
                    constantBitRate: 250,
                    datetimeOverlay: {
                        enabled: true,
                        regionX: 1.15,
                        regionY: 0,
                        dateFormat: 'YYYY-MM-DD',
                        timeFormat: 24,
                        displayWeek: false,
                        displayChinese: false,
                    },
                    deviceIDOverlay: { enabled: false, regionX: 0, regionY: 0 },
                    enabled: true,
                    expandChannelNameOverlay: Array.from({ length: 4 }, (_, i) => ({
                        expandChannelName: '',
                        id: i + 1,
                        enabled: false,
                        regionX: 0,
                        regionY: 0,
                    })),
                    frameRate: 15,
                    freeResolution: false,
                    gop: 2,
                    h264Profile: 'high',
                    id: 101,
                    keyFrameInterval: 30,
                    resolution: '1280x720',
                    textOverlays: '',
                    videoInputChannelID: 101,
                };
                video101Ops.push({
                    updateOne: {
                        filter: { deviceId },
                        update: { $set: vid101data },
                        upsert: true,
                    }
                });

                const vid102data = {
                    ImageTransmissionModel: 2,
                    bitRateControlType: 'VBR',
                    channelName: 'ARCIS AI',
                    codecType: 'H.264',
                    constantBitRate: 100,
                    enabled: true,
                    frameRate: 10,
                    freeResolution: false,
                    gop: 2,
                    h264Profile: 'baseline',
                    id: 102,
                    keyFrameInterval: 30,
                    resolution: '640x360',
                    videoInputChannelID: 102,
                };
                video102Ops.push({
                    updateOne: {
                        filter: { deviceId },
                        update: { $set: vid102data },
                        upsert: true,
                    }
                })

                const imgdata = {
                    BLcompensationMode: 'auto',
                    WDR: { enabled: true, WDRStrength: 1 },
                    awbMode: 'indoor',
                    denoise3d: { enabled: true, denoise3dStrength: 3 },
                    exposureMode: 'auto',
                    imageStyle: 1,
                    irCutFilter: { irCutControlMode: 'hardware', irCutMode: 'smart' },
                    lowlightMode: 'only night',
                    manualSharpness: { enabled: true, sharpnessLevel: 1 },
                    sceneMode: 'indoor',
                    videoMode: {
                        FixParam: Array.from({ length: 2 }, (_, i) => ({
                            id: i,
                            CenterCoordinateX: 0,
                            CenterCoordinateY: 0,
                            Radius: 0,
                            AngleX: 0,
                            AngleY: 0,
                            AngleZ: 0,
                        })),
                    },
                };
                imageOps.push({
                    updateOne: {
                        filter: { deviceId },
                        update: { $set: imgdata },
                        upsert: true,
                    }
                });

                // Additional firmware update logic for ATPL and VSPL device IDs
                if (deviceId.startsWith('ATPL')) {
                    firmwareOps.push({
                        updateOne: {
                            filter: { deviceId },
                            update: {
                                $set: {
                                    deviceId,
                                    mqttUrl: "mqtts://pro.arcisai.io:8883",
                                    productType: "PTZ_S_Series",
                                    p2pAmbicam: "P2Pambicam_0.8",
                                    vcamAmbicam: "vcamclient-uclinux_0.9",
                                    firmware: "SIGMA_KITTY_0.9.7"
                                }
                            },
                            upsert: true,
                        },
                    });
                }

                if (deviceId.startsWith('VSPL')) {
                    firmwareOps.push({
                        updateOne: {
                            filter: { deviceId },
                            update: {
                                $set: {
                                    deviceId,
                                    mqttUrl: "mqtts://pro.arcisai.io:8883",
                                    productType: "VSPL",
                                    p2pAmbicam: "P2Pambicam_0.8",
                                    vcamAmbicam: "vcamclient-uclinux_0.9",
                                    firmware: "VSPL_KITTY_0.9.6"
                                }
                            },
                            upsert: true,
                        },
                    });
                }

                const historyData = {
                    email: req.user.email,
                    deviceId: deviceId,
                    beforeChange: {},
                    afterChange: {},
                    actionType: 'add config',
                };
                historyOps.push({
                    updateOne: {
                        filter: { deviceId },
                        update: { $set: historyData },
                        upsert: true,
                    }
                });

            }));


            // Execute bulk writes for all collections
            await Config.bulkWrite(configOps, { session });
            await video1.bulkWrite(video1Ops, { session });
            await video101.bulkWrite(video101Ops, { session });
            await video102.bulkWrite(video102Ops, { session });
            await image.bulkWrite(imageOps, { session });
            await firmware.bulkWrite(firmwareOps, { session }); // Bulk add firmware data
            await History.bulkWrite(historyOps, { session });

            await session.commitTransaction();
            res.status(201).json({ message: 'Cameras processed successfully' });
        } catch (error) {
            await session.abortTransaction();
            res.status(500).json({ message: 'Transaction failed', error: error.message });
        } finally {
            session.endSession();
        }
    } catch (error) {
        console.error('Error in addMultipleCameras:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.createNvr = async (req, res) => {
    const { nvrId, nvrName, channel, email } = req.body;

    try {
        // Check for missing fields
        if (!nvrId || !nvrName || !channel || !email) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // Check if NVR already exists
        const nvrData = await nvr.findOne({ nvrId });
        if (nvrData) {
            return res.status(400).json({ message: 'NVR already exists' });
        }

        // Create and save the new NVR
        const newNvr = new nvr({
            nvrId,
            nvrName,
            channel,
            email,
        });
        await newNvr.save();

        // Initialize an array to track errors
        const errorMessages = [];

        // Iterate for the number of channels
        for (let i = 1; i <= channel; i++) {
            const deviceId = `${nvrId}_ch_${i}`;
            const name = `${nvrName}_ch_${i}`;

            try {
                // Make POST request for each channel
                await instance.post('/addNvrCamera', {
                    deviceId,
                    email,
                    name,
                    productType: "NVR",
                });
            } catch (error) {
                // Collect error messages
                const errorMessage = `Failed to add channel ${i}: ${error.response?.data?.message || error.message}`;
                errorMessages.push(errorMessage);
            }
        }

        // Respond with appropriate message based on errors
        if (errorMessages.length > 0) {
            return res.status(207).json({
                message: 'Email not registered',
                errors: errorMessages,
            });
        }

        res.status(201).json({ message: 'NVR created successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



//  get nvr
exports.getNvr = async (req, res) => {
    try {
        const { nvrName = '', page = 1 } = req.query;
        console.log("dataa", nvrName, page);

        // Define pagination limit and offset
        const limit = 10;
        const offset = (page - 1) * limit;

        // Retrieve all P2P cameras from the database, filtering by deviceId if querySearch is provided
        const query = nvrName ? { nvrName: { $regex: nvrName, $options: 'i' } } : {};
        const totalCamerasCount = await nvr.countDocuments(query);

        // Calculate total pages
        const totalPages = Math.ceil(totalCamerasCount / limit);

        const cameras = await nvr.find(query).select('-__v').skip(offset).limit(limit).lean();

        if (!cameras || cameras.length === 0) {
            return res.status(404).json({ message: 'No Nvr found' });
        }

        // Respond with the updated cameras
        res.status(200).json({
            data: cameras,
            resultPerPage: limit,
            currentPage: page,
            totalPages: totalPages,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// update nvr
exports.updateNvr = async (req, res) => {
    const { nvrId } = req.query
    const { nvrName, email } = req.body
    try {
        const nvrData = await nvr.findOne({ nvrId })
        if (!nvrData) {
            return res.status(404).json({ message: 'NVR not found' })
        }

        // Iterate over the channels and update each camera
        for (let i = 1; i <= nvrData.channel; i++) {
            const deviceId = `${nvrId}_ch_${i}`;

            // Send POST request to update the camera
            await instance.post('/updateNvrCamera', {
                deviceId,
                email: email
            });
        }

        await nvr.updateOne({ nvrId }, { $set: { nvrName, email } })
        res.status(200).json({ message: 'NVR updated successfully' })
    }
    catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}

// Delete NVR
exports.deleteNvr = async (req, res) => {
    const { nvrId } = req.body;

    try {
        // Find the NVR in the database
        const nvrData = await nvr.findOne({ nvrId });
        if (!nvrData) {
            return res.status(404).json({ message: 'NVR not found' });
        }

        // Extract channel count and email
        const { channel } = nvrData;

        // Iterate over channels and send delete requests
        for (let i = 1; i <= channel; i++) {
            const deviceId = `${nvrId}_ch_${i}`;

            // Make DELETE request for each channel
            await instance.post('/deleteNvrCamera',
                { deviceId: deviceId }
            );
        }

        // Delete the NVR from the database
        await nvr.deleteOne({ nvrId });

        res.status(200).json({ message: 'NVR and its channels deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
        console.log(error);
    }
};

// add firmware 
exports.addFirmware = async (req, res) => {
    try {
        const { deviceId, productType } = req.body;
        const existFirmware = await firmware.findOne({ deviceId });
        if (existFirmware) {
            return res.status(400).json({ message: 'Firmware already exists' });
        }

        if (deviceId.startsWith('ATPL')) {
            const firmwareData = {
                deviceId: deviceId,
                mqttUrl: "mqtts://pro.arcisai.io:8883",
                productType: productType,
                p2pAmbicam: "P2Pambicam_0.8",
                vcamAmbicam: "vcamclient-uclinux_0.9",
                firmware: "SIGMA_KITTY_0.9.7"
            }
            await firmware.updateOne({ deviceId }, { $set: firmwareData }, { upsert: true })
            return res.status(200).json({ message: 'Firmware added successfully' })
        }
        if (deviceId.startsWith('VSPL')) {
            const firmwareData = {
                deviceId: deviceId,
                mqttUrl: "mqtts://pro.arcisai.io:8883",
                productType: productType,
                p2pAmbicam: "P2Pambicam_0.8",
                vcamAmbicam: "vcamclient-uclinux_0.9",
                firmware: "VSPL_KITTY_0.9.6"
            }
            await firmware.updateOne({ deviceId }, { $set: firmwareData }, { upsert: true })
            return res.status(200).json({ message: 'Firmware added successfully' })
        }
    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// generaye random digits
const generateRandomDigits = (length) => {
    return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
};

// generate random letters
const generateRandomLetters = (length) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
};

// generate device ID
exports.generateDeviceId = async (req, res) => {
    try {
        const { productType, networkType, count } = req.body;
        const prefix = "ATPL";

        const productMap = {
            "S-Series": "S",
            "A-Series": "A",
            "Novatek": "N",
            "Innofusion": "I"
        };

        const networkMap = {
            "POE": "0",
            "WIFI": "1",
            "4G": "2",
            "5G": "3"
        };

        if (!productMap[productType]) {
            return res.status(400).json({ message: 'Invalid product type' });
        }

        if (!networkMap[networkType]) {
            return res.status(400).json({ message: 'Invalid network type' });
        }

        const networkDigit = networkMap[networkType];
        const seriesLetter = productMap[productType];

        const generatedDocs = new Set();

        while (generatedDocs.size < count) {
            const randomDigits = generateRandomDigits(5);
            const randomLetters = generateRandomLetters(4);
            const deviceId = `${prefix}-${networkDigit}${randomDigits}-${seriesLetter}${randomLetters}`;

            const exists = await Uids.findOne({ deviceId });
            if (!exists && !generatedDocs.has(deviceId)) {
                generatedDocs.add(deviceId);
            }
        }

        // Build documents to insert
        const toInsert = Array.from(generatedDocs).map(deviceId => ({
            deviceId,
            SN: deviceId,
            productType,
            networkType
        }));

        await Uids.insertMany(toInsert);

        res.status(201).json({
            message: 'Device IDs generated successfully',
            deviceIds: toInsert.map(doc => doc.deviceId)
        });

    } catch (error) {
        console.error("Error in generateDeviceId:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.getAllDeviceIds = async (req, res) => {
    try {
        const { productType, burned, networkType, deviceId, page = 1 } = req.query;

        const query = {};
        if (productType) query.productType = productType;
        if (networkType) query.networkType = networkType;
        if (deviceId) query.deviceId = deviceId;

        // Handle burned filter (convert string to boolean)
        if (burned === 'true') query.burned = true;

        const limit = 20;
        const skip = (page - 1) * limit;

        const totalDocuments = await Uids.countDocuments(query);
        const totalPages = Math.ceil(totalDocuments / limit);

        const deviceIds = await Uids.find(query).skip(skip).limit(limit).lean();

        if (!deviceIds || deviceIds.length === 0) {
            return res.status(404).json({ message: 'No device IDs found' });
        }

        res.status(200).json({
            currentPage: parseInt(page),
            totalPages,
            totalRecords: totalDocuments,
            data: deviceIds
        });

    } catch (error) {
        console.error("Error in getAllDeviceIds:", error);
        res.status(500).json({ message: error.message });
    }
};

// Burn device ID
exports.burnDeviceId = async (req, res) => {
    try {
        const { productType, networkType } = req.body;

        if (!productType || !networkType) {
            return res.status(400).json({ message: 'productType and networkType are required' });
        }

        // Find one unburned ID matching both productType and networkType
        const device = await Uids.findOne({
            productType,
            networkType,
            burned: { $ne: true }
        }).sort({ _id: 1 }); // optional: oldest first

        if (!device) {
            return res.status(404).json({ message: 'No available unburned device ID found' });
        }

        const macAddr = await macModel.findOne({ burned: false }).sort({ _id: 1 });
        if (!macAddr) {
            return res.status(404).json({ message: 'No available unburned MAC address found' });
        }

        const wifiMacAddr = await macWifiModel.findOne({ burned: false }).sort({ _id: 1 });
        if (!wifiMacAddr) {
            return res.status(404).json({ message: 'No available unburned WiFi MAC address found' });
        }

        device.burned = true;
        device.burnedDate = new Date().toISOString();
        device.macAddr = macAddr.macAddr;
        device.macWifiAddr = wifiMacAddr.macWifiAddr;
        await device.save();

        // Mark the MAC addresses as burned
        macAddr.burned = true;
        await macAddr.save();
        wifiMacAddr.burned = true;
        await wifiMacAddr.save();

        res.status(200).json({
            message: 'Device ID burned successfully',
            deviceId: device.deviceId,
            macAddress: device.macAddr
        });
    } catch (error) {
        console.error("Error in burnDeviceId:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.burningDeviceIdMacId = async (req, res) => {
    try {

    } catch (error) {
        console.error("Error in burnDeviceId:", error);
        res.status(500).json({ message: error.message });
    }
}