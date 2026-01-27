const express = require('express');
const router = express.Router();
const { getLatestMessage } = require('../controllers/dataController');
const { isAuthenticatedUser } = require('../middleware/authMiddleware');

// Define the route to get the latest message
router.get('/latest-message', isAuthenticatedUser, getLatestMessage);

module.exports = router;
