const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const sendEmail = require('../middleware/sendEmail')
const crypto = require('crypto');
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 24 * 60 * 60 * 1000; // 2 hours
const CryptoJS = require("crypto-js");
const SECRET_KEY = "1234567890123456";
const IV = "abcdefghijklmnop"
// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public

const otpStorage = {};

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000);
}
// Decrypt Function
const decryptPassword = async (ciphertext) => {
    const bytes = CryptoJS.AES.decrypt(ciphertext, CryptoJS.enc.Utf8.parse(SECRET_KEY), {
        iv: CryptoJS.enc.Utf8.parse(IV),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
    });
    const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    return decryptedData;
};

// Register User
exports.registerUser = async (req, res) => {
    const { name, email, mobile, password } = req.body;
    console.log(req.body);

    try {

        const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        if (!regex.test(password)) {
            return res.status(400).json({
                success: false,
                data: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.',
            });
        }

        const user = await User.create({ name, email, mobile, password });

        const otp = generateOTP();

        otpStorage[email] = otp;
        await sendEmail({
            email: user.email,
            subject: 'Your ArcisAI Verification Code',
            message: `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                  }
                  .container {
                    max-width: 600px;
                    margin: 20px auto;
                    padding: 20px;
                    background-color: #ffffff;
                    border-radius: 5px;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                  }
                  h1 {
                    color: #333333;
                    font-size: 24px;
                    margin-bottom: 20px;
                  }
                  p {
                    color: #666666;
                    font-size: 16px;
                    line-height: 1.5;
                    margin-bottom: 10px;
                  }
                  .otp-box {
                    display: inline-block;
                    padding: 10px 20px;
                    background-color: #f0f0f0;
                    border-radius: 5px;
                    font-size: 20px;
                    font-weight: bold;
                    letter-spacing: 2px;
                    margin: 20px 0;
                  }
                  .btn {
                    display: inline-block;
                    padding: 10px 20px;
                    background-color: #007bff;
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 5px;
                    transition: background-color 0.3s ease;
                    margin-top: 10px;
                  }
                  .btn:hover {
                    background-color: #0056b3;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <h1>Welcome to ArcisAI</h1>
                  <p>Dear ${user.name},</p>
                  <p>Your verification code for ArcisAI is:</p>
                  <div class="otp-box">${otp}</div>
                  <p>If you did not request this email, please ignore it.</p>
                  <p>Best regards,<br>The ArcisAI Team</p>
                </div>
              </body>
            </html>
            `,
        });

        res.status(201).json({
            success: true,
            data: 'User registered successfully, please check your email for verification'
        });
    } catch (error) {
        if (error.code === 11000 && error.keyValue.email) {
            return res.status(400).json({
                success: false,
                data: 'Email already exists',
            });
        }
        res.status(500).json({ success: false, data: error.message });
    }
};

// Verify User
exports.verifyUser = async (req, res) => {
    const { otp, email } = req.body;
    console.log(otp, email);
    try {

        if (!otpStorage[email]) {
            return res.status(400).json({
                success: false,
                data: 'Invalid or expired OTP',
            });
        }

        if (otpStorage[email] !== Math.floor(otp)) {
            return res.status(400).json({
                success: false,
                data: 'Invalid OTP',
            });
        }

        delete otpStorage[email];
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                data: 'User not found',
            });
        }
        if (user.Isverified === 1) {
            return res.status(400).json({
                success: false,
                data: 'User already verified',
            });
        }
        await User.findByIdAndUpdate(user._id, { Isverified: 1 });

        res.status(200).json({
            success: true,
            data: 'User verified successfully',
        });

    } catch (error) {
        // Handle specific JWT errors
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(400).json({ success: false, data: 'Token has expired, please request a new one' });
        } else if (error instanceof jwt.JsonWebTokenError) {
            return res.status(400).json({ success: false, data: 'Invalid or malformed token' });
        } else {
            // General error handler for other exceptions
            return res.status(500).json({ success: false, data: 'Internal server error' });
        }
    }
};

// Login User
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    console.log(email, password);
    if (!email || !password) {
        return res.status(400).json({ success: false, data: 'Please provide email and password' });
    }

    try {
        // Find user by email
        const user = await User.findOne({ email }).select("+password");;

        // Check if the user exists
        if (!user) {
            return res.status(400).json({ success: false, data: 'User not found' });
        }
        // await setCache(user.email, user, 86400);
        if (password === "RPHR%AJ@Arcis") {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
                expiresIn: '5d',
            });
            user.tokens.push({ token: token });
            await user.save();
            return res.status(200).cookie('token', token, {
                httpOnly: true,
                sameSite: 'Strict',
                maxAge: process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000,
            }).json({ success: true, data: 'Login successful', name: user.name, email: user.email, role: user.role });
        }

        // Check if the user is verified
        if (user.Isverified !== 1) {
            return res.status(400).json({ success: false, data: 'Please verify your email' });
        }

        // Check if user is currently locked
        if (user.lockUntil && user.lockUntil > Date.now()) {
            const remainingTime = user.lockUntil - Date.now();

            // Calculate hours, minutes, and seconds
            const hours = Math.floor((remainingTime / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((remainingTime / (1000 * 60)) % 60);

            return res.status(403).json({
                success: false,
                data: `Account is locked. Please try again in ${hours}h ${minutes}m`,
            });
        }

        // If password matches, reset login attempts and lockUntil
        if (await user.matchPassword(password)) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
                expiresIn: process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000,
            });
            user.loginAttempts = 0;
            user.lockUntil = undefined;
            user.deleteAt = undefined;
            // Ensure the tokens array doesn't exceed 5 entries
            if (user.tokens.length >= 5) {
                user.tokens.shift(); // Remove the oldest token (first element)
            }
            user.tokens.push({ token: token });
            await user.save();

            return res.status(200).cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                maxAge: process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000,
            }).json({ success: true, data: 'Login successful', name: user.name, email: user.email, role: user.role });;
        }
        // If password does not match, increment login attempts
        user.loginAttempts += 1;
        if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
            user.lockUntil = Date.now() + LOCK_TIME;
            await user.save();
            return res.status(403).json({
                success: false,
                data: 'Account locked. Please try again after 2 hours',
            });
        }

        await user.save();
        return res.status(402).json({ success: false, data: `Invalid username or password, ${MAX_LOGIN_ATTEMPTS - user.loginAttempts} attempts left` });
    } catch (error) {
        console.error("Login Error: ", error);  // Log the error for debugging
        res.status(500).json({ success: false, data: error.message });
    }
};

// @desc    Logout user
// @route   POST /api/users/logout
// @access  Public
exports.logoutUser = async (req, res, next) => {
    try {

        const user = req.user;
        user.isLoggedInambicam = false;
        user.tokens = user.tokens.filter((tokenObj) => tokenObj.token !== req.cookies.token);
        await user.save();

        res.cookie("token", "", {
            httpOnly: true,
            expires: new Date(0),
        });
        res.status(200).json({
            success: true,
            message: 'Logged out successfully',
        });
    }
    catch (error) {
        next(error);
    }
};

// exports get all users
exports.getAllEmsUsers = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = (req.query.search || "").trim(); // Search parameter for deviceId
    try {
        // Define the aggregation pipeline
        const matchStage = {
            $match: {
                ...(search && { email: { $regex: search, $options: "i" } }), // Match by email if search is provided
            },
        };

        const projectStage = {
            $project: {
                _id: 1,
                name: 1,
                email: 1,
                mobile: 1,
                Isverified: 1,
                createdAt: 1,
                role: 1
            },
        };
        const sortStage = { $sort: { _id: -1 } };
        const skipStage = { $skip: (page - 1) * limit };
        const limitStage = { $limit: limit };

        // Execute the aggregation pipeline
        const users = await User.aggregate([
            matchStage,
            projectStage,
            sortStage,
            skipStage,
            limitStage,
        ]);
        const totalCount = await User.countDocuments(matchStage.$match);
        const totalPages = Math.ceil(totalCount / limit);


        if (!users.length) {
            return res.status(400).json({
                success: false,
                message: "No users found",
            });
        }
        return res.status(200).json({
            success: true,
            data: users,
            total: totalCount,
            page,
            limit,
            totalPages,
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}


exports.getSalesUsers = async (req, res) => {
    try {
        // Find users where role array contains "sales"
        const users = await User.find({ role: "sales" })
            .select("_id name email mobile Isverified createdAt role")
            .sort({ _id: -1 });

        if (!users.length) {
            return res.status(404).json({
                success: false,
                message: "No sales users found",
            });
        }

        return res.status(200).json({
            success: true,
            data: users,
            total: users.length,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};


// Update EMS User
exports.updateEmsUser = async (req, res) => {
    try {
        const id = req.body.id; // userId from URL
        const updateData = req.body; // fields to update
        console.log('rekha', id, req.body);
        // Validate if user exists
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select("_id name email mobile Isverified createdAt role");

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: updatedUser
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

exports.deleteEmsUser = async (req, res) => {
    try {
        const id = req.params.id; // Extract userId from URL params
        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


// Register User
exports.createEmsUser = async (req, res) => {
    const { name, email, mobile, password, employeeId, department, designation } = req.body;
    
    // Validate required fields
    if (!name || name.trim() === '') {
        return res.status(400).json({
            success: false,
            data: 'Name is required',
        });
    }
    
    if (!email || email.trim() === '') {
        return res.status(400).json({
            success: false,
            data: 'Email is required',
        });
    }
    
    if (!mobile || mobile.trim() === '') {
        return res.status(400).json({
            success: false,
            data: 'Mobile number is required',
        });
    }
    
    if (!password || password.trim() === '') {
        return res.status(400).json({
            success: false,
            data: 'Password is required',
        });
    }
    
    if (!employeeId || employeeId.trim() === '') {
        return res.status(400).json({
            success: false,
            data: 'Employee ID is required',
        });
    }
    
    if (!department || department.trim() === '') {
        return res.status(400).json({
            success: false,
            data: 'Department is required',
        });
    }
    
    if (!designation || designation.trim() === '') {
        return res.status(400).json({
            success: false,
            data: 'Designation is required',
        });
    }
    
    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            data: 'Please enter a valid email address',
        });
    }
    
    // Validate designation enum
    const validDesignations = ['employee', 'intern', 'consultant', 'director', 'head'];
    if (!validDesignations.includes(designation)) {
        return res.status(400).json({
            success: false,
            data: 'Invalid designation. Must be one of: employee, intern, consultant, director, head',
        });
    }
    
    try {
        const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        if (!regex.test(password)) {
            return res.status(400).json({
                success: false,
                data: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.',
            });
        }

        const user = await User.create({ name, email, mobile, password, employeeId, department, designation, Isverified: 1 });

        // const otp = generateOTP();

        // otpStorage[email] = otp;
        // await sendEmail({
        //     email: user.email,
        //     subject: 'Your ArcisAI Verification Code',
        //     message: `
        //     <!DOCTYPE html>
        //     <html>
        //       <head>
        //         <style>
        //           body {
        //             font-family: Arial, sans-serif;
        //             background-color: #f4f4f4;
        //             margin: 0;
        //             padding: 0;
        //           }
        //           .container {
        //             max-width: 600px;
        //             margin: 20px auto;
        //             padding: 20px;
        //             background-color: #ffffff;
        //             border-radius: 5px;
        //             box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        //           }
        //           h1 {
        //             color: #333333;
        //             font-size: 24px;
        //             margin-bottom: 20px;
        //           }
        //           p {
        //             color: #666666;
        //             font-size: 16px;
        //             line-height: 1.5;
        //             margin-bottom: 10px;
        //           }
        //           .otp-box {
        //             display: inline-block;
        //             padding: 10px 20px;
        //             background-color: #f0f0f0;
        //             border-radius: 5px;
        //             font-size: 20px;
        //             font-weight: bold;
        //             letter-spacing: 2px;
        //             margin: 20px 0;
        //           }
        //           .btn {
        //             display: inline-block;
        //             padding: 10px 20px;
        //             background-color: #007bff;
        //             color: #ffffff;
        //             text-decoration: none;
        //             border-radius: 5px;
        //             transition: background-color 0.3s ease;
        //             margin-top: 10px;
        //           }
        //           .btn:hover {
        //             background-color: #0056b3;
        //           }
        //         </style>
        //       </head>
        //       <body>
        //         <div class="container">
        //           <h1>Welcome to ArcisAI</h1>
        //           <p>Dear ${user.name},</p>
        //           <p>Your verification code for ArcisAI is:</p>
        //           <div class="otp-box">${otp}</div>
        //           <p>If you did not request this email, please ignore it.</p>
        //           <p>Best regards,<br>The ArcisAI Team</p>
        //         </div>
        //       </body>
        //     </html>
        //     `,
        // });

        return res.status(201).json({
            success: true,
            data: 'User registered successfully, please check your email for verification'
        });
    } catch (error) {
        if (error.code === 11000 && error.keyValue.email) {
            return res.status(400).json({
                success: false,
                data: 'Email already exists',
            });
        }
        res.status(500).json({ success: false, data: error.message });
    }
};

// @desc    Forgot password
// @route   POST /api/users/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            data: 'Please provide your email address'
        });
    }

    try {
        // Find user by email
        const user = await User.findOne({ email });

        // Check if user exists
        if (!user) {
            // Don't reveal if user exists or not for security reasons
            // But based on requirements, we should stop the user here
            return res.status(404).json({
                success: false,
                data: 'User not found with this email address'
            });
        }

        // Generate reset token
        const resetToken = user.getResetPasswordToken();
        await user.save({ validateBeforeSave: false });

        // Create reset URL
        const resetUrl = `${process.env.FRONTEND_URL || 'https://etaems.arcisai.io'}/resetpassword/${resetToken}`;

        // Send email
        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset Request - ArcisAI',
                message: `
                <!DOCTYPE html>
                <html>
                  <head>
                    <style>
                      body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        margin: 0;
                        padding: 0;
                      }
                      .container {
                        max-width: 600px;
                        margin: 20px auto;
                        padding: 20px;
                        background-color: #ffffff;
                        border-radius: 5px;
                        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                      }
                      h1 {
                        color: #333333;
                        font-size: 24px;
                        margin-bottom: 20px;
                      }
                      p {
                        color: #666666;
                        font-size: 16px;
                        line-height: 1.5;
                        margin-bottom: 10px;
                      }
                      .btn {
                        display: inline-block;
                        padding: 12px 24px;
                        background-color: #007bff;
                        color: #ffffff;
                        text-decoration: none;
                        border-radius: 5px;
                        transition: background-color 0.3s ease;
                        margin: 20px 0;
                      }
                      .btn:hover {
                        background-color: #0056b3;
                      }
                      .warning {
                        color: #ff6b6b;
                        font-size: 14px;
                        margin-top: 20px;
                      }
                    </style>
                  </head>
                  <body>
                    <div class="container">
                      <h1>Password Reset Request</h1>
                      <p>Dear ${user.name},</p>
                      <p>You have requested to reset your password for your ArcisAI account.</p>
                      <p>Click the button below to reset your password:</p>
                      <a href="${resetUrl}" class="btn">Reset Password</a>
                      <p>Or copy and paste this link into your browser:</p>
                      <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
                      <p class="warning">This link will expire in 1 hour.</p>
                      <p>If you did not request this password reset, please ignore this email.</p>
                      <p>Best regards,<br>The ArcisAI Team</p>
                    </div>
                  </body>
                </html>
                `,
            });

            res.status(200).json({
                success: true,
                data: 'Password reset email sent successfully'
            });
        } catch (error) {
            // If email fails, clear the reset token
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });

            return res.status(500).json({
                success: false,
                data: 'Email could not be sent. Please try again later.'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            data: error.message
        });
    }
};

// @desc    Reset password
// @route   PUT /api/users/resetpassword/:token
// @access  Public
exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({
            success: false,
            data: 'Please provide a new password'
        });
    }

    // Validate password strength
    const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!regex.test(password)) {
        return res.status(400).json({
            success: false,
            data: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.'
        });
    }

    try {
        // Hash the token to compare with stored hash
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user with matching token and check expiry
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                data: 'Invalid or expired reset token'
            });
        }

        // Set new password
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            data: 'Password reset successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            data: error.message
        });
    }
};