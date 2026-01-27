
const mongoose = require('mongoose');

const video101 = new mongoose.Schema({
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
    gop: Number,
    expandChannelNameOverlay: Array,
});

module.exports = mongoose.model('video101', video101);
