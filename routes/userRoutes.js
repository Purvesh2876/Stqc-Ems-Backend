const express = require('express');
const { registerUser, loginUser, logoutUser, verifyUser, createEmsUser, forgotPassword, resetPassword } = require('../controllers/userController');
const { isAuthenticatedUser } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/verify', verifyUser);
router.post('/login', loginUser);
router.get('/logout', isAuthenticatedUser, logoutUser);
router.post('/createEmsUser', isAuthenticatedUser, createEmsUser);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:token', resetPassword);

module.exports = router;
