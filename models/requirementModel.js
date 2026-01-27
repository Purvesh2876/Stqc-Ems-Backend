const mongoose = require('mongoose');

const requirementModel = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    userId: { type: mongoose.Schema.ObjectId, ref: 'customer', required: true },
    hardwareChecks: { type: Array, required: true },
    status: { type: String },
    cameraName: { type: Array }
}, { timestamps: true });

module.exports = mongoose.model('requirementModel', requirementModel);
