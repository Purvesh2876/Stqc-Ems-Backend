const express = require('express');
const { isAuthenticatedUser } = require('../middleware/authMiddleware');
const { getAbd, updateAbd, createAbd, deleteAbd, checkAbdExists } = require('../controllers/abdController');
const router = express.Router();

router.post('/createAbd', isAuthenticatedUser, createAbd)
router.get('/getAbd', isAuthenticatedUser, getAbd)
router.post('/updateAbd', isAuthenticatedUser, updateAbd)
router.post('/deleteAbd', isAuthenticatedUser, deleteAbd)
router.post('/checkAbdExists',checkAbdExists)

module.exports = router;