const express = require('express');
const router = express.Router();
const { getHealth } = require('../controllers/healthController');
const { isAuthenticatedUser } = require('../middleware/authMiddleware')

// Define the route to get the latest message
router.get('/getHealth', isAuthenticatedUser, getHealth);

module.exports = router;
