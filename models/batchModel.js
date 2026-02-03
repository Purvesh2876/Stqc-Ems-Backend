const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  batchCode: {
    type: String,
    required: true,
    unique: true
  },

  productType: {
    type: String,
    required: true
  },

  networkType: {
    type: String,
    required: true
  },

  quantity: {
    type: Number,
    required: true
  },

  publicKeyPath: {
    type: String,
    required: true
  },

  seedCertPath: {
    type: String,
    required: true
  },

  status: {
    type: String,
    enum: ['CREATED', 'LOCKED'],
    default: 'CREATED'
  }

}, { timestamps: true });

module.exports = mongoose.model('Batch', batchSchema);
