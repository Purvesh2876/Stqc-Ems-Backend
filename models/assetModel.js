const mongoose = require('mongoose');

const assetModelSchema = new mongoose.Schema(
    {
        assetId: {
            type: String,
            required: true,
            unique: true
        },
        assetName: {
            type: String,
            required: true
        },
        brand: {
            type: String,
            required: true,
        },
        assetAssignedTo: {
            type: String,
            required: true
        },
        assetAssignee: {
            type: String,
            required: true
        },
        srNo: {
            type: String,
            default: "N/A"
        },
        modelNo: {
            type: String,
            default: "N/A"
        },
        organisation: {
            type: String,
            enum: ['adiance', 'vmukti', 'consultant'],
        },
        processor: {
            type: String,
            default: "N/A"
        },
        gpu: {
            type: String,
            default: "N/A"
        },
        ram: {
            type: String,
            default: "N/A"
        },
        storage: {
            type: String,
            default: "N/A"
        },
        status: {
            type: String,
            enum: ['available', 'assigned', 'in_repair', 'retired'],
            default: 'assigned'
        },
        description: {
            type: String,
            default: "N/A"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Asset", assetModelSchema);