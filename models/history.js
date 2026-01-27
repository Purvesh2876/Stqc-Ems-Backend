
const mongoose = require('mongoose');

const history = new mongoose.Schema({
    email: String,
    deviceId: String,
    beforeChange: Object,
    afterChange: Object,
    date: { type: Date, default: Date.now },
    actionType: String,
});

module.exports = mongoose.model('history', history);
