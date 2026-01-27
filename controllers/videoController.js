const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

// Object to track ongoing streams
const activeStreams = {};

// Function to stream the video to RTMP
const streamVideo = (videoPath, deviceId) => {
    const rtmpUrl = `rtmp://media5.ambicam.com:1938/live/${deviceId}`;
    console.log(`Starting stream for video: ${videoPath}`);
    console.log(`Streaming to RTMP URL: ${rtmpUrl}`);

    const startStream = () => {
        const stream = ffmpeg(videoPath)
            .inputOptions(['-re']) // Real-time input
            .outputOptions(['-c:v', 'libx264', '-c:a', 'aac', '-f', 'flv', '-strict', '-2'])
            .output(rtmpUrl)
            .on('start', () => {
                console.log(`Started streaming ${videoPath} to ${rtmpUrl}`);
                activeStreams[deviceId] = stream; // Store the active stream process
            })
            .on('stderr', (stderr) => {
                console.log('FFmpeg stderr: ', stderr);
            })
            .on('end', () => {
                console.log(`Streaming ended for ${videoPath}. Restarting immediately...`);
                startStream(); // Restart immediately when streaming ends
            })
            .on('error', (err) => {
                console.error(`Error streaming video (${videoPath}):`, err.message);
                console.log('Attempting to restart the stream immediately...');
                startStream(); // Retry immediately on error
            })
            .run();
    };

    startStream();
};

// Controller for uploading video
const uploadVideo = (req, res) => {
    console.log('Upload request received.');

    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const videoPath = path.resolve(req.file.path);
    const deviceId = req.body.deviceId; // Get the device ID from the form

    if (!deviceId) {
        return res.status(400).send('Device ID is required.');
    }

    // Check if the video file exists
    if (!fs.existsSync(videoPath)) {
        return res.status(400).send('Uploaded video file not found.');
    }

    // Check if a stream for this deviceId is already running
    if (activeStreams[deviceId]) {
        return res
            .status(400)
            .send(`Streaming is already active for Device ID: ${deviceId}. Please use a unique Device ID.`);
    }

    // Start streaming the video
    streamVideo(videoPath, deviceId);
    res.status(200).send('Video uploaded and streaming started.');
};

module.exports = { uploadVideo };