const mongoose = require("mongoose");

const quotationUploadsSchema = new mongoose.Schema({
  req_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "generateReqs",
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("quotationUploads", quotationUploadsSchema);
