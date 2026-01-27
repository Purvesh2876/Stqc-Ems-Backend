
const mongoose = require('mongoose');

const firmware = new mongoose.Schema({
    deviceId: String,
    mqttUrl: String,
    username: String,
    password: String,
    productType: String,
    p2pAmbicam: String,
    vcamAmbicam: String,
    firmware: String,
    releseDate: String,
    description: String,
    currentFirmware: String,
});

module.exports = mongoose.model('firmware', firmware);
