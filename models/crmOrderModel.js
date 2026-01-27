const mongoose = require('mongoose');

const crmOrderSchema = new mongoose.Schema(
    {
        createdBy: {
            type: String,
            required: true,
        },
        orderCreatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'customer',
            required: true,
        },
        orderQuantity: {
            type: Number,
            required: true
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'crmProductModel'
        },
        finalPrice: {
            type: Number,
            required: true
        },
        deliveryStatus: {
            type: String,
            required: true,
            enum: ['pending', 'shipped', 'delivered', 'cancelled'],
            default: 'pending'
        },
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("crmOrderSchema", crmOrderSchema);