
const mongoose = require('mongoose');

const emsReleases = new mongoose.Schema({
    versionNo: String,
    versionName: String,
    releaseDate: String,
    updates: {
        type: Array,
        default: []
    }
});

module.exports = mongoose.model('emsReleases', emsReleases);
