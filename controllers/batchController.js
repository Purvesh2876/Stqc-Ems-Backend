const fs = require('fs');
const path = require('path');
const Batch = require('../models/batchModel');
const Uids = require('../models/masterUid');

/* ================== HELPERS ================== */

const generateRandomDigits = len =>
  Math.floor(Math.random() * Math.pow(10, len)).toString().padStart(len, '0');

const generateRandomLetters = len =>
  Array.from({ length: len }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  ).join('');

/* ================== CREATE + GENERATE ================== */

exports.createBatchWithUids = async (req, res) => {
  try {
    const { batchCode, productType, networkType, count } = req.body;

    if (!req.files?.publicKey || !req.files?.seedCert) {
      return res.status(400).json({ message: 'Public key & seed cert required' });
    }

    const batch = await Batch.create({
      batchCode,
      productType,
      networkType,
      quantity: count,
      publicKeyPath: 'temp',
      seedCertPath: 'temp'
    });

    const folderPath = path.join(
      __dirname, '..', 'uploads', 'batches', batchCode
    );
    fs.mkdirSync(folderPath, { recursive: true });

    fs.writeFileSync(
      path.join(folderPath, 'public_key.pem'),
      req.files.publicKey[0].buffer
    );
    fs.writeFileSync(
      path.join(folderPath, 'seed_cert.pem'),
      req.files.seedCert[0].buffer
    );

    batch.publicKeyPath = `/uploads/batches/${batchCode}/public_key.pem`;
    batch.seedCertPath = `/uploads/batches/${batchCode}/seed_cert.pem`;
    await batch.save();

    const productMap = {
      'S-Series': 'S',
      'A-Series': 'A',
      'Novatek': 'N',
      'Innofusion': 'I'
    };

    const networkMap = {
      POE: '0',
      WIFI: '1',
      '4G': '2',
      '5G': '3'
    };

    const prefix = 'ATPL';
    const created = [];

    while (created.length < Number(count)) {
      const deviceId = `${prefix}-${networkMap[networkType]}${generateRandomDigits(5)}-${productMap[productType]}${generateRandomLetters(4)}`;
      const exists = await Uids.findOne({ deviceId });
      if (!exists) {
        created.push({
          deviceId,
          SN: deviceId,
          productType,
          networkType,
          batchId: batch._id
        });
      }
    }

    await Uids.insertMany(created);

    res.status(201).json({
      success: true,
      message: 'Batch created & UIDs generated',
      batchId: batch._id
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================== GET ALL BATCHES ================== */

exports.getAllBatches = async (req, res) => {
  try {
    const batches = await Batch.find().sort({ createdAt: -1 });
    res.json({ success: true, data: batches });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================== GET ALL UIDS ================== */

exports.getAllUids = async (req, res) => {
  try {
    const { page = 1, batchId, burned, deviceId } = req.query;

    const query = {};
    if (batchId) query.batchId = batchId;
    if (deviceId) query.deviceId = deviceId;
    if (burned === 'true') query.burned = true;

    const limit = 20;
    const skip = (page - 1) * limit;

    const total = await Uids.countDocuments(query);
    const data = await Uids.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
      data
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
