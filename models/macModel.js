const mongoose = require('mongoose');

const macModel = new mongoose.Schema({
    macAddr: {
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

module.exports = mongoose.model('macModel', macModel);
