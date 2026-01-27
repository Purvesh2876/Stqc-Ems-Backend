const mongoose = require('mongoose');

const appVersionSchema = new mongoose.Schema({
    appName: {
        type: String,
        required: true,
        trim: true
    },
    versionName: {
        type: String,
        required: true,
        trim: true
    },
    files: {
        type: [String],  // will contain .bin & .rom file names
        required: true
    },
    releaseNotesFile: {
        type: String,   // releaseNotes.txt file name
        required: true
    },
    releaseNotesText: {
        type: String,   // store text content for search or API response
        default: null
    },
    uploadedBy: {
        type: String,
        default: "system"
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Ensure version uniqueness per camera
appVersionSchema.index({ appName: 1, versionName: 1 }, { unique: true });

module.exports = mongoose.model('AppVersion', appVersionSchema);
