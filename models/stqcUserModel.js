// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const stqcUserSchema = new mongoose.Schema({
//     name: String,
//     email: { type: String, unique: true, required: true },
//     password: { type: String, required: true, select: false },
//     role: { type: String, default: 'user' },
//     Isverified: { type: Number, default: 1 },
//     loginAttempts: { type: Number, default: 0 },
//     lockUntil: Date,
//     tokens: [{ token: String }],
// }, { timestamps: true });

// // Password hash middleware
// stqcUserSchema.pre('save', async function (next) {
//     if (!this.isModified('password')) return next();
//     this.password = await bcrypt.hash(this.password, 10);
//     next();
// });

// // Compare password method
// stqcUserSchema.methods.matchPassword = function (enteredPassword) {
//     return bcrypt.compare(enteredPassword, this.password);
// };

// module.exports = mongoose.model('StqcUser', stqcUserSchema);


const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const stqcUserSchema = new mongoose.Schema({
    name: String,
    // Added Mobile field
    mobile: { type: String, required: true }, 
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true, select: false },
    role: { type: String, default: 'user' },
    
    // Changed default to 0 (Not Verified)
    Isverified: { type: Number, default: 0 }, 
    
    // New fields for OTP handling
    otp: { type: String, select: false },
    otpExpires: { type: Date, select: false },
    
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    tokens: [{ token: String }],
}, { timestamps: true });

// Password hash middleware
stqcUserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare password method
stqcUserSchema.methods.matchPassword = function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('StqcUser', stqcUserSchema);