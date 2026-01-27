const mongoose = require('mongoose');

const crmRequestSchema = new mongoose.Schema(
    {
        requestedBy: {
            type: String,
            required: true
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'crmProductModel'
        },
        quantity: {
            type: Number,
            required: true
        },
        remarks: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'fulfilled'],
            default: 'pending'
        },
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("crmRequestSchema", crmRequestSchema);