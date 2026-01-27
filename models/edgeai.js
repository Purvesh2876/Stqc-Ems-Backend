
const mongoose = require('mongoose');

const edgeai = new mongoose.Schema({
    deviceId: String,
    edgeai: Array,
});

module.exports = mongoose.model('edgeai', edgeai);
