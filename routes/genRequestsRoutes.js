const express = require('express');
const router = express.Router();
const { createGenerateReq, getGenerateReqs, tlApproval, uploadQuotations, updateReqStatus, downloadQuotation, deleteRequestById } = require('../controllers/generaterReqController');
const { isAuthenticatedUser } = require('../middleware/authMiddleware');
const { uploadRequirementFiles } = require('../middleware/uploadFile');
const { createAsset, getAssets, getAssetById, updateAsset, deleteAsset, importAssets } = require('../controllers/assetController');


router.post('/createGenerateReq', createGenerateReq)
router.post('/tlApproval', isAuthenticatedUser, tlApproval)
router.get('/', getGenerateReqs)
// 3) Upload files
router.post('/:type/:id/quotations', uploadRequirementFiles.array('files', 10), uploadQuotations);
router.get('/:type/:id/:filename', /* isAuthenticatedUser, */ downloadQuotation);
router.post('/updateReqStatus', isAuthenticatedUser, updateReqStatus);
router.delete('/deleteRequestById/:id', isAuthenticatedUser, deleteRequestById);
// Create asset
router.post("/createAsset", isAuthenticatedUser, createAsset);

// Get all assets with pagination (default limit = 10)
router.get("/assets", isAuthenticatedUser, getAssets);

// Get single asset by ID
router.get("/:id", getAssetById);

// Update asset by ID
router.put("/updateAsset/:id", updateAsset);

// Delete asset by ID
router.delete("/:id", deleteAsset);

// Import assets from Excel
router.post("/importAssets", isAuthenticatedUser, uploadRequirementFiles.array('files', 1), importAssets);


module.exports = router;
