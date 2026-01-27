
const mongoose = require('mongoose');

const stqcCamera = new mongoose.Schema({
    macAddress: {
        type: String,
        required: true,
        unique: true,
    },
    deviceId: {
        type: String,
        required: true,
        unique: true,
    },
    cameraName: {
        type: String,
        required: true,
    },
    email: { type: String, required: true }
});

module.exports = mongoose.model('stqcCamera', stqcCamera);
