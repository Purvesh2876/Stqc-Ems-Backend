const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    deptName: {
        type: String,
        required: true,
        unique: true
    },
    deptHead: {
        type: String,
        required: true
    },
    pendingRequests: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'generateReqs' // model name from generateReq.js
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);