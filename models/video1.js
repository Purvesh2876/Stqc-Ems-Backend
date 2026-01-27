
const mongoose = require('mongoose');

const video1 = new mongoose.Schema({
    deviceId: String,
    id: Number,
    enabled: Boolean,
    powerLineFrequencyMode: Number,
    brightnessLevel: Number,
    contrastLevel: Number,
    sharpnessLevel: Number,
    saturationLevel: Number,
    hueLevel: Number,
    flipEnabled: Boolean,
    mirrorEnabled: Boolean,
    privacyMask: Array
});

module.exports = mongoose.model('video1', video1);
