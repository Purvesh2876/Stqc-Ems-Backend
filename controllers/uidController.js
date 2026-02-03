const Uids = require('../models/masterUid');
const Batch = require('../models/batchModel');

const generateRandomDigits = len =>
  Math.floor(Math.random() * Math.pow(10, len))
    .toString()
    .padStart(len, '0');

const generateRandomLetters = len =>
  Array.from({ length: len }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  ).join('');

exports.generateDeviceIdsForBatch = async (req, res) => {
  try {
    const { batchId, count } = req.body;

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    if (batch.status === 'LOCKED') {
      return res.status(400).json({ message: 'Batch is locked' });
    }

    const prefix = 'ATPL';

    const productMap = {
      'S-Series': 'S',
      'A-Series': 'A',
      'Novatek': 'N',
      'Innofusion': 'I'
    };

    const networkMap = {
      'POE': '0',
      'WIFI': '1',
      '4G': '2',
      '5G': '3'
    };

    const generated = new Set();

    while (generated.size < count) {
      const id = `${prefix}-${networkMap[batch.networkType]}${generateRandomDigits(5)}-${productMap[batch.productType]}${generateRandomLetters(4)}`;
      const exists = await Uids.findOne({ deviceId: id });
      if (!exists) generated.add(id);
    }

    const docs = Array.from(generated).map(deviceId => ({
      deviceId,
      SN: deviceId,
      productType: batch.productType,
      networkType: batch.networkType,
      batchId: batch._id
    }));

    await Uids.insertMany(docs);

    res.status(201).json({
      success: true,
      message: 'Device IDs generated for batch',
      count: docs.length
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllDeviceIds = async (req, res) => {
  try {
    const { batchId, burned, productType, networkType, page = 1 } = req.query;

    const query = {};
    if (batchId) query.batchId = batchId;
    if (productType) query.productType = productType;
    if (networkType) query.networkType = networkType;
    if (burned === 'true') query.burned = true;

    const limit = 20;
    const skip = (page - 1) * limit;

    const total = await Uids.countDocuments(query);
    const data = await Uids.find(query).skip(skip).limit(limit);

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
