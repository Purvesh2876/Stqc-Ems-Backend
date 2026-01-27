const express = require('express');
const router = express.Router();
const { createBatch, getAllBatches } = require('../controllers/batchController');
const upload = require('../middleware/upload');

router.post('/', upload, createBatch);
router.get('/', getAllBatches);

module.exports = router;
