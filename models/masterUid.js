
const mongoose = require('mongoose');

const Uids = new mongoose.Schema({
    deviceId: {
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
    productType: String,
    networkType: String,
    SN: String,
    macAddr: String,
    macWifiAddr: String,
}, { timestamps: true });

module.exports = mongoose.model('masterUid', Uids);