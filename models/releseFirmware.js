
const mongoose = require('mongoose');

const firmwareReleases = new mongoose.Schema({
    productType: { type: String, required: true },
    versionNo: String,
    versionName: String,
    releaseDate: {
        type: Date,
        default: Date.now
    },
    updates: {
        type: Array,
        default: []
    },
    files: {
        type: [String],
        default: []
    },
    ltsVersion: { type: Boolean, default: false }
});

module.exports = mongoose.model('firmwareReleases', firmwareReleases);
