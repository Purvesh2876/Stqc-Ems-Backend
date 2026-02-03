const axios = require('axios');
const https = require('https');

const baseURL = `https://home.arcisai.io/backend/api`;

// Create an HTTPS agent to ignore self-signed certificate errors
const agent = new https.Agent({
    rejectUnauthorized: false, // Set to true if you want to verify certificates, or false for self-signed certificates
});

const instance = axios.create({
    baseURL: baseURL,
    withCredentials: true,
    httpsAgent: agent,
});


// check camera and mqtt connection
exports.checkConnectionMqtt = async (req, res) => {
    try {
        const { deviceId } = req.body;
        const connectedDevice = await axios.get("https://prong.arcisai.io:3000/clients", { httpsAgent: agent });
        // Find the device with the specified deviceId
        const device = connectedDevice.data.find(device => device.deviceId === deviceId);
        if (!device) {
            return res.status(404).json({
                success: false,
                message: 'Device not connected with MQTT server'
            });
        }
        console.log(connectedDevice.data);
        res.status(200).json({
            success: true,
            message: 'Device is connected with MQTT server',
            data: device
        });
    } catch (error) {
        console.error('Error checking connection:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// check camera and P2P connection
exports.checkConnectionP2P = async (req, res) => {
    try {
        const { deviceId } = req.body;
        const basicAuth = `Basic ${Buffer.from(`admin:admin`).toString('base64')}`;
        const connectedDevice = await axios.get('https://p2p.arcisai.io:7201/api/proxy/http', { httpsAgent: agent, headers: { 'Authorization': basicAuth } });
        // Find the device with the specified deviceId
        // console.log(connectedDevice.data.proxies);
        const device = connectedDevice.data.proxies.find(device => device.name === deviceId);
        return res.status(200).json({
            success: true,
            data: device?.status || 'offline'
        });
    } catch (error) {
        console.error('Error checking connection:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// get sd card status
exports.getSdCardStatus = async (req, res) => {
    try {
        const { deviceId } = req.body;
        console.log("Requesting URL ::", deviceId);
        const url = `https://${deviceId}.torqueverse.dev/NetSDK/SDCard/status2`;
        const headers = {
            Authorization: "Basic YWRtaW46",
        };

        const response = await axios.get(url, {
            headers,
        });

        console.log(response.data);
        return res.status(200).json({ success: true, data: response.data });
    } catch (error) {
        return res.json({
            success: false,
            status: 404,
            data: "SD Card is Not available",
        });
    }
};

// check media server connection
exports.checkMediaServerConnection = async (req, res) => {
    const deviceId = req.body.deviceId;
    if (!deviceId) {
        return res.status(400).json({
            success: false,
            message: 'Device ID is required'
        });
    }
    try {
        const getConnectionList = await axios.get("https://media.arcisai.io/api/list/pull", { httpsAgent: agent });
        if (getConnectionList.data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No devices connected to media server'
            });
        }

        const streams = getConnectionList.data; // Extract the data array

        const extractedNames = streams
            .map((stream) => {
                if (stream.StreamPath) {
                    const match = stream.StreamPath.match(/RTSP-(.*?)$/);
                    return match ? match[1] : null;
                }
                return null;
            })
            .filter(Boolean); // Remove null values

        const isDeviceConnected = extractedNames.includes(deviceId);
        if (!isDeviceConnected) {
            return res.status(404).json({
                success: false,
                message: 'Device is not connected to media server'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Device is connected to media server'
        });

    } catch (error) {
        console.error('Error checking media server connection:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

exports.getAllTickets = async (req, res) => {
    try {
        const { page: page, status: status, ticketType: ticketType, ticketName: ticketName, ticketId: ticketId } = req.query;

        const response = await instance.get('/ticket/getAllTickets', {
            params: {
                page: page,
                status: status,
                ticketType: ticketType,
                ticketName: ticketName,
                ticketId: ticketId
            },
        });

        return res.status(200).json({
            success: true,
            data: response.data,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// get ticket by id
exports.getTicketById = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const response = await instance.get(`/ticket/getTicketById/${ticketId}`);
        return res.status(200).json({
            success: true,
            data: response.data,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// update ticket status
exports.updateTicketStatus = async (req, res) => {
    try {
        const { ticketId, status } = req.body;
        const response = await instance.post(`/ticket/updateStatus`, { status: status, ticketId: ticketId });

        return res.status(200).json({
            success: true,
            data: response.data,
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}
