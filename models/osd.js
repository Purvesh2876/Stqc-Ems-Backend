
const mongoose = require('mongoose');

const osd = new mongoose.Schema({
    deviceId: String,
    datetimeOverlay: Object,
    channelNameOverlay: Object,
    deviceIDOverlay: Object
});

module.exports = mongoose.model('osd', osd);
