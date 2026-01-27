
const mongoose = require('mongoose');

const image = new mongoose.Schema({
    deviceId: String,
    irCutFilter: Object,
    imageStyle: Number,
    lowlightMode: String,
    sceneMode: String,
    manualSharpness: Object,
    denoise3d: Object,
    WDR: Object,
    exposureMode: String,
    awbMode: String,
    BLcompensationMode: String,
    videoMode: Object,
    
});

module.exports = mongoose.model('image', image);
