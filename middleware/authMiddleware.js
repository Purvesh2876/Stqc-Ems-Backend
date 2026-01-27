const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const catchAsyncErrors = require("./catchAsyncErrors");

exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Authentication required. Please log in to access this resource."
        });
    }

    try {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decodedData.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found. Please log in again."
            });
        }

        // Check if the token exists in the user's tokens array
        const tokenExists = user.tokens.some((tokenObj) => tokenObj.token === token);
        if (!tokenExists) {
            return res.status(401).json({
                success: false,
                message: "Session expired or token invalid. Please log in again."
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token. Authorization failed."
        });
    }
});

// Middleware to authorize roles (with roles in an array)
exports.authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        console.log("User Roles:", req.user.role);
        const userRoles = req.user.role; // Assuming this is an array of roles
        const hasAccess = userRoles.some((role) => allowedRoles.includes(role));

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: `You do not have permission to access this resource.`,
                // message: `Access denied. Your roles '${userRoles}' do not include the required role(s): '${allowedRoles.join(", ")}'.`
            });
        }

        next();
    };
};
