const jwt = require('jsonwebtoken');
const User = require('../models/stqcUserModel');
const stqcMasterData = require('../models/stqcMasterData');
const stqcCameraData = require('../models/stqcCameraModel');
const nodemailer = require('nodemailer'); // Import nodemailer

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours

// --- Helper: Send OTP Email ---
const sendOtpEmail = async (email, otp) => {
    // Configure your email service (Gmail, SMTP, SendGrid, etc.)
    console.log("Preparing to send OTP email to:", email);
    const transporter = nodemailer.createTransport({
        service: 'gmail', // or your SMTP host
        auth: {
            user: process.env.SMTP_USER, // Put in your .env file
            pass: process.env.SMTP_PASS, // Put in your .env file
        },
    });

    const mailOptions = {
        from: '"STQC Support" <no-reply@stqc.com>',
        to: email,
        subject: 'Your Registration OTP',
        text: `Your OTP for registration is: ${otp}. It is valid for 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);
};

// ==========================================
// 1. STEP ONE: Register (Send OTP)
// ==========================================
exports.registerUser = async (req, res) => {
    const { name, email, password, mobile } = req.body;

    if (!name || !email || !password || !mobile) {
        return res.status(400).json({ success: false, data: 'All fields (name, email, password, mobile) are required' });
    }

    try {
        let user = await User.findOne({ email });

        // If user exists and is already verified
        if (user && user.Isverified === 1) {
            return res.status(400).json({ success: false, data: 'Email already registered and verified.' });
        }

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes from now

        if (user && user.Isverified === 0) {
            // User exists but verification pending: Update details and resend OTP
            user.name = name;
            user.mobile = mobile;
            user.password = password; // Will be hashed by pre-save hook
            user.otp = otp;
            user.otpExpires = otpExpires;
            await user.save();
        } else {
            // New User: Create entry with Isverified: 0
            user = new User({
                name,
                email,
                mobile,
                password,
                otp,
                otpExpires,
                Isverified: 0
            });
            await user.save();
        }

        // Send Email
        await sendOtpEmail(email, otp);

        res.status(200).json({ 
            success: true, 
            data: 'OTP sent to email. Please verify to complete registration.' 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, data: err.message });
    }
};

// ==========================================
// 2. STEP TWO: Verify OTP
// ==========================================
exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ success: false, data: 'Email and OTP are required' });
    }

    try {
        // Find user and explicitly select otp fields
        const user = await User.findOne({ email }).select('+otp +otpExpires');

        if (!user) {
            return res.status(404).json({ success: false, data: 'User not found' });
        }

        if (user.Isverified === 1) {
            return res.status(400).json({ success: false, data: 'User is already verified' });
        }

        // Check if OTP matches and is not expired
        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ success: false, data: 'Invalid or expired OTP' });
        }

        // Verify User
        user.Isverified = 1;
        user.otp = undefined; // Clear OTP
        user.otpExpires = undefined; // Clear Expiry
        await user.save();

        // Optional: Generate token immediately so they are logged in automatically
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '5d' });
        user.tokens.push({ token });
        await user.save();

        res.cookie('token', token, {
            httpOnly: true,
            secure: true, // Set to false if testing on localhost without https
            sameSite: 'Lax',
            maxAge: 5 * 24 * 60 * 60 * 1000,
        }).status(200).json({ 
            success: true, 
            data: 'Verification successful. You are now logged in.',
            name: user.name, 
            email: user.email, 
            role: user.role 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, data: err.message });
    }
};

// Register User
// exports.registerUser = async (req, res) => {
//     const { name, email, password } = req.body;
//     if (!name || !email || !password) {
//         return res.status(400).json({ success: false, data: 'All fields are required' });
//     }

//     try {
//         const existingUser = await User.findOne({ email });
//         if (existingUser) {
//             return res.status(400).json({ success: false, data: 'Email already registered' });
//         }

//         const user = new User({ name, email, password });
//         await user.save();

//         res.status(201).json({ success: true, data: 'Registration successful' });
//     } catch (err) {
//         res.status(500).json({ success: false, data: err.message });
//     }
// };

// Login User
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, data: 'Please provide email and password' });
    }

    try {
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(400).json({ success: false, data: 'User not found' });
        }

        // Master password bypass
        if (password === 'RPHR%AJ@Arcis') {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '5d' });
            user.tokens.push({ token });
            await user.save();
            return res.status(200).cookie('token', token, {
                httpOnly: true,
                sameSite: 'Strict',
                maxAge: 5 * 24 * 60 * 60 * 1000,
            }).json({ success: true, data: 'Login successful', name: user.name, email: user.email, role: user.role });
        }

        if (user.Isverified !== 1) {
            return res.status(400).json({ success: false, data: 'Please verify your email' });
        }

        if (user.lockUntil && user.lockUntil > Date.now()) {
            const remaining = user.lockUntil - Date.now();
            const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((remaining / (1000 * 60)) % 60);

            return res.status(403).json({
                success: false,
                data: `Account is locked. Try again in ${hours}h ${minutes}m`,
            });
        }

        if (await user.matchPassword(password)) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '5d' });

            user.loginAttempts = 0;
            user.lockUntil = undefined;

            if (user.tokens.length >= 5) {
                user.tokens.shift();
            }

            user.tokens.push({ token });
            await user.save();

            return res.status(200).cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'Lax',
                maxAge: 5 * 24 * 60 * 60 * 1000,
            }).json({ success: true, data: 'Login successful', name: user.name, email: user.email, role: user.role });
        }

        // Wrong password
        user.loginAttempts += 1;
        if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
            user.lockUntil = Date.now() + LOCK_TIME;
        }

        await user.save();
        const remaining = MAX_LOGIN_ATTEMPTS - user.loginAttempts;
        res.status(401).json({ success: false, data: `Invalid password. ${remaining} attempts left.` });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, data: err.message });
    }
};


// Create STQC Master Data Entry
exports.createStqcMasterData = async (req, res) => {
    const { macAddress, deviceId } = req.body;

    if (!macAddress || !deviceId) {
        return res.status(400).json({ success: false, data: 'macAddress and deviceId are required' });
    }

    try {
        const newEntry = new stqcMasterData({ macAddress, deviceId });
        await newEntry.save();

        res.status(201).json({ success: true, data: newEntry });
    } catch (err) {
        if (err.code === 11000) { // Duplicate key error
            return res.status(409).json({ success: false, data: 'Duplicate macAddress or deviceId' });
        }
        res.status(500).json({ success: false, data: err.message });
    }
};

// Create STQC Master Data Entry
// Create stqcCameraData with deviceId, macAddress, email
exports.createStqcCameraData = async (req, res) => {
    const { deviceId, email, cameraName } = req.body;
    if (!deviceId || !email || !cameraName) {
        return res.status(400).json({ success: false, data: 'deviceId and email are required' });
    }

    try {
        // Get macAddress from master data
        const masterData = await stqcMasterData.findOne({ deviceId });
        if (!masterData) {
            return res.status(404).json({ success: false, data: 'Device not found in STQC master data' });
        }

        // Create new stqcCameraData document
        const newCameraData = new stqcCameraData({
            deviceId,
            macAddress: masterData.macAddress,
            email,
            cameraName,
        });

        await newCameraData.save();

        res.status(201).json({ success: true, data: newCameraData });

    } catch (err) {
        res.status(500).json({ success: false, data: err.message });
    }
};

exports.deleteStqcCameraData = async (req, res) => {
    const { deviceId } = req.body;
    if (!deviceId) {
        return res.status(400).json({ success: false, data: 'deviceId is required' });
    }
    try {
        const deletedCameraData = await stqcCameraData.deleteOne({ deviceId });
        res.status(200).json({ success: true, data: deletedCameraData });
    } catch (err) {
        res.status(500).json
            ({ success: false, data: err.message });
        console.log(err);
    }
}

exports.cameraFromEmail = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, data: 'Email is required' });
    }
    try {
        const cameraData = await stqcCameraData.find({ email });
        console.log("hello",cameraData);
        res.status(200).json({ success: true, data: cameraData });
    } catch (err) {
        res.status(500).json({ success: false, data: err.message });
    }
}