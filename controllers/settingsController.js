

const mqtt = require('mqtt');
const appTopicSend = 'torque/app/tx/';
const appTopicReceive = 'torque/app/rx/';
const video101 = require('../models/video101');
const video1 = require('../models/video1');
const network = require('../models/network');
const image = require('../models/image');
const deviceinfo = require('../models/deviceinfo');
const time = require('../models/time');
const video102 = require('../models/video102');
const axios = require('axios');
const firmware = require('../models/firmware');

/////////////////////// DATABASE INVOLVED ////////////////////////

// Get Video Encode Channel 101
// exports.getVideoEncodeChannelMain = async (req, res) => {
//     const deviceId = req.query.deviceId;
//     let responseSent = false; // Flag to prevent multiple responses

//     try {
//         const vi101 = await video101.findOne({ deviceId }).select('-_id -__v');

//         if (!vi101) {
//             return res.status(200).json({ message: 'Video encode channel data not found' });
//         }

//         res.status(200).json(vi101);
//     } catch (error) {
//         if (!responseSent) {
//             responseSent = true;
//             console.error('Catch Error:', error);
//             res.status(500).json({ message: 'Error fetching video encode channel data' });
//         }
//     }
// };

exports.getVideoEncodeChannelMain = async (req, res) => {
    const deviceId = req.query.deviceId;
    let responseSent = false; // Flag to prevent multiple responses
    try {
        const options = {
            username: process.env.mqttuser,
            password: process.env.password,
        };

        const client = mqtt.connect(process.env.mqtt_broker_url, options);
        // Set a timeout for the response
        const timeout = setTimeout(() => {
            if (!responseSent) {
                responseSent = true;
                console.error("Timeout: Camera might be out of network");
                res.status(504).json({ message: "Camera might be out of network" });
                client.end(); // Close the MQTT connection
            }
        }, 15000); // 15 seconds

        client.on("message", (topic, message) => {
            if (!responseSent) {
                responseSent = true; // Set the flag to true
                clearTimeout(timeout); // Clear the timeout

                try {
                    const parsedMessage = JSON.parse(message.toString());
                    console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

                    client.end(() => {
                        res.status(200).json(parsedMessage);
                    });
                } catch (err) {
                    console.error("Error parsing JSON:", err);
                    res.status(500).send("Invalid JSON format in the message body.");
                    client.end();
                }
            }
        });

        client.on("connect", () => {
            console.log("Connected to the device");

            client.subscribe(`${appTopicReceive}${deviceId}/2`, (err) => {
                if (err) {
                    console.error("Subscription error:", err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/2`, "GET NTP");
                }
            });
        });

        client.on("error", (err) => {
            if (!responseSent) {
                responseSent = true;
                clearTimeout(timeout); // Clear the timeout
                console.error("MQTT Client Error:", err);
                res.status(500).json({ message: "Error with MQTT client" });
            }
        });
    } catch (error) {
        if (!responseSent) {
            responseSent = true;
            console.error(error);
            res
                .status(500)
                .json({ message: "Error fetching video encode channel data" });
        }
    }
};

// set Video Encode Channel 101
exports.setVideoEncodeChannelMain = async (req, res) => {
    const { codecType, resolution, bitRateControlType, constantBitRate, frameRate } = req.body;
    const deviceId = req.query.deviceId;
    let responseSent = false; // Flag to prevent multiple responses
    console.log(req.body);
    console.log(req.query);
    const videoConfig = {
        codecType, //
        // h264Profile,
        resolution, //
        // freeResolution,
        bitRateControlType, //
        constantBitRate: Math.floor(constantBitRate), //
        frameRate: Math.floor(frameRate),
    };

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
                // const splitMessage = messageString.split('\r\n\r\n');

                // if (splitMessage.length > 1) {
                // const jsonBody = splitMessage[1]; // The JSON part should be after the headers

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
                // }
                // else {
                //   console.error('No JSON body found in the message.');
                //   res.status(500).send('No JSON body found in the message.');
                //   client.end();
                // }
            }
        });

        client.on('connect', () => {
            console.log('Connected to the device');

            client.subscribe(`${appTopicReceive}${deviceId}/19`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/19`, JSON.stringify(videoConfig));
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
        res.status(error.response ? error.response.status : 500).json({
            message: error.message,
            error: error.response ? error.response.data : null
        });
    }
};

// Get Video Encode Channel 102
exports.getVideoEncodeChannelSub = async (req, res) => {
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
                // const splitMessage = messageString.split('\r\n\r\n');

                // if (splitMessage.length > 1) {
                // const jsonBody = splitMessage[1]; // The JSON part should be after the headers

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
                // }
                // else {
                //   console.error('No JSON body found in the message.');
                //   res.status(500).send('No JSON body found in the message.');
                //   client.end();
                // }
            }
        });

        client.on('connect', () => {
            console.log('Connected to the device');

            client.subscribe(`${appTopicReceive}${deviceId}/39`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/39`, "GET VIDEO SETTINGS");
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
        console.error(error);
        res.status(error.response ? error.response.status : 500).send(error.message);
    }
};

// Set Video Encode Channel 102
exports.setVideoEncodeChannelSub = async (req, res) => {
    const { codecType, h264Profile, resolution, freeResolution, bitRateControlType, constantBitRate, frameRate, } = req.body;
    const deviceId = req.query.deviceId;
    let responseSent = false; // Flag to prevent multiple responses
    const videoConfig = {
        codecType,
        h264Profile,
        resolution,
        freeResolution,
        bitRateControlType,
        constantBitRate,
        frameRate
    };

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

            client.subscribe(`${appTopicReceive}${deviceId}/40`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/40`, JSON.stringify(videoConfig));
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
        res.status(error.response ? error.response.status : 500).json({
            message: error.message,
            error: error.response ? error.response.data : null
        });
    }
};

// GET VIDEO CHANNEL 1
// exports.getVideoSettings = async (req, res) => {
//     const deviceId = req.query.deviceId;
//     try {
//         const video = await video1.findOne({ deviceId: deviceId }).select('-_id -__v');
//         if (!video) {
//             return res.status(200).json({ message: 'Video settings not found' });
//         }
//         res.status(200).json(video);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Error fetching video encode channel data' });
//     }
// };

// Get Video Encode Channel 102
exports.getVideoSettings = async (req, res) => {
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
                // const splitMessage = messageString.split('\r\n\r\n');

                // if (splitMessage.length > 1) {
                // const jsonBody = splitMessage[1]; // The JSON part should be after the headers

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
                // }
                // else {
                //   console.error('No JSON body found in the message.');
                //   res.status(500).send('No JSON body found in the message.');
                //   client.end();
                // }
            }
        });

        client.on('connect', () => {
            console.log('Connected to the device');

            client.subscribe(`${appTopicReceive}${deviceId}/6`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/6`, "GET VIDEO SETTINGS 1");
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
        console.error(error);
        res.status(error.response ? error.response.status : 500).send(error.message);
    }
};

// SET VIDEO CHANNEL 1
exports.setVideoSettings = async (req, res) => {
    // const deviceid = req.query.deviceid
    // console.log(deviceid)
    const { contrastLevel, brightnessLevel, saturationLevel, hueLevel, sharpnessLevel, flipEnabled, mirrorEnabled } = req.body;
    const deviceId = req.query.deviceId;
    let responseSent = false; // Flag to prevent multiple responses
    const settings = {
        contrastLevel: Math.floor(contrastLevel),
        brightnessLevel: Math.floor(brightnessLevel),
        saturationLevel: Math.floor(saturationLevel),
        hueLevel: Math.floor(hueLevel),
        sharpnessLevel: Math.floor(sharpnessLevel),
        flipEnabled,
        mirrorEnabled,
    };

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
                // const splitMessage = messageString.split('\r\n\r\n');

                // if (splitMessage.length > 1) {
                // const jsonBody = splitMessage[1]; // The JSON part should be after the headers

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
                // }
                // else {
                //   console.error('No JSON body found in the message.');
                //   res.status(500).send('No JSON body found in the message.');
                //   client.end();
                // }
            }
        });

        client.on('connect', () => {
            console.log('Connected to the device');

            client.subscribe(`${appTopicReceive}${deviceId}/20`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/20`, JSON.stringify(settings));
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
        // console.error('Error updating settings:', error);
        res.status(error.response ? error.response.status : 500).json({
            message: error.message,
            error: error.response ? error.response.data : null
        });
    }
};

// Get Network Interface Settings
exports.getNetworkInterfaceSettings = async (req, res) => {
    const deviceId = req.query.deviceId;
    try {
        const networkInterface = await network.findOne({ deviceId: deviceId }).select('-_id -__v');
        if (!networkInterface) {
            return res.status(200).json({ message: 'Network Interface settings not found' });
        }
        res.status(200).json(networkInterface);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching video encode channel data' });
    }
}

// get net info
exports.netInfo = async (req, res) => {

    const deviceId = req.query.deviceId;
    let responseSent = false; // Flag to prevent multiple responses
    // console.log(AlarmOut.AudioAlert)


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
                // const splitMessage = messageString.split('\r\n\r\n');

                // if (splitMessage.length > 1) {
                // const jsonBody = splitMessage[1]; // The JSON part should be after the headers

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
                // }
                // else {
                //   console.error('No JSON body found in the message.');
                //   res.status(500).send('No JSON body found in the message.');
                //   client.end();
                // }
            }
        });

        client.on('connect', () => {
            console.log('Connected to the device');

            client.subscribe(`${appTopicReceive}${deviceId}/34`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/34`, 'get net info');
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

// get image info
// exports.getImageInfo = async (req, res) => {
//     const deviceId = req.query.deviceId;

//     try {
//         const img = await image.findOne({ deviceId: deviceId }).select('-_id -__v');
//         if (!img) {
//             return res.status(200).json({ message: 'Image info not found' });
//         }
//         res.status(200).json(img);
//     } catch (error) {
//         console.error('Error updating Set UnattendedObjDetect:', error);
//         res.status(500).json({
//             statusCode: 1,
//             statusMessage: 'Error updating Set UnattendedObjDetect',
//         });
//     }
// };

// Get Video Encode Channel 102
exports.getImageInfo = async (req, res) => {
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
                // const splitMessage = messageString.split('\r\n\r\n');

                // if (splitMessage.length > 1) {
                // const jsonBody = splitMessage[1]; // The JSON part should be after the headers

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
                // }
                // else {
                //   console.error('No JSON body found in the message.');
                //   res.status(500).send('No JSON body found in the message.');
                //   client.end();
                // }
            }
        });

        client.on('connect', () => {
            console.log('Connected to the device');

            client.subscribe(`${appTopicReceive}${deviceId}/38`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/38`, "GET IMAGE SETTINGS");
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
        console.error(error);
        res.status(error.response ? error.response.status : 500).send(error.message);
    }
};

// set image info
exports.setImageInfo = async (req, res) => {
    const { irCutMode } = req.body;
    const deviceId = req.query.deviceId;
    let responseSent = false; // Flag to prevent multiple responses
    try {
        const options = {
            username: process.env.mqttuser,
            password: process.env.password,
        };

        const setting = {
            irCutFilter: {
                irCutMode: irCutMode
            }
        }
        const client = mqtt.connect(process.env.mqtt_broker_url, options);

        client.on('message', (topic, message) => {
            if (!responseSent) {
                responseSent = true; // Set the flag to true
                const messageString = message.toString();
                console.log(`Message on topic ${topic}:`, messageString);
                // const splitMessage = messageString.split('\r\n\r\n');

                // if (splitMessage.length > 1) {
                // const jsonBody = splitMessage[1]; // The JSON part should be after the headers

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
                // }
                // else {
                //   console.error('No JSON body found in the message.');
                //   res.status(500).send('No JSON body found in the message.');
                //   client.end();
                // }
            }
        });

        client.on('connect', () => {
            console.log('Connected to the device');

            client.subscribe(`${appTopicReceive}${deviceId}/21`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/21`, JSON.stringify(setting));
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
        res.status(error.response ? error.response.status : 500).json({
            message: error.message,
            error: error.response ? error.response.data : null
        });
    }
}

// SET OSD SETTINGS
exports.OSDController = async (req, res) => {
    const requestBody = req.body;
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
                // const splitMessage = messageString.split('\r\n\r\n');

                // if (splitMessage.length > 1) {
                // const jsonBody = splitMessage[1]; // The JSON part should be after the headers


                // to be sent to the device
                // {
                //   "channelNameOverlay": {
                //     "enabled": false,
                //     "regionX": 12,
                //     "regionY": 90
                //   },
                //   "datetimeOverlay": {
                //     "enabled": false,
                //     "regionX": 70,
                //     "regionY": 2,
                //     "dateFormat": "MM/DD/YYYY",
                //     "timeFormat": 24,
                //     "displayWeek": false,
                //     "displayChinese": false
                //   },
                //   "deviceIDOverlay": {
                //     "enabled": false,
                //     "regionX": 0,
                //     "regionY": 0
                //   }
                // }

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
                // }
                // else {
                //   console.error('No JSON body found in the message.');
                //   res.status(500).send('No JSON body found in the message.');
                //   client.end();
                // }
            }
        });

        client.on('connect', () => {
            console.log('Connected to the device');

            client.subscribe(`${appTopicReceive}${deviceId}/22`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/22`, JSON.stringify(requestBody));
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
        console.error('Error:', error.message);
        res.status(error.response ? error.response.status : 500).json({
            message: error.message,
            error: error.response ? error.response.data : null
        });
    }
};

// GET DEVICE INFO
exports.getDeviceInfo = async (req, res) => {
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
                // const splitMessage = messageString.split('\r\n\r\n');

                // if (splitMessage.length > 1) {
                // const jsonBody = splitMessage[1]; // The JSON part should be after the headers

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
                // }
                // else {
                //   console.error('No JSON body found in the message.');
                //   res.status(500).send('No JSON body found in the message.');
                //   client.end();
                // }
            }
        });

        client.on('connect', () => {
            console.log('Connected to the device');

            client.subscribe(`${appTopicReceive}${deviceId}/8`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/8`, 'get net info');
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
        console.error(error);
        res.status(500).json({ message: 'Error fetching Device Information' });
    }
};

// GET TIME SETTINGS
exports.getTimesettings = async (req, res) => {
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
                // const splitMessage = messageString.split('\r\n\r\n');

                // if (splitMessage.length > 1) {
                // const jsonBody = splitMessage[1]; // The JSON part should be after the headers

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
                // }
                // else {
                //   console.error('No JSON body found in the message.');
                //   res.status(500).send('No JSON body found in the message.');
                //   client.end();
                // }
            }
        });

        client.on('connect', () => {
            console.log('Connected to the device');

            client.subscribe(`${appTopicReceive}${deviceId}/58`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/58`, "GET TIME SETTINGS");
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
        console.error(error);
        res.status(error.response ? error.response.status : 500).send(error.message);
    }
};

// SET NTP SETTINGS
exports.setTimesettings = async (req, res) => {
    const { ntpEnabled, ntpServerDomain } = req.body;
    const deviceId = req.query.deviceId;
    let responseSent = false; // Flag to prevent multiple responses
    try {
        const options = {
            username: process.env.mqttuser,
            password: process.env.password,
        };

        let ntpSettings = {
            ntpEnabled: ntpEnabled,
            ntpServerDomain: ntpServerDomain,
        };

        const client = mqtt.connect(process.env.mqtt_broker_url, options);

        client.on('message', (topic, message) => {
            if (!responseSent) {
                responseSent = true; // Set the flag to true
                const messageString = message.toString();
                console.log(`Message on topic ${topic}:`, messageString);
                // const splitMessage = messageString.split('\r\n\r\n');

                // if (splitMessage.length > 1) {
                // const jsonBody = splitMessage[1]; // The JSON part should be after the headers

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
                // }
                // else {
                //   console.error('No JSON body found in the message.');
                //   res.status(500).send('No JSON body found in the message.');
                //   client.end();
                // }
            }
        });

        client.on('connect', () => {
            console.log('Connected to the device');

            client.subscribe(`${appTopicReceive}${deviceId}/23`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/23`, JSON.stringify(ntpSettings));
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
        console.error(error);
        res.status(error.response ? error.response.status : 500).send(error.message);
    }
}

//////////////////////////   DATABASE NOT INVOLVED   //////////////////////////
// Get ISP
exports.getISP = async (req, res) => {
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
                // const messageString = message.toString();
                // const splitMessage = messageString.split('\r\n\r\n');

                // if (splitMessage.length > 1) {
                // const jsonBody = splitMessage[1]; // The JSON part should be after the headers

                try {
                    const parsedMessage = JSON.parse(message.toString());
                    console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

                    client.end(() => {
                        res.status(200).json(parsedMessage);
                    });
                } catch (err) {
                    console.error('Error parsing JSON:', err);
                    res.status(500).send('Invalid JSON format in the message body.');
                    client.end();
                }
                // } else {
                //   console.error('No JSON body found in the message.');
                //   res.status(500).send('No JSON body found in the message.');
                //   client.end();
                // }
            }
        });

        client.on('connect', () => {
            console.log('Connected to the device');

            client.subscribe(`${appTopicReceive}${deviceId}/3`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/3`, 'Get config Image Dwdr');
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
        console.error(error);
        res.status(500).json({ message: 'Error fetching video encode channel data' });
    }
};

// Get DNS Settings
exports.getDNSSettings = async (req, res) => {
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
                // const messageString = message.toString();
                // const splitMessage = messageString.split('\r\n\r\n');

                // if (splitMessage.length > 1) {
                // const jsonBody = splitMessage[1]; // The JSON part should be after the headers

                try {
                    const parsedMessage = JSON.parse(message.toString());
                    console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

                    client.end(() => {
                        res.status(200).json(parsedMessage);
                    });
                } catch (err) {
                    console.error('Error parsing JSON:', err);
                    res.status(500).send('Invalid JSON format in the message body.');
                    client.end();
                }
                // } else {
                //   console.error('No JSON body found in the message.');
                //   res.status(500).send('No JSON body found in the message.');
                //   client.end();
                // }
            }
        });

        client.on('connect', () => {
            console.log('Connected to the device');

            client.subscribe(`${appTopicReceive}${deviceId}/5`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/5`, 'get DNS');
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
        console.error(error);
        res.status(500).json({ message: 'Error fetching video encode channel data' });
    }
};

// GET MAC ADDRESS
exports.getMacAddress = async (req, res) => {
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
                // const messageString = message.toString();
                // const splitMessage = messageString.split('\r\n\r\n');

                // if (splitMessage.length > 1) {
                // const jsonBody = splitMessage[1]; // The JSON part should be after the headers

                try {
                    const parsedMessage = JSON.parse(message.toString());
                    console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

                    client.end(() => {
                        res.status(200).json(parsedMessage);
                    });
                } catch (err) {
                    console.error('Error parsing JSON:', err);
                    res.status(500).send('Invalid JSON format in the message body.');
                    client.end();
                }
                // } else {
                //   console.error('No JSON body found in the message.');
                //   res.status(500).send('No JSON body found in the message.');
                //   client.end();
                // }
            }
        });

        client.on('connect', () => {
            console.log('Connected to the device');

            client.subscribe(`${appTopicReceive}${deviceId}/7`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/7`, 'get MAC Address');
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
        console.error(error);
        res.status(500).json({ message: 'Error fetching video encode channel data' });
    }
};


/////////////////////////////    OTA FUNCTIONS     /////////////////////////////
// get ota
// exports.getOTA = async (req, res) => {

//     const deviceId = req.query.deviceId;
//     let responseSent = false; // Flag to prevent multiple responses
//     // console.log(AlarmOut.AudioAlert)


//     try {
//         const options = {
//             username: process.env.mqttuser,
//             password: process.env.password,
//         };

//         const client = mqtt.connect(process.env.mqtt_broker_url, options);

//         client.on('message', (topic, message) => {
//             if (!responseSent) {
//                 responseSent = true; // Set the flag to true
//                 const messageString = message.toString();
//                 console.log(`Message on topic ${topic}:`, messageString);
//                 // const splitMessage = messageString.split('\r\n\r\n');

//                 // if (splitMessage.length > 1) {
//                 // const jsonBody = splitMessage[1]; // The JSON part should be after the headers

//                 try {
//                     const parsedMessage = JSON.parse(messageString);
//                     console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

//                     client.end(() => {
//                         res.status(200).json(parsedMessage);
//                     });
//                 } catch (err) {
//                     console.error('Error parsing JSON:', err);
//                     res.status(500).send('Invalid JSON format in the message body.');
//                     client.end();
//                 }
//                 // }
//                 // else {
//                 //   console.error('No JSON body found in the message.');
//                 //   res.status(500).send('No JSON body found in the message.');
//                 //   client.end();
//                 // }
//             }
//         });

//         client.on('connect', () => {
//             console.log('Connected to the device');

//             client.subscribe(`${appTopicReceive}${deviceId}/35`, (err) => {
//                 if (err) {
//                     console.error('Subscription error:', err);
//                 } else {
//                     console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
//                     client.publish(`${appTopicSend}${deviceId}/35`, 'get ota');
//                 }
//             });
//         });

//         client.on('error', (err) => {
//             if (!responseSent) {
//                 responseSent = true;
//                 console.error('MQTT Client Error:', err);
//                 res.status(500).json({ message: 'Error with MQTT client' });
//             }
//         });
//     } catch (error) {
//         console.error('Error updating Set UnattendedObjDetect:', error);
//         res.status(500).json({
//             statusCode: 1,
//             statusMessage: 'Error updating Set UnattendedObjDetect',
//         });
//     }
// };

exports.getOTA = async (req, res) => {
    const deviceId = req.query.deviceId;
    let responseSent = false; // prevent multiple responses

    if (!deviceId) {
        return res.status(400).json({ success: false, message: 'deviceId required' });
    }

    try {
        const options = {
            username: process.env.mqttuser,
            password: process.env.password,
        };

        const client = mqtt.connect(process.env.mqtt_broker_url, options);

        // set a timeout and keep its reference so we can clear it later
        const timeoutMs = 10000;
        const t = setTimeout(() => {
            if (!responseSent) {
                responseSent = true;
                console.warn('OTA request timed out');
                try { client.end(); } catch (e) { /* ignore */ }
                return res.status(504).json({ success: false, data: 'Error checking update status', message: 'OTA request timed out' });
            }
        }, timeoutMs);

        client.on('message', async (topic, message) => {
            if (responseSent) return;
            responseSent = true;
            clearTimeout(t); // stop the timeout immediately

            const messageString = message.toString();
            console.log(`Message on topic ${topic}:`, messageString);

            try {
                const parsedMessage = JSON.parse(messageString);
                console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

                // Extract firmware info (prioritize localConfig.firmware)
                const firmwareFromResponse =
                    parsedMessage?.localConfig?.firmware ||
                    parsedMessage?.firmware ||
                    parsedMessage?.firmwareVersion ||
                    null;

                const firmwareVersion = parsedMessage?.firmwareVersion || null;
                const productType = parsedMessage?.localConfig?.productType || parsedMessage?.productType || null;

                console.log('Firmware from response:', firmwareFromResponse);
                // Use the device-provided status string if present (e.g. "update available" or "version up to date")
                // Fallback to derive status if not present
                const otaStatus = parsedMessage?.data
                    || (firmwareFromResponse ? 'update available' : 'version up to date');

                // Build upsert document
                const update = {
                    deviceId,
                    currentFirmware: firmwareFromResponse,
                    firmwareVersion,
                    productType,
                    lastChecked: new Date()
                };

                // Upsert into Firmware collection
                let saved;
                try {
                    saved = await firmware.findOneAndUpdate(
                        { deviceId },
                        { $set: update },
                        { upsert: true, new: true, setDefaultsOnInsert: true }
                    ).lean();
                } catch (dbErr) {
                    console.error('DB upsert error:', dbErr);
                    // Return OTA data but inform about DB failure — still keep `data` so frontend logic can act
                    client.end(() => {
                        return res.status(500).json({
                            success: false,
                            data: otaStatus,
                            message: 'Received OTA response but failed to save firmware to DB',
                            ota: parsedMessage,
                            dbError: dbErr.message
                        });
                    });
                    return;
                }

                // Successfully saved — close client and respond
                client.end(() => {
                    return res.status(200).json({
                        success: true,
                        data: otaStatus,                 // <--- Important: frontend expects response.data.data
                        message: 'OTA response received and firmware saved',
                        ota: parsedMessage,
                        saved
                    });
                });
            } catch (err) {
                console.error('Error parsing JSON or processing message:', err);
                try { client.end(); } catch (e) { }
                clearTimeout(t);
                return res.status(500).json({ success: false, data: 'Error checking update status', message: 'Invalid JSON format or processing error' });
            }
        });

        client.on('connect', () => {
            console.log('Connected to the device via MQTT');

            client.subscribe(`${appTopicReceive}${deviceId}/35`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                    if (!responseSent) {
                        responseSent = true;
                        clearTimeout(t);
                        client.end();
                        return res.status(500).json({ success: false, data: 'Error checking update status', message: 'Subscription error' });
                    }
                } else {
                    console.log(`Subscribed to ${appTopicReceive}${deviceId}/35`);
                    client.publish(`${appTopicSend}${deviceId}/35`, 'get ota');
                }
            });
        });

        client.on('error', (err) => {
            console.error('MQTT Client Error:', err);
            if (!responseSent) {
                responseSent = true;
                clearTimeout(t);
                client.end();
                return res.status(500).json({ success: false, data: 'Error checking update status', message: 'Error with MQTT client', error: err.message });
            }
        });

    } catch (error) {
        console.error('Unexpected error in getOTA:', error);
        return res.status(500).json({ success: false, data: 'Error checking update status', message: 'Server error', error: error.message });
    }
};


// set ota
exports.setOTA = async (req, res) => {

    const deviceId = req.query.deviceId;
    let responseSent = false; // Flag to prevent multiple responses
    // console.log(AlarmOut.AudioAlert)


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
                // const splitMessage = messageString.split('\r\n\r\n');

                // if (splitMessage.length > 1) {
                // const jsonBody = splitMessage[1]; // The JSON part should be after the headers

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
                // }
                // else {
                //   console.error('No JSON body found in the message.');
                //   res.status(500).send('No JSON body found in the message.');
                //   client.end();
                // }
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


/////////////////////////////     EDGE AI FUNCTIONS     /////////////////////////////
// GET MOTION DETECTION
exports.getMotionDetection = async (req, res) => {
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
                // const messageString = message.toString();
                // const splitMessage = messageString.split('\r\n\r\n');

                // if (splitMessage.length > 1) {
                //   const jsonBody = splitMessage[1]; // The JSON part should be after the headers

                try {
                    const parsedMessage = JSON.parse(message.toString());
                    console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

                    client.end(() => {
                        res.status(200).json(parsedMessage);
                    });
                } catch (err) {
                    console.error('Error parsing JSON:', err);
                    res.status(500).send('Invalid JSON format in the message body.');
                    client.end();
                }
                // } else {
                //   console.error('No JSON body found in the message.');
                //   res.status(500).send('No JSON body found in the message.');
                //   client.end();
                // }
            }
        });

        client.on('connect', () => {
            console.log('Connected to the device');

            client.subscribe(`${appTopicReceive}${deviceId}/10`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/10`, 'get Motion Detection');
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
        // console.error(error);
        res.status(500).json({ message: 'Error fetching video encode channel data' });
    }
};

// SET MOTION DETECTION
exports.setMotionDetection = async (req, res) => {
    const { enabled, sensitivityLevel } = req.body;
    const deviceId = req.query.deviceId;
    let responseSent = false; // Flag to prevent multiple responses
    try {
        const options = {
            username: process.env.mqttuser,
            password: process.env.password,
        };

        let motionSetting = {
            enabled,
            detectionType: 'grid',
            detectionGrid: {
                "sensitivityLevel": sensitivityLevel
            }
        };

        const client = mqtt.connect(process.env.mqtt_broker_url, options);

        client.on('message', (topic, message) => {
            if (!responseSent) {
                responseSent = true; // Set the flag to true
                const messageString = message.toString();
                console.log(`Message on topic ${topic}:`, messageString);
                // const splitMessage = messageString.split('\r\n\r\n');

                // if (splitMessage.length > 1) {
                // const jsonBody = splitMessage[1]; // The JSON part should be after the headers

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
                // }
                // else {
                //   console.error('No JSON body found in the message.');
                //   res.status(500).send('No JSON body found in the message.');
                //   client.end();
                // }
            }
        });

        client.on('connect', () => {
            console.log('Connected to the device');

            client.subscribe(`${appTopicReceive}${deviceId}/24`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/24`, JSON.stringify(motionSetting));
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
        console.error('Error updating motion detection settings:', error);
        res.status(500).json({
            statusCode: 1,
            statusMessage: "Error updating motion detection settings"
        });
    }
};



// GET MOTION ALARM SETTINGS
exports.getMotionAlarmSettings = async (req, res) => {
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
                // const messageString = message.toString();
                // const splitMessage = messageString.split('\r\n\r\n');

                // if (splitMessage.length > 1) {
                //   const jsonBody = splitMessage[1]; // The JSON part should be after the headers

                try {
                    const parsedMessage = JSON.parse(message.toString());
                    console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

                    client.end(() => {
                        res.status(200).json({
                            AlarmSound: parsedMessage.AlarmSound.Enabled,
                            AlarmWhiteLight: parsedMessage.AlarmWhiteLight.Enabled
                        });
                    });
                } catch (err) {
                    console.error('Error parsing JSON:', err);
                    res.status(500).send('Invalid JSON format in the message body.');
                    client.end();
                }
                // } else {
                //   console.error('No JSON body found in the message.');
                //   res.status(500).send('No JSON body found in the message.');
                //   client.end();
                // }
            }
        });

        client.on('connect', () => {
            console.log('Connected to the device');

            client.subscribe(`${appTopicReceive}${deviceId}/11`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/11`, 'get Motion Alarm Setting');
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
        // console.error(error);
        res.status(500).json({ message: 'Error fetching video encode channel data' });
    }
};

// SET MOTION ALARM SETTINGS
exports.setMotionAlarmSettings = async (req, res) => {
    const { AlarmSound, AlarmWhiteLight } = req.body;
    const deviceId = req.query.deviceId;
    let responseSent = false; // Flag to prevent multiple responses
    // const deviceid = req.query.deviceId;

    try {
        const options = {
            username: process.env.mqttuser,
            password: process.env.password,
        };

        let motionAlarmSetting = {
            AlarmSound: {
                Enabled: AlarmSound
            },
            AlarmWhiteLight: {
                Enabled: AlarmWhiteLight
            }
        };

        const client = mqtt.connect(process.env.mqtt_broker_url, options);

        client.on('message', (topic, message) => {
            if (!responseSent) {
                responseSent = true; // Set the flag to true
                const messageString = message.toString();
                console.log(`Message on topic ${topic}:`, messageString);
                // const splitMessage = messageString.split('\r\n\r\n');

                // if (splitMessage.length > 1) {
                // const jsonBody = splitMessage[1]; // The JSON part should be after the headers

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
                // }
                // else {
                //   console.error('No JSON body found in the message.');
                //   res.status(500).send('No JSON body found in the message.');
                //   client.end();
                // }
            }
        });

        client.on('connect', () => {
            console.log('Connected to the device');

            client.subscribe(`${appTopicReceive}${deviceId}/25`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/25`, JSON.stringify(motionAlarmSetting));
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
        // Make PUT request using Axios to update alarm settings
        // const response = await axios.put(`http://192.168.1.46/NetSdk/V2/Alarm`, {
        //   AlarmSound: {
        //     Enabled: AlarmSound
        //   },
        //   AlarmWhiteLight: {
        //     Enabled: AlarmWhiteLight
        //   }
        // });

        // res.status(200).json(response.data);
    } catch (error) {
        console.error('Error updating alarm settings:', error);
        res.status(500).json({
            statusCode: 1,
            statusMessage: "Error updating alarm settings"
        });
    }
};



// GET HUMANOID
exports.getHumanOid = async (req, res) => {
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
                // const messageString = message.toString();
                // const splitMessage = messageString.split('\r\n\r\n');

                // if (splitMessage.length > 1) {
                // const jsonBody = splitMessage[1]; // The JSON part should be after the headers

                try {
                    const parsedMessage = JSON.parse(message.toString());
                    console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

                    client.end(() => {
                        res.status(200).json(parsedMessage);
                    });
                } catch (err) {
                    console.error('Error parsing JSON:', err);
                    res.status(500).send('Invalid JSON format in the message body.');
                    client.end();
                }
                // } else {
                //   console.error('No JSON body found in the message.');
                //   res.status(500).send('No JSON body found in the message.');
                //   client.end();
                // }
            }
        });

        client.on('connect', () => {
            console.log('Connected to the device');

            client.subscribe(`${appTopicReceive}${deviceId}/12`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/12`, 'get Human OID');
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
        // console.error(error);
        res.status(500).json({ message: 'Error fetching video encode channel data' });
    }
};

// SET HUMANOID
exports.setHumanOid = async (req, res) => {
    const {
        Enabled,
        drawRegion,
        spOSD,
        AlarmOut,
        Sensitivity,
        sensitivityStep
    } = req.body;

    const deviceId = req.query.deviceId;
    let responseSent = false; // Flag to prevent multiple responses


    try {
        const options = {
            username: process.env.mqttuser,
            password: process.env.password,
        };

        // for vspl
        // sensitivityStep: 
        // lowest
        // low
        // normal
        // high
        // highest

        let data = {
            Enabled: Enabled,
            enabled: Enabled
        };
        if (drawRegion !== undefined && drawRegion !== null) {
            data.drawRegion = drawRegion;
        }

        if (sensitivityStep !== undefined && sensitivityStep !== null) {
            data.sensitivityStep = sensitivityStep ? sensitivityStep : 'normal'
        }

        // Conditionally include AlarmOut only if present in the request body
        if (spOSD !== undefined && spOSD !== null) {
            data.spOSD = spOSD;
            data.Sensitivity = Sensitivity;
            data.AlarmOut = {
                AudioAlert: {
                    Enabled: AlarmOut.AudioAlert?.Enabled || false,
                },
                LightAlert: {
                    Enabled: AlarmOut.LightAlert?.Enabled || false,
                },
                AppPush: {
                    Enabled: AlarmOut.AppPush?.Enabled || false,
                },
                RtmpPush: {
                    Enabled: AlarmOut.RtmpPush?.Enabled || false,
                },
                FtpPush: {
                    Enabled: AlarmOut.FtpPush?.Enabled || false,
                },
                Email: {
                    Enabled: false, // Static value as per the original logic
                },
                gat1400: {
                    Enabled: false, // Static value as per the original logic
                },
            };
        }

        const client = mqtt.connect(process.env.mqtt_broker_url, options);

        client.on('message', (topic, message) => {
            if (!responseSent) {
                responseSent = true; // Set the flag to true
                const messageString = message.toString();
                console.log(`Message on topic ${topic}:`, messageString);
                // const splitMessage = messageString.split('\r\n\r\n');

                // if (splitMessage.length > 1) {
                // const jsonBody = splitMessage[1]; // The JSON part should be after the headers

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
                // }
                // else {
                //   console.error('No JSON body found in the message.');
                //   res.status(500).send('No JSON body found in the message.');
                //   client.end();
                // }
            }
        });

        client.on('connect', () => {
            console.log('Connected to the device');

            client.subscribe(`${appTopicReceive}${deviceId}/27`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/27`, JSON.stringify(data));
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


        // const response = await axios.put(
        //   `https://${deviceid}.torqueverse.dev/NetSdk/V2/AI/HumanDetect`,
        //   {
        //     Enabled: Enabled,
        //     spOSD: spOSD,
        //     Sensitivity: Sensitivity,
        //     AlarmOut: {
        //       AudioAlert: {
        //         Enabled: AlarmOut.AudioAlert.Enabled,
        //       },
        //       LightAlert: {
        //         Enabled: AlarmOut.LightAlert.Enabled,
        //       },
        //       AppPush: {
        //         Enabled: AlarmOut.AppPush.Enabled,
        //       },
        //       RtmpPush: {
        //         Enabled: AlarmOut.RtmpPush.Enabled,
        //       },
        //       FtpPush: {
        //         Enabled: AlarmOut.FtpPush.Enabled,
        //       },
        //       Email: {
        //         Enabled: false,
        //       },
        //       gat1400: {
        //         Enabled: false,
        //       },
        //     },
        //   },
        //   {
        //     headers: {
        //       'Content-Type': 'application/json',
        //       'Authorization': 'Basic YWRtaW46',
        //     },
        //   }
        // );


        // res.status(200).json(response.data);
    } catch (error) {
        console.error('Error updating Set Linecross:', error);
        res.status(500).json({
            statusCode: 1,
            statusMessage: 'Error updating Set Linecross',
        });
    }
};



// GET FACE
exports.getFace = async (req, res) => {
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
                // const messageString = message.toString();
                // const splitMessage = messageString.split('\r\n\r\n');

                // if (splitMessage.length > 1) {
                //   const jsonBody = splitMessage[1]; // The JSON part should be after the headers

                try {
                    const parsedMessage = JSON.parse(message.toString());
                    console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

                    client.end(() => {
                        res.status(200).json(parsedMessage);
                    });
                } catch (err) {
                    console.error('Error parsing JSON:', err);
                    res.status(500).send('Invalid JSON format in the message body.');
                    client.end();
                }
                // } else {
                //   console.error('No JSON body found in the message.');
                //   res.status(500).send('No JSON body found in the message.');
                //   client.end();
                // }
            }
        });

        client.on('connect', () => {
            console.log('Connected to the device');

            client.subscribe(`${appTopicReceive}${deviceId}/13`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/13`, 'get Face');
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
        // console.error(error);
        res.status(500).json({ message: 'Error fetching video encode channel data' });
    }
};

// SET FACE
exports.setFace = async (req, res) => {
    const {
        Enabled,
        spOSD,
        AlarmOut,
        Sensitivity
    } = req.body;
    const deviceId = req.query.deviceId;
    let responseSent = false; // Flag to prevent multiple responses

    try {
        const options = {
            username: process.env.mqttuser,
            password: process.env.password,
        };

        let data = {
            Enabled: Enabled,
            spOSD: spOSD,
            Sensitivity: Sensitivity,
            AlarmOut: {
                AudioAlert: {
                    Enabled: AlarmOut.AudioAlert.Enabled,
                },
                LightAlert: {
                    Enabled: AlarmOut.LightAlert.Enabled,
                },
                AppPush: {
                    Enabled: AlarmOut.AppPush.Enabled,
                },
                RtmpPush: {
                    Enabled: AlarmOut.RtmpPush.Enabled,
                },
                FtpPush: {
                    Enabled: AlarmOut.FtpPush.Enabled,
                },
                Email: {
                    Enabled: false,
                },
                gat1400: {
                    Enabled: false,
                },
            },
        }

        const client = mqtt.connect(process.env.mqtt_broker_url, options);

        client.on('message', (topic, message) => {
            if (!responseSent) {
                responseSent = true; // Set the flag to true
                const messageString = message.toString();
                console.log(`Message on topic ${topic}:`, messageString);
                // const splitMessage = messageString.split('\r\n\r\n');

                // if (splitMessage.length > 1) {
                // const jsonBody = splitMessage[1]; // The JSON part should be after the headers

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
                // }
                // else {
                //   console.error('No JSON body found in the message.');
                //   res.status(500).send('No JSON body found in the message.');
                //   client.end();
                // }
            }
        });

        client.on('connect', () => {
            console.log('Connected to the device');

            client.subscribe(`${appTopicReceive}${deviceId}/28`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/28`, JSON.stringify(data));
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
        // const response = await axios.put(
        //   `https://${deviceid}.torqueverse.dev/NetSdk/V2/AI/FaceDetect`,
        //   {
        //     Enabled: Enabled,
        //     spOSD: spOSD,
        //     Sensitivity: Sensitivity,
        //     AlarmOut: {
        //       AudioAlert: {
        //         Enabled: AlarmOut.AudioAlert.Enabled,
        //       },
        //       LightAlert: {
        //         Enabled: AlarmOut.LightAlert.Enabled,
        //       },
        //       AppPush: {
        //         Enabled: AlarmOut.AppPush.Enabled,
        //       },
        //       RtmpPush: {
        //         Enabled: AlarmOut.RtmpPush.Enabled,
        //       },
        //       FtpPush: {
        //         Enabled: AlarmOut.FtpPush.Enabled,
        //       },
        //       Email: {
        //         Enabled: false,
        //       },
        //       gat1400: {
        //         Enabled: false,
        //       },
        //     },
        //   },
        //   {
        //     headers: {
        //       'Content-Type': 'application/json',
        //       'Authorization': 'Basic YWRtaW46',
        //     },
        //   }
        // );


        // res.status(200).json(response.data);
    } catch (error) {
        console.error('Error updating Set Face:', error);
        res.status(500).json({
            statusCode: 1,
            statusMessage: 'Error updating Set Face',
        });
    }
};



// GET LINE CROSS DETECTION
exports.getLineCross = async (req, res) => {
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
                // const messageString = message.toString();
                // const splitMessage = messageString.split('\r\n\r\n');

                // if (splitMessage.length > 1) {
                //   const jsonBody = splitMessage[1]; // The JSON part should be after the headers

                try {
                    const parsedMessage = JSON.parse(message.toString());
                    console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

                    client.end(() => {
                        res.status(200).json(parsedMessage);
                    });
                } catch (err) {
                    console.error('Error parsing JSON:', err);
                    res.status(500).send('Invalid JSON format in the message body.');
                    client.end();
                }
                // } else {
                //   console.error('No JSON body found in the message.');
                //   res.status(500).send('No JSON body found in the message.');
                //   client.end();
                // }
            }
        });

        client.on('connect', () => {
            console.log('Connected to the device');

            client.subscribe(`${appTopicReceive}${deviceId}/14`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/14`, 'get Line Cross');
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
        // console.error(error);
        res.status(500).json({ message: 'Error fetching video encode channel data' });
    }
};

// SET LINE CROSS DETECTION
exports.setLineCross = async (req, res) => {
    const {
        Enabled,
        DetectLine,
        DetectObj,
        Direction,
        AlarmOut,
    } = req.body;
    const deviceId = req.query.deviceId;
    let responseSent = false; // Flag to prevent multiple responses

    try {
        const options = {
            username: process.env.mqttuser,
            password: process.env.password,
        };

        let data = {
            Enabled: Enabled,
            DetectLine: DetectLine,
            DetectObj: DetectObj,
            Direction: Direction,
            Sensitivity: 5,
            AlarmOut: {
                AudioAlert: {
                    Enabled: AlarmOut.AudioAlert.Enabled,
                },
                LightAlert: {
                    Enabled: AlarmOut.LightAlert.Enabled,
                },
                AppPush: {
                    Enabled: AlarmOut.AppPush.Enabled,
                },
                RtmpPush: {
                    Enabled: AlarmOut.RtmpPush.Enabled,
                },
                FtpPush: {
                    Enabled: AlarmOut.FtpPush.Enabled,
                },
                Email: {
                    Enabled: false,
                },
                gat1400: {
                    Enabled: false,
                },
            },
        }

        const client = mqtt.connect(process.env.mqtt_broker_url, options);

        client.on('message', (topic, message) => {
            if (!responseSent) {
                responseSent = true; // Set the flag to true
                const messageString = message.toString();
                console.log(`Message on topic ${topic}:`, messageString);
                // const splitMessage = messageString.split('\r\n\r\n');

                // if (splitMessage.length > 1) {
                // const jsonBody = splitMessage[1]; // The JSON part should be after the headers

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
                // }
                // else {
                //   console.error('No JSON body found in the message.');
                //   res.status(500).send('No JSON body found in the message.');
                //   client.end();
                // }
            }
        });

        client.on('connect', () => {
            console.log('Connected to the device');

            client.subscribe(`${appTopicReceive}${deviceId}/29`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/29`, JSON.stringify(data));
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

        // const response = await axios.put(
        //   `https://${deviceid}.torqueverse.dev/NetSdk/V2/AI/LineCrossDetect`,
        //   {
        //     Enabled: Enabled,
        //     DetectLine: DetectLine,
        //     DetectObj: DetectObj,
        //     Direction: Direction,
        //     Sensitivity: 5,
        //     AlarmOut: {
        //       AudioAlert: {
        //         Enabled: AlarmOut.AudioAlert.Enabled,
        //       },
        //       LightAlert: {
        //         Enabled: AlarmOut.LightAlert.Enabled,
        //       },
        //       AppPush: {
        //         Enabled: AlarmOut.AppPush.Enabled,
        //       },
        //       RtmpPush: {
        //         Enabled: AlarmOut.RtmpPush.Enabled,
        //       },
        //       FtpPush: {
        //         Enabled: AlarmOut.FtpPush.Enabled,
        //       },
        //       Email: {
        //         Enabled: false,
        //       },
        //       gat1400: {
        //         Enabled: false,
        //       },
        //     },
        //   },
        //   {
        //     headers: {
        //       'Content-Type': 'application/json',
        //       'Authorization': 'Basic YWRtaW46',
        //     },
        //   }
        // );


        // res.status(200).json(response.data);
    } catch (error) {
        console.error('Error updating Set Linecross:', error);
        res.status(500).json({
            statusCode: 1,
            statusMessage: 'Error updating Set Linecross',
        });
    }
};


// GET CUSTOMER STATS
exports.getCustomerStats = async (req, res) => {
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
                // const messageString = message.toString();
                // const splitMessage = messageString.split('\r\n\r\n');

                // if (splitMessage.length > 1) {
                //   const jsonBody = splitMessage[1]; // The JSON part should be after the headers

                try {
                    const parsedMessage = JSON.parse(message.toString());
                    console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

                    client.end(() => {
                        res.status(200).json(parsedMessage);
                    });
                } catch (err) {
                    console.error('Error parsing JSON:', err);
                    res.status(500).send('Invalid JSON format in the message body.');
                    client.end();
                }
                // } else {
                //   console.error('No JSON body found in the message.');
                //   res.status(500).send('No JSON body found in the message.');
                //   client.end();
                // }
            }
        });

        client.on('connect', () => {
            console.log('Connected to the device');

            client.subscribe(`${appTopicReceive}${deviceId}/15`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/15`, 'get Customer Stats');
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
        // console.error(error);
        res.status(500).json({ message: 'Error fetching video encode channel data' });
    }
};

// GET CUSTOMER STATS
exports.setCustomerStats = async (req, res) => {
    const {
        Enabled,
        DetectLine,
        DetectObj,
        Direction,
        nLastHour,
        spOSD
    } = req.body;
    const deviceId = req.query.deviceId;
    let responseSent = false; // Flag to prevent multiple responses

    try {
        const options = {
            username: process.env.mqttuser,
            password: process.env.password,
        };

        let data = {
            Enabled: Enabled,
            DetectLine: DetectLine,
            DetectObj: DetectObj,
            Direction: Direction,
            nLastHour: nLastHour,
            spOSD: spOSD
        }

        const client = mqtt.connect(process.env.mqtt_broker_url, options);

        client.on('message', (topic, message) => {
            if (!responseSent) {
                responseSent = true; // Set the flag to true
                const messageString = message.toString();
                console.log(`Message on topic ${topic}:`, messageString);
                // const splitMessage = messageString.split('\r\n\r\n');

                // if (splitMessage.length > 1) {
                // const jsonBody = splitMessage[1]; // The JSON part should be after the headers

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
                // }
                // else {
                //   console.error('No JSON body found in the message.');
                //   res.status(500).send('No JSON body found in the message.');
                //   client.end();
                // }
            }
        });

        client.on('connect', () => {
            console.log('Connected to the device');

            client.subscribe(`${appTopicReceive}${deviceId}/30`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/30`, JSON.stringify(data));
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

        // const response = await axios.put(
        //   `https://${deviceid}.torqueverse.dev/NetSdk/V2/AI/HumanCounter`,
        //   {
        //     Enabled: Enabled,
        //     DetectLine: DetectLine,
        //     DetectObj: DetectObj,
        //     Direction: Direction,
        //     nLastHour: nLastHour,
        //     spOSD: spOSD
        //   },
        //   {
        //     headers: {
        //       'Content-Type': 'application/json',
        //       'Authorization': 'Basic YWRtaW46',
        //     },
        //   }
        // );


        // res.status(200).json(response.data);
    } catch (error) {
        console.error('Error updating Set Linecross:', error);
        res.status(500).json({
            statusCode: 1,
            statusMessage: 'Error updating Set Linecross',
        });
    }
};



// GET AREA DETECTION
exports.getAreaDetection = async (req, res) => {
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
                // const messageString = message.toString();
                // const splitMessage = messageString.split('\r\n\r\n');

                // if (splitMessage.length > 1) {
                //   const jsonBody = splitMessage[1]; // The JSON part should be after the headers

                try {
                    const parsedMessage = JSON.parse(message.toString());
                    console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

                    client.end(() => {
                        res.status(200).json(parsedMessage);
                    });
                } catch (err) {
                    console.error('Error parsing JSON:', err);
                    res.status(500).send('Invalid JSON format in the message body.');
                    client.end();
                }
                // } else {
                //   console.error('No JSON body found in the message.');
                //   res.status(500).send('No JSON body found in the message.');
                //   client.end();
                // }
            }
        });

        client.on('connect', () => {
            console.log('Connected to the device');

            client.subscribe(`${appTopicReceive}${deviceId}/16`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/16`, 'get Area Detection');
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
        // console.error(error);
        res.status(500).json({ message: 'Error fetching video encode channel data' });
    }
};

// SET AREA DETECTION
exports.setAreaDetection = async (req, res) => {
    const {
        Enabled, Action, MinDuration, RepeatAlarmTime, Sensitivity,
        DetectRegion,
        DetectObj,
        Direction,
        AlarmOut

    } = req.body;

    const deviceId = req.query.deviceId;
    let responseSent = false; // Flag to prevent multiple responses

    try {
        const options = {
            username: process.env.mqttuser,
            password: process.env.password,
        };

        let data = {
            Enabled,
            DetectRegion,
            DetectObj,
            Direction,
            Action,
            MinDuration,
            RepeatAlarmTime,
            Sensitivity,
            AlarmOut: {
                AudioAlert: {
                    Enabled: AlarmOut.AudioAlert.Enabled,
                },
                LightAlert: {
                    Enabled: AlarmOut.LightAlert.Enabled,
                },
                AppPush: {
                    Enabled: AlarmOut.AppPush.Enabled,
                },
                RtmpPush: {
                    Enabled: AlarmOut.RtmpPush.Enabled,
                },
                FtpPush: {
                    Enabled: AlarmOut.FtpPush.Enabled,
                },
                Email: {
                    Enabled: AlarmOut.Email.Enabled,
                },
                gat1400: {
                    Enabled: AlarmOut.gat1400.Enabled,
                },
            },

        }

        const client = mqtt.connect(process.env.mqtt_broker_url, options);

        client.on('message', (topic, message) => {
            if (!responseSent) {
                responseSent = true; // Set the flag to true
                const messageString = message.toString();
                console.log(`Message on topic ${topic}:`, messageString);
                // const splitMessage = messageString.split('\r\n\r\n');

                // if (splitMessage.length > 1) {
                // const jsonBody = splitMessage[1]; // The JSON part should be after the headers

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
                // }
                // else {
                //   console.error('No JSON body found in the message.');
                //   res.status(500).send('No JSON body found in the message.');
                //   client.end();
                // }
            }
        });

        client.on('connect', () => {
            console.log('Connected to the device');

            client.subscribe(`${appTopicReceive}${deviceId}/31`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/31`, JSON.stringify(data));
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
        // const response = await axios.put(
        //   `https://${deviceid}.torqueverse.dev/NetSDK/V2/AI/RegionDetect`,
        //   {
        //     Enabled,
        //     DetectRegion,
        //     DetectObj,
        //     Direction,
        //     Action,
        //     MinDuration,
        //     RepeatAlarmTime,
        //     Sensitivity,
        //     AlarmOut: {
        //       AudioAlert: {
        //         Enabled: AlarmOut.AudioAlert.Enabled,
        //       },
        //       LightAlert: {
        //         Enabled: AlarmOut.LightAlert.Enabled,
        //       },
        //       AppPush: {
        //         Enabled: AlarmOut.AppPush.Enabled,
        //       },
        //       RtmpPush: {
        //         Enabled: AlarmOut.RtmpPush.Enabled,
        //       },
        //       FtpPush: {
        //         Enabled: AlarmOut.FtpPush.Enabled,
        //       },
        //       Email: {
        //         Enabled: AlarmOut.Email.Enabled,
        //       },
        //       gat1400: {
        //         Enabled: AlarmOut.gat1400.Enabled,
        //       },
        //     },

        //   },
        //   {
        //     headers: {
        //       'Content-Type': 'application/json',
        //       'Authorization': 'Basic YWRtaW46',
        //     },
        //   }
        // );


        // res.status(200).json(response.data);
    } catch (error) {
        console.error('Error updating Set Linecross:', error);
        res.status(500).json({
            statusCode: 1,
            statusMessage: 'Error updating Set Linecross',
        });
    }
};



// GET UNATTENDED OBJECT DETECTION
exports.getUnattendedObjDetect = async (req, res) => {
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
                // const messageString = message.toString();
                // const splitMessage = messageString.split('\r\n\r\n');

                // if (splitMessage.length > 1) {
                //   const jsonBody = splitMessage[1]; // The JSON part should be after the headers

                try {
                    const parsedMessage = JSON.parse(message.toString());
                    console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

                    client.end(() => {
                        res.status(200).json(parsedMessage);
                    });
                } catch (err) {
                    console.error('Error parsing JSON:', err);
                    res.status(500).send('Invalid JSON format in the message body.');
                    client.end();
                }
                // } else {
                //   console.error('No JSON body found in the message.');
                //   res.status(500).send('No JSON body found in the message.');
                //   client.end();
                // }
            }
        });

        client.on('connect', () => {
            console.log('Connected to the device');

            client.subscribe(`${appTopicReceive}${deviceId}/17`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/17`, 'get Unattended Obj Detect');
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
        // console.error(error);
        res.status(500).json({ message: 'Error fetching video encode channel data' });
    }
};

// SET UNATTENDED OBJECT DETECTION
exports.setUnattendedObjDetect = async (req, res) => {
    const {
        Enabled, MinDuration,
        Sensitivity,
        DetectRegion,
        AlarmOut

    } = req.body;
    const deviceId = req.query.deviceId;
    let responseSent = false; // Flag to prevent multiple responses


    try {
        const options = {
            username: process.env.mqttuser,
            password: process.env.password,
        };

        let data = {
            Enabled,
            DetectAera: DetectRegion,
            Duration: MinDuration,
            Sensitivity: Sensitivity,
            AlarmOut: {
                AudioAlert: {
                    Enabled: AlarmOut.AudioAlert.Enabled,
                },
                LightAlert: {
                    Enabled: AlarmOut.LightAlert.Enabled,
                },
                AppPush: {
                    Enabled: AlarmOut.AppPush.Enabled,
                },
                RtmpPush: {
                    Enabled: AlarmOut.RtmpPush.Enabled,
                },
                FtpPush: {
                    Enabled: AlarmOut.FtpPush.Enabled,
                },
                Email: {
                    Enabled: AlarmOut.Email.Enabled,
                },
                gat1400: {
                    Enabled: AlarmOut.gat1400.Enabled,
                },
            },

        }

        const client = mqtt.connect(process.env.mqtt_broker_url, options);

        client.on('message', (topic, message) => {
            if (!responseSent) {
                responseSent = true; // Set the flag to true
                const messageString = message.toString();
                console.log(`Message on topic ${topic}:`, messageString);
                // const splitMessage = messageString.split('\r\n\r\n');

                // if (splitMessage.length > 1) {
                // const jsonBody = splitMessage[1]; // The JSON part should be after the headers

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
                // }
                // else {
                //   console.error('No JSON body found in the message.');
                //   res.status(500).send('No JSON body found in the message.');
                //   client.end();
                // }
            }
        });

        client.on('connect', () => {
            console.log('Connected to the device');

            client.subscribe(`${appTopicReceive}${deviceId}/32`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/32`, JSON.stringify(data));
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

        // res.status(200).json(response.data);
    } catch (error) {
        console.error('Error updating Set UnattendedObjDetect:', error);
        res.status(500).json({
            statusCode: 1,
            statusMessage: 'Error updating Set UnattendedObjDetect',
        });
    }
};



// GET MISSING OBJECT DETECTION
exports.getMissingObjectDetection = async (req, res) => {
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
                // const messageString = message.toString();
                // const splitMessage = messageString.split('\r\n\r\n');

                // if (splitMessage.length > 1) {
                //   const jsonBody = splitMessage[1]; // The JSON part should be after the headers

                try {
                    const parsedMessage = JSON.parse(message.toString());
                    console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

                    client.end(() => {
                        res.status(200).json(parsedMessage);
                    });
                } catch (err) {
                    console.error('Error parsing JSON:', err);
                    res.status(500).send('Invalid JSON format in the message body.');
                    client.end();
                }
                // } else {
                //   console.error('No JSON body found in the message.');
                //   res.status(500).send('No JSON body found in the message.');
                //   client.end();
                // }
            }
        });

        client.on('connect', () => {
            console.log('Connected to the device');

            client.subscribe(`${appTopicReceive}${deviceId}/18`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/18`, 'get Missing Obj Detect');
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
        // console.error(error);
        res.status(500).json({ message: 'Error fetching video encode channel data' });
    }
};

// SET MISSING OBJECT DETECTION
exports.setMissingObjectDetection = async (req, res) => {
    const {
        Enabled, MinDuration,
        Sensitivity,
        DetectRegion,
        AlarmOut

    } = req.body;
    const deviceId = req.query.deviceId;
    let responseSent = false; // Flag to prevent multiple responses
    // console.log(AlarmOut.AudioAlert)


    try {
        const options = {
            username: process.env.mqttuser,
            password: process.env.password,
        };

        let data = {
            Enabled,
            DetectAera: DetectRegion,
            Duration: MinDuration,
            Sensitivity: Sensitivity,
            AlarmOut: {
                AudioAlert: {
                    Enabled: AlarmOut.AudioAlert.Enabled,
                },
                LightAlert: {
                    Enabled: AlarmOut.LightAlert.Enabled,
                },
                AppPush: {
                    Enabled: AlarmOut.AppPush.Enabled,
                },
                RtmpPush: {
                    Enabled: AlarmOut.RtmpPush.Enabled,
                },
                FtpPush: {
                    Enabled: AlarmOut.FtpPush.Enabled,
                },
                Email: {
                    Enabled: AlarmOut.Email.Enabled,
                },
                gat1400: {
                    Enabled: AlarmOut.gat1400.Enabled,
                },
            }
        }

        const client = mqtt.connect(process.env.mqtt_broker_url, options);

        client.on('message', (topic, message) => {
            if (!responseSent) {
                responseSent = true; // Set the flag to true
                const messageString = message.toString();
                console.log(`Message on topic ${topic}:`, messageString);
                // const splitMessage = messageString.split('\r\n\r\n');

                // if (splitMessage.length > 1) {
                // const jsonBody = splitMessage[1]; // The JSON part should be after the headers

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
                // }
                // else {
                //   console.error('No JSON body found in the message.');
                //   res.status(500).send('No JSON body found in the message.');
                //   client.end();
                // }
            }
        });

        client.on('connect', () => {
            console.log('Connected to the device');

            client.subscribe(`${appTopicReceive}${deviceId}/33`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/33`, JSON.stringify(data));
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

// CREATE NEW USER FOR WEB PAGE
exports.addUser = async (req, res) => {
    const { username, password } = req.body;
    const deviceId = req.query.deviceId;
    let responseSent = false; // Flag to prevent multiple responses

    try {
        const options = {
            username: process.env.mqttuser,
            password: process.env.password,
        };

        let data = {
            username,
            password,
        }

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

            client.subscribe(`${appTopicReceive}${deviceId}/49`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/49`, JSON.stringify(data));
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

// DELETE USER FOR WEB PAGE
exports.deleteUser = async (req, res) => {
    const { username } = req.body;
    const deviceId = req.query.deviceId;
    let responseSent = false; // Flag to prevent multiple responses

    try {
        const options = {
            username: process.env.mqttuser,
            password: process.env.password,
        };

        let data = {
            username,
        }

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

            client.subscribe(`${appTopicReceive}${deviceId}/50`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/50`, JSON.stringify(data));
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


// get net info
exports.netInfo = async (req, res) => {

    const deviceId = req.query.deviceId;
    let responseSent = false; // Flag to prevent multiple responses

    try {
        const options = {
            username: process.env.username,
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

            client.subscribe(`${appTopicReceive}${deviceId}/34`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/34`, 'get net info');
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


// Set Video Encode Channel 102
exports.setConfig62 = async (req, res) => {
    const { mqttUrl, username, password, productType, p2pAmbicam, vcamAmbicam, firmware, publishUrl } = req.body;
    const deviceId = req.query.deviceId;
    let responseSent = false; // Flag to prevent multiple responses
    const setConfig = {
        mqttUrl,
        username,
        password,
        productType,
        p2pAmbicam,
        vcamAmbicam,
        firmware,
        publishUrl
    };

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

            client.subscribe(`${appTopicReceive}${deviceId}/62`, (err) => {
                if (err) {
                    console.error('Subscription error:', err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/62`, JSON.stringify(setConfig));
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
        res.status(error.response ? error.response.status : 500).json({
            message: error.message,
            error: error.response ? error.response.data : null
        });
    }
};

// get settings
exports.get_VideoSettings = async (req, res) => {
    try {
        const deviceId = req.query.deviceId;

        let responseSent = false; // Flag to prevent multiple responses
        const response = await axios.get(`https://view.arcisai.io/backend/api/setting/getQualityinternal?deviceId=${deviceId}`);

        const options = {
            username: process.env.mqttuser,
            password: process.env.password,
        };

        const client = mqtt.connect(process.env.mqtt_broker_url, options);
        const timeout = setTimeout(() => {
            if (!responseSent) {
                responseSent = true;
                console.error("Timeout: Camera might be out of network");
                res.status(504).json({ message: "Camera might be out of network" });
                client.end(); // Close the MQTT connection
            }
        }, 15000); // 15 seconds

        client.on("message", (topic, message) => {
            if (!responseSent) {
                responseSent = true; // Set the flag to true
                clearTimeout(timeout); // Clear the timeout

                try {
                    const parsedMessage = JSON.parse(message.toString());
                    console.log(`Parsed JSON message on topic ${topic}:`, parsedMessage);

                    client.end(() => {
                        return res.status(200).json({ ...parsedMessage, quality: response.data.quality });
                    });
                } catch (err) {
                    console.error("Error parsing JSON:", err);
                    res.status(500).send("Invalid JSON format in the message body.");
                    client.end();
                }
            }
        });
        const topicCase = response.data.quality.quality === "verylow" ? 39 : response.data.quality.quality === "low" ? 39 : response.data.quality.quality === "mid" ? 2 : response.data.quality.quality === "high" ? 2 : 2;

        client.on("connect", () => {
            console.log("Connected to the device");

            client.subscribe(`${appTopicReceive}${deviceId}/${topicCase}`, (err) => {
                if (err) {
                    console.error("Subscription error:", err);
                } else {
                    console.log(`Subscribed to topics with prefix ${appTopicReceive}`);
                    client.publish(`${appTopicSend}${deviceId}/${topicCase}`, "GET NTP");
                }
            });
        });

        client.on("error", (err) => {
            if (!responseSent) {
                responseSent = true;
                clearTimeout(timeout); // Clear the timeout
                console.error("MQTT Client Error:", err);
                res.status(500).json({ message: "Error with MQTT client" });
            }
        });
    }
    catch (error) {
        console.error('Error fetching settings:', error);
        return res.status(500).json({
            message: 'Error fetching settings',
            error: error.response ? error.response.data : null
        });
    }
}

// set video settings
exports.set_VideoSettings = async (req, res) => {
    const { deviceId } = req.query;
    const { quality, frameRate, constantBitRate } = req.body;
    let responseSent = false; // Flag to prevent multiple responses
    const closeStreamUrl = `http://media.arcisai.io:8080/api/closestream?streamPath=DVR/RTSP-${deviceId}`;
    await axios
        .get(closeStreamUrl)
        .then((response) => {
            console.log("Stream closed :", response.data);
        })
        .catch((error) => {
            console.error("Error closing stream:", error);
        })
        .finally(async () => {
            const response = await axios.post(`https://view.arcisai.io/backend/api/setting/setQualityDb?deviceId=${deviceId}`, { quality });

            const { mqttCase, body } = getRequestData(quality, frameRate, constantBitRate);
            console.log("Request Data:", { mqttCase, body });
            const options = {
                username: process.env.mqttuser,
                password: process.env.password,
            };

            const client = mqtt.connect(process.env.mqtt_broker_url, options);

            client.on("message", (topic, message) => {
                if (!responseSent) {
                    responseSent = true; // Set the flag to true
                    const messageString = message.toString();
                    console.log(`Message on topic ${topic}:`, messageString);

                    try {
                        client.end(async () => {
                            res.status(200).json({ success: true, data: "quality updated successfully" });
                        });
                    } catch (err) {
                        console.error("Error parsing JSON:", err);
                        res.status(500).send("Invalid JSON format in the message body.");
                        client.end();
                    }
                }
            });

            client.on("connect", () => {
                console.log("Connected to the device");

                client.subscribe(
                    `${appTopicReceive}${deviceId}/${mqttCase}`,
                    (err) => {
                        if (err) {
                            console.error("Subscription error:", err);
                        } else {
                            console.log(
                                `Subscribed to topics with prefix ${appTopicReceive}${deviceId}/${mqttCase}`
                            );
                            client.publish(
                                `${appTopicSend}${deviceId}/${mqttCase}`,
                                JSON.stringify(body)
                            );
                        }
                    }
                );
            });

            client.on("error", (err) => {
                if (!responseSent) {
                    responseSent = true;
                    console.error("MQTT Client Error:", err);
                    res.status(500).json({ message: "Error with MQTT client" });
                }
            });
        });
};

const getRequestData = (quality, frameRate, constantBitRate) => {
    console.log('checking params', quality, frameRate, constantBitRate);
    switch (quality) {
        case "verylow":
            return {
                mqttCase: 40,
                body: {
                    codecType: "H.264",
                    h264Profile: "baseline",
                    freeResolution: false,
                    bitRateControlType: "VBR",
                    resolution: "640x360",
                    constantBitRate: parseInt(constantBitRate),
                    frameRate: parseInt(frameRate),
                    keyFrameInterval: 60,
                },
            };

        case "low":
            return {
                mqttCase: 40,
                body: {
                    codecType: "H.264",
                    h264Profile: "baseline",
                    freeResolution: false,
                    bitRateControlType: "VBR",
                    resolution: "800x448",
                    constantBitRate: parseInt(constantBitRate),
                    frameRate: parseInt(frameRate),
                    keyFrameInterval: 60,
                },
            };

        case "mid":
            return {
                mqttCase: 19,
                body: {
                    codecType: "H.265",
                    h264Profile: "high",
                    freeResolution: false,
                    channelName: "ARCIS AI",
                    bitRateControlType: "VBR",
                    resolution: "1280x720",
                    constantBitRate: parseInt(constantBitRate),
                    frameRate: parseInt(frameRate),
                },
            };

        case "high":
            return {
                mqttCase: 19,
                body: {
                    codecType: "H.265",
                    h264Profile: "high",
                    freeResolution: false,
                    channelName: "ARCIS AI",
                    bitRateControlType: "VBR",
                    resolution: "1920x1080",
                    constantBitRate: parseInt(constantBitRate),
                    frameRate: parseInt(frameRate),
                },
            };
        case "veryhigh":
            return {
                mqttCase: 19,
                body: {
                    codecType: "H.265",
                    h264Profile: "high",
                    freeResolution: false,
                    channelName: "ARCIS AI",
                    bitRateControlType: "VBR",
                    resolution: "1920x1080",
                    constantBitRate: parseInt(constantBitRate),
                    frameRate: parseInt(frameRate),
                },
            };

        default:
            throw new Error("Invalid quality parameter");
    }
};