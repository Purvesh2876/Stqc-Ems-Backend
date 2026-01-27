
const mongoose = require('mongoose');

const deviceinfo = new mongoose.Schema({
    deviceId: String,
    deviceName: String,
    deviceAddress: Number,
    model: String,
    serialNumber: String,
    eseeID: String,
    sdkVersion: String,
    firmwareVersion: String,
    manufacturer: String,
    firmwareReleaseDate: String,
    hardwareVersion: String,
    macAddress: String,
    wirelessMacAddress: String,
    odmNumber: String,
    magic: String,
    extSN: String,
    extSN2: String
});

module.exports = mongoose.model('deviceinfo', deviceinfo);
