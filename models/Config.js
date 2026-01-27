
const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
    topic: String,
    type: String,
    local_port: Number,
    local_ip: String,
    subdomain: String,
    host_header_rewrite: String,
    server_addr: String,
    server_port: Number,
    token: String,
    typeRtsp: String,
    local_portRtsp: Number,
    local_ipRtsp: String,
    remotePortRtsp: Number,
    subdomainRtsp: String,
    planName: String,
    planStartDate: String,
    planEndDate: String,
    storagePlan: String
});

module.exports = mongoose.model('Config', configSchema);
