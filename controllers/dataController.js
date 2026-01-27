const mqttService = require('../services/mqttService');

// Controller function to get the latest MQTT message
exports.getLatestMessage = (req, res) => {
    const latestMessage = mqttService.getLatestMessage();
    if (latestMessage) {
        res.json(latestMessage);
    } else {
        res.status(404).json({ message: 'No message available yet.' });
    }
};
