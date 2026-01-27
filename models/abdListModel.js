const mongoose = require("mongoose");

const abdList = new mongoose.Schema({
  abdId: { type: String, required: true },
  abdName: { type: String },
  channel: { type: Number, required: true },
  email: { type: String },
  assignDevice: [
    {
      id: {
        type: String, // e.g., ABD-400188-00001
        required: true,
      },
    },
  ],
  productType: {
    type: String,
    default: "ABD",
  },
});

module.exports = mongoose.model("abdList", abdList);
