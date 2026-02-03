const mongoose = require('mongoose');

const Uids = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true
  },

  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },

  productType: String,
  networkType: String,

  burned: {
    type: Boolean,
    default: false
  },

  burnedDate: {
    type: Date,
    default: null
  },

  SN: String,
  macAddr: String,
  macWifiAddr: String

}, { timestamps: true });

module.exports = mongoose.model('masterUid', Uids);
