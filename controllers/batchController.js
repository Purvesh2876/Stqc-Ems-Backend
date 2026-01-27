const fs = require('fs');
const path = require('path');
const batchModel = require('../models/batchModel');

exports.createBatch = async (req, res) => {
    try {
        const { deviceIds } = req.body;

        const newBatch = new batchModel({
            deviceIds: JSON.parse(deviceIds),
            certFolderPath: '/temp' // placeholder
        });

        await newBatch.save();

        const folderPath = path.join(__dirname, '..', 'certandkey', String(newBatch.batchNo));
        fs.mkdirSync(folderPath, { recursive: true });

        const certBuffer = req.files?.cert?.[0]?.buffer;
        const keyBuffer = req.files?.key?.[0]?.buffer;

        if (!certBuffer || !keyBuffer) {
            return res.status(400).json({ success: false, message: 'Cert or key file missing' });
        }

        fs.writeFileSync(path.join(folderPath, 'cert.pem'), certBuffer);
        fs.writeFileSync(path.join(folderPath, 'key.pem'), keyBuffer);

        newBatch.certFolderPath = path.join('/certandkey', String(newBatch.batchNo));
        await newBatch.save();

        res.status(201).json({
            success: true,
            message: 'Batch created and files uploaded successfully',
            data: newBatch
        });
    } catch (err) {
        console.error('Batch creation error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getAllBatches = async (req, res) => {
    try {
        const batches = await batchModel.find().sort({ batchNo: 1 });
        res.status(200).json({ success: true, data: batches });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
