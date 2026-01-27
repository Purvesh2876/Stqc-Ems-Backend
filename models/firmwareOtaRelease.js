const mongoose = require('mongoose');

const firmwareOtaReleaseSchema = new mongoose.Schema({
    versionNo: { 
        type: String, 
        required: true 
    },
    productType: { 
        type: String, 
        required: true 
    },
    releaseDate: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String 
    },
    fileName: { 
        type: String, 
        required: true 
    }, // e.g., "S_Series.tar.gz"
    downloadUrl: { 
        type: String 
    }, // The link returned by Prong
    latestFirmware: { 
        type: Boolean, 
        default: false 
    }
}, { timestamps: true });

// Indexing productType and latestFirmware makes the MQTT lookup lightning fast
firmwareOtaReleaseSchema.index({ productType: 1, latestFirmware: 1 });

module.exports = mongoose.model('FirmwareOtaRelease', firmwareOtaReleaseSchema);