const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Please enter your email'],
        unique: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please enter a valid email',
        ],
    },
    name: {
        type: String,
        required: [true, 'Please enter your name'],
    },
    mobile: {
        type: String,
        required: [true, 'Please enter your mobile number'],
    },
    password: {
        type: String,
        required: [true, 'Please enter a password'],
        minlength: 6,
        select: false,
    },
    employeeId: {
        type: String,
        required: [true, 'Please enter your employee ID'],
        unique: true,
    },
    department: {
        type: String,
        required: [true, 'Please enter your department'],
    },
    designation: {
        type: String,
        enum: ['employee', 'intern', 'consultant', 'director', 'head'],
        required: [true, 'Please enter your designation'],
    },
    role: {
        type: Array,
        default: ['view'],
    },
    Isverified: {
        type: Number,
        default: 0,
    },
    tokens: [{
        token: {
            type: String,
            required: true,
        }
    }],
    loginAttempts: {
        type: Number,
        required: true,
        default: 0,
    },
    parentId: {
        type: Number,
    },
    lockUntil: {
        type: Date,
    },
    resetPasswordToken: {
        type: String,
    },
    resetPasswordExpire: {
        type: Date,
    },
    deleteAt: {
        type: Date,
    },
    lastActivityarcis: {
        type: Date,
    }
}, {
    timestamps: true,
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
userSchema.methods.getResetPasswordToken = function () {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set expire time (1 hour = 3600000 milliseconds)
    this.resetPasswordExpire = Date.now() + 60 * 60 * 1000;

    return resetToken;
};

const User = mongoose.model('customer', userSchema);

module.exports = User;
