const mongoose = require('mongoose');

const macWifiModel = new mongoose.Schema({
    macWifiAddr: {
        type: String,
        required: true,
        unique: true
    },
    burned: {
        type: Boolean,
        default: false
    },
    burnedDate: {
        type: String,
        default: null
    },
}, { timestamps: true });

module.exports = mongoose.model('macWifiModel', macWifiModel);
