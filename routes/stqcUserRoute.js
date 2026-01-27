const express = require('express');
const { registerUser, loginUser, createStqcMasterData, createStqcCameraData, cameraFromEmail, deleteStqcCameraData, verifyOTP } = require('../controllers/stqcUserController');
const router = express.Router();

router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP);  // Step 2
router.post('/login', loginUser);
router.post('/createStqcMasterData', createStqcMasterData);
router.post('/createStqcCameraData', createStqcCameraData);
router.post('/deleteStqcCameraData', deleteStqcCameraData);
router.post('/cameraFromEmail', cameraFromEmail);

module.exports = router;
