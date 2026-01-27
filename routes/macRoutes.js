const express = require('express');
const { getAllMacWifiAddresses, getAllMacAddresses, createBulkMacWifiAddresses, createBulkMacAddresses } = require('../controllers/macController');
const router = express.Router();

// Route to get all MAC addresses
router.get('/mac-addresses', getAllMacAddresses);
// Route to get all MAC WiFi addresses
router.get('/mac-wifi-addresses', getAllMacWifiAddresses);
// Route to create bulk MAC addresses
router.post('/create-bulk-mac-addresses', createBulkMacAddresses);
// Route to create bulk MAC WiFi addresses
router.post('/create-bulk-mac-wifi-addresses', createBulkMacWifiAddresses);

module.exports = router;
