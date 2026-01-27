const mongoose = require('mongoose');

const nvrList = new mongoose.Schema({
    nvrId: String,
    nvrName: String,
    channel: Number,
    email: String
});

module.exports = mongoose.model('nvrList', nvrList);
