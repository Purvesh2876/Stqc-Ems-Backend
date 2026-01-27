const mongoose = require('mongoose');

const health = new mongoose.Schema({
    deviceId: String,

    // Minute-wise data (collected every 30 seconds)
    Temperature_C: [{
        value: String,
        date: String, // DD/MM/YYYY format
        time: String  // HH:mm format
    }],
    SD_Card: [{
        value: String,
        date: String,
        time: String
    }],
    CPUUsage: [{
        value: String,
        date: String,
        time: String
    }],
    p2pStatus: [{
        value: String,
        date: String,
        time: String
    }],
    signalStrength: [{
        value: Number,
        date: String,
        time: String
    }],
    outBandWidth: [{
        value: Number,
        date: String,
        time: String
    }],

    // Hourly average data (24 values for 24 hours)
    hourlyTemperature_C: [{
        value: String,
        date: String,
        time: String
    }],
    hourlySD_Card: [{
        value: String,
        date: String,
        time: String
    }],
    hourlyCPU: [{
        value: String,
        date: String,
        time: String
    }],
    hourlyp2pStatus: [{
        value: String,
        date: String,
        time: String
    }],
    outBandWidthAvg: [{
        value: Number,
        date: String,
        time: String
    }],
    signalAvg: [{
        value: Number,
        date: String,
        time: String
    }]
});

module.exports = mongoose.model('cameraHealth', health);
