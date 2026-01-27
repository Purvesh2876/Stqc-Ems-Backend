
const mongoose = require('mongoose');

const stqcMasterData = new mongoose.Schema({
    macAddress: {
        type: String,
        required: true,
        unique: true,
    },
    deviceId: {
        type: String,
        required: true,
        unique: true,
    }
});

module.exports = mongoose.model('stqcMasterData', stqcMasterData);
