// import model
const MacModel = require('../models/macModel');
const MacWifiModel = require('../models/macWifimodel');

// Function to create a new bulk MAC address entry
exports.createBulkMacAddresses = async (req, res) => {
    try {
        const macAddresses = req.body;

        if (!Array.isArray(macAddresses) || macAddresses.length === 0) {
            return res.status(400).json({ message: 'Invalid or empty MAC address array.' });
        }

        // Filter out invalid macIds (null, undefined, or empty strings)
        const validEntries = macAddresses.filter(entry =>
            entry.macAddr && typeof entry.macAddr === 'string' && entry.macAddr.trim() !== ''
        );

        if (validEntries.length === 0) {
            return res.status(400).json({ message: 'No valid macAddr entries found.' });
        }

        // Insert many, skipping duplicates
        const inserted = await MacModel.insertMany(validEntries, { ordered: false });

        res.status(201).json({
            message: 'MAC addresses inserted (duplicates skipped)',
            insertedCount: inserted.length,
            inserted
        });
    } catch (error) {
        if (error.name === 'BulkWriteError' && error.code === 11000) {
            return res.status(207).json({
                message: 'Some MAC addresses were skipped due to duplication.',
                error: 'Duplicate macId values encountered.'
            });
        }

        res.status(500).json({ message: error.message });
    }
};

// Function to create a new bulk MAC WiFi address entry
exports.createBulkMacWifiAddresses = async (req, res) => {
    try {
        const macWifiAddresses = req.body;

        if (!Array.isArray(macWifiAddresses) || macWifiAddresses.length === 0) {
            return res.status(400).json({ message: 'Invalid or empty MAC WiFi address array.' });
        }

        // Validate each item has a non-null macWifiId
        const validEntries = macWifiAddresses.filter(entry => entry.macWifiAddr && typeof entry.macWifiAddr === 'string');

        if (validEntries.length === 0) {
            return res.status(400).json({ message: 'No valid macWifiAddr entries found.' });
        }

        const createdMacWifiAddresses = await MacWifiModel.insertMany(validEntries, { ordered: false });

        res.status(201).json({
            message: 'Bulk MAC WiFi addresses created successfully',
            data: createdMacWifiAddresses
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Duplicate MAC WiFi address detected.' });
        }
        res.status(500).json({ message: error.message });
    }
}

// Function to get all MAC addresses
exports.getAllMacAddresses = async (req, res) => {
    try {
        const macAddresses = await MacModel.find();
        res.status(200).json({ data: macAddresses });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Function to get all MAC WiFi addresses
exports.getAllMacWifiAddresses = async (req, res) => {
    try {
        const macWifiAddresses = await MacWifiModel.find();
        res.status(200).json({ data: macWifiAddresses });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}