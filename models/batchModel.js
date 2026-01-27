const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const batchSchema = new mongoose.Schema({
    batchNo: { type: Number, unique: true },
    deviceIds: [{ type: String }],  // Allow plain string device IDs
    certFolderPath: { type: String, required: true }
}, { timestamps: true });

batchSchema.plugin(AutoIncrement, { inc_field: 'batchNo' });

module.exports = mongoose.model('Batch', batchSchema);
