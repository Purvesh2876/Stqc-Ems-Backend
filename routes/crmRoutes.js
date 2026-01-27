const express = require('express');
const router = express.Router();
const { createProduct, getProductById, getProducts, updateProduct, deleteProduct } = require('../controllers/crmSalesController');
const { createStock, getAllStocks, getStockById, updateStock, deleteStock } = require('../controllers/crmSalesController');
const { createOrder, getAllOrders, getOrderById, updateOrder, deleteOrder } = require('../controllers/crmSalesController');
const { createRequest, getAllRequests, getRequestById, updateRequest, deleteRequest } = require('../controllers/crmSalesController');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/authMiddleware');
const { createLead, createBulkUpload, getAllLeads, getLeadById, updateLead, deleteLead } = require('../controllers/crmLeadsController');

// Product Routes
router.post('/createProduct', isAuthenticatedUser, authorizeRoles('admin', 'sales'), createProduct);
router.get('/getProducts', isAuthenticatedUser, getProducts);
router.get('/getProductById', isAuthenticatedUser, getProductById);
router.put('/updateProduct', isAuthenticatedUser, authorizeRoles('admin', 'sales'), updateProduct);
router.delete('/deleteProduct', isAuthenticatedUser, authorizeRoles('admin', 'sales'), deleteProduct);

// Stock Routes
router.post('/createStock', isAuthenticatedUser, authorizeRoles('admin', 'sales'), createStock);
router.get('/getAllStocks', isAuthenticatedUser, getAllStocks);
router.get('/getStockById', isAuthenticatedUser, getStockById);
router.put('/updateStock', isAuthenticatedUser, authorizeRoles('admin', 'sales'), updateStock);
router.delete('/deleteStock', isAuthenticatedUser, authorizeRoles('admin', 'sales'), deleteStock);

//Order Routes 
router.post('/createOrder', createOrder);
router.get('/getAllOrders', getAllOrders);
router.get('/getOrderById', getOrderById);
router.put('/updateOrder', updateOrder);
router.delete('/deleteOrder', deleteOrder);

//Requrest Routes
router.post('/createRequest', createRequest);
router.get('/getAllRequests', getAllRequests);
router.get('/getRequestById', getRequestById);
router.put('/updateRequest', updateRequest);
router.delete('/deleteRequest', deleteRequest);

//Leads Routes
router.post('/createLead', createLead);
router.post('/createBulkUpload', createBulkUpload);
router.get('/getAllLeads', getAllLeads);
router.get('/getLeadById', getLeadById);
router.put('/updateLead', updateLead);
router.delete('/deleteLead', deleteLead);

module.exports = router;
