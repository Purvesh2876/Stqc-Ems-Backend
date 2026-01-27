const mongoose = require('mongoose');

const crmLeadModelSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        mobile: {
            type: Number,
            required: true
        },
        email: {
            type: String,
            required: true,
        },
        company: {
            type: String,
        },
        location: {
            type: String,
            required: true
        },
        industryType: {
            type: String,
        },
        customerType: {
            type: String,
        },
        position: {
            type: String,
        },
        status: {
            type: String,
        },
        notes: {
            type: String,
        },
        leadType: {
            type: String,
        },
        customerQuantity: {
            type: Number,
        },
        requirement: {
            type: [
                {
                    cameraType: { type: String, default: "N/A" },
                    quantity: { type: Number, default: 0 },
                    orderTimeline: { type: String, default: "N/A" }
                }
            ],
        },
        avgPriceExpectation: {
            type: String,
        },
        monthlyPurchaseCapacity: {
            type: String,
        },
        lastContacted: {
            type: Date,
            default: () => {
                // Current UTC time
                const now = new Date();
                // Add 5 hours 30 minutes offset
                return new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
            }
        },
        lastContactedBy: {
            type: String,
            default: "N/A"
        },
        assignedTo: {
            type: String,
            default: "N/A"
        },
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("crmLeadModelSchema", crmLeadModelSchema);