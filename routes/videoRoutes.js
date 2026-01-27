const express = require('express');
const multer = require('multer');
const { uploadVideo } = require('../controllers/videoController');

const router = express.Router();

// Configure Multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Route for video upload and streaming
router.post('/upload', upload.single('video'), uploadVideo);

module.exports = router;
