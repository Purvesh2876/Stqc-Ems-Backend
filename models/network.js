
const mongoose = require('mongoose');

const network = new mongoose.Schema({
    deviceId: String,
    interfaceName: String,
    lan: Object,
    upnp: Object,
    pppoe: Object,
    ddns: Object,
    wireless: Object,
    preferredDns: String,
    staticAlternateDns: String,
    ICCID: String,
    IMEI: String,
    Signal: Number,
    OutBandWidth: Number
});

module.exports = mongoose.model('network', network);
