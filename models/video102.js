
const mongoose = require('mongoose');

const video102 = new mongoose.Schema({
    deviceId: String,
    id: Number,
    enabled: Boolean,
    videoInputChannelID: Number,
    codecType: String,
    h264Profile: String,
    freeResolution: Boolean,
    channelName: String,
    bitRateControlType: String,
    resolution: String,
    constantBitRate: Number,
    frameRate: Number,
    keyFrameInterval: Number,
    ImageTransmissionModel: Number,
    gop: Number
});

module.exports = mongoose.model('video102', video102);
