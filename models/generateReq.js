const mongoose = require('mongoose');

const generateReqs = new mongoose.Schema({
    employeeName: { type: String, required: true },
    employeeId: { type: String, required: true },
    employeeEmail: {
        type: String,
        required: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    department: { type: String, required: true },
    deptHead: { type: String, required: true },
    designation: { type: String, required: true },

    reqStatus: {
        type: String,
        enum: ['pending', 'in_process', 'first_approval', 'second_approval', 'rejected', 'delivered'],
        default: 'pending'
    },

    createdDate: { type: Date, required: true, default: Date.now },
    reqType: { type: String, enum: ['new', 'replacement', 'repair'], default: 'new' },
    comments: { type: String, default: 'N/A' },

    // TL approval
    tlApproval: {
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        approvedBy: { type: String, default: null },
        approvedAt: { type: Date, default: null },
        remarks: { type: String, default: null }
    },

    // Store file names only
    quotationFiles: { type: [String], default: [] }
}, {
    timestamps: true
});

module.exports = mongoose.model('generateReqs', generateReqs);
