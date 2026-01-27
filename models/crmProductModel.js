const mongoose = require('mongoose');

const crmProductModel = new mongoose.Schema(
    {
        productName: {
            type: String,
            unique: true,
            required: true,
        },
        description: {
            type: String,
            required: true
        },
        units: {
            type: Number,
            required: true,
        },
        type: {
            type: String,
            enum: ['wifi', '4g', '5g', 'poe']
        },
        // deviceId: {
        //     type: Array,
        //     default: [{
        //         type: mongoose.Schema.Types.ObjectId,
        //         ref: 'p2predirect'
        //     }]},
        pricePerUnit: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ['in_stock', 'out_of_stock', 'discontinued'],
            default: 'in_stock'
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("crmProductModel", crmProductModel);