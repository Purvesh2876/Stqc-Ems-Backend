const express = require('express');
const { checkConnectionMqtt, checkConnectionP2P, getSdCardStatus, checkMediaServerConnection, getAllTickets, getTicketById, updateTicketStatus } = require('../controllers/supportController');
const { netInfo } = require('../controllers/settingsController');
const { isAuthenticatedUser } = require('../middleware/authMiddleware');

const router = express.Router();

// Route to check camera and MQTT connection
router.post('/check-connection', checkConnectionMqtt);
router.post('/check-connection-p2p', checkConnectionP2P);
router.get('/network-info', netInfo);
router.post('/sd-card-status', getSdCardStatus);
router.post('/media-server-connection', checkMediaServerConnection);
router.get('/getAllTickets', isAuthenticatedUser, getAllTickets);
router.get('/getTicketById/:ticketId', isAuthenticatedUser, getTicketById);
router.post('/updateStatus', isAuthenticatedUser, updateTicketStatus);

module.exports = router;
