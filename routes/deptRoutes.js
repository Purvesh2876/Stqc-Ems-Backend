const express = require('express');
const router = express.Router();

const { createDepartment, getDepartment } = require('../controllers/departmentController');


router.post('/createDepartment', createDepartment)
router.get('/getDepartment', getDepartment)


module.exports = router;
