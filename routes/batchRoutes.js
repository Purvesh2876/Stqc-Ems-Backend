const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');

const {
    createBatchWithUids,
    getAllBatches,
    getAllUids
} = require('../controllers/batchController');

/* CREATE BATCH + GENERATE UIDS */
router.post(
    '/batch/create-with-uids',
    upload.fields([
        { name: 'publicKey', maxCount: 1 },
        { name: 'seedCert', maxCount: 1 }
    ]),
    createBatchWithUids
);

/* GET ALL BATCHES */
router.get('/batch', getAllBatches);

/* GET ALL DEVICE IDS */
router.get('/uid', getAllUids);

module.exports = router;
