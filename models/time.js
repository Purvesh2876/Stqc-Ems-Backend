
const mongoose = require('mongoose');

const time = new mongoose.Schema({
    deviceId: String,
    timeZone: String,
    localTime: String,
    calendarStyle: String,
    ntp: Object,
    rtc: Number
});

module.exports = mongoose.model('time', time);
