
const mongoose = require('mongoose');

const vmsReleases = new mongoose.Schema({
    versionNo: String,
    versionName: String,
    releaseDate: String,
    updates: {
        type: Array,
        default: []
    }
});

module.exports = mongoose.model('vmsReleases', vmsReleases);
