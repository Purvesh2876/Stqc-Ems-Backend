const mongoose = require('mongoose');

const crmStockModel = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'customer',
            required: true,
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'crmProductModel',
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("crmStockModel", crmStockModel);