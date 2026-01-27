// import generateReqs from '../models/generateReq.js';
// import Department from '../models/departmentModel.js';

// export const createGenerateReq = async (req, res) => {
//     try {
//         const {
//             employeeName,
//             employeeId,
//             employeeEmail,
//             department,
//             designation,
//             reqStatus,
//             reqType,
//             comments
//         } = req.body;

//         // Basic required field validation
//         if (!employeeName || !employeeId || !employeeEmail || !department || !designation) {
//             return res.status(400).json({ message: 'All required fields must be provided' });
//         }

//         // Find department
//         const dept = await Department.findOne({ deptName: department });
//         if (!dept) {
//             return res.status(404).json({ message: 'Department not found. Please create department first.' });
//         }

//         // Create new request, deptHead is pulled automatically from Department
//         const newReq = new generateReqs({
//             employeeName,
//             employeeId,
//             employeeEmail,
//             department: dept.deptName,
//             deptHead: dept.deptHead,
//             designation,
//             reqStatus: reqStatus || 'Pending',
//             reqType: reqType || 'New',
//             comments: comments || 'N/A',
//             createdDate: new Date()
//         });

//         await newReq.save();

//         // Push request ID into Department's pendingRequests
//         const updatedDept = await Department.findByIdAndUpdate(
//             dept._id,
//             { $push: { pendingRequests: newReq._id } },
//             { new: true }
//         ).populate('pendingRequests', '-__v'); // Avoid populating version field

//         return res.status(201).json({
//             message: 'Request created and linked to department successfully',
//             request: newReq,
//             department: updatedDept
//         });

//     } catch (error) {
//         return res.status(500).json({
//             message: 'Error creating request',
//             error: error.message
//         });
//     }
// };

// export const getGenerateReqs = async (req, res) => {
//     try {
//         const getGenerateReq = await generateReqs.find();
//         res.status(200).json({ data: getGenerateReq });
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching requests', error: error.message });
//     }
// }


// const Requirement = require('../models/Requirement');
// const Department = require('../models/Department'); // import Department model

import generateReqs from '../models/generateReq.js';
import Department from '../models/departmentModel.js';
import mime from 'mime-types'; // make sure you installed it
import path from 'path';
import fs from 'fs';
import { BASE_PDFS_DIR } from '../middleware/uploadFile.js'; // reuse your base dir

// 1) Create requirement (with department lookup and deptHead auto-fill)
export const createGenerateReq = async (req, res) => {
    console.log('data', req.body);
    try {
        const {
            employeeName,
            employeeId,
            employeeEmail,
            department,
            designation,
            reqStatus,
            reqType,
            comments
        } = req.body;

        // Basic required field validation
        if (!employeeName || !employeeId || !employeeEmail || !department || !designation) {
            return res.status(400).json({ message: 'All required fields must be provided' });
        }

        // Find department
        const dept = await Department.findOne({ deptName: department });
        if (!dept) {
            return res.status(404).json({
                message: 'Department not found. Please create department first.'
            });
        }

        // Create new requirement
        const newReq = new generateReqs({
            employeeName,
            employeeId,
            employeeEmail,
            department: dept.deptName, // from Department collection
            deptHead: dept.deptHead,   // auto-filled
            designation,
            reqStatus: reqStatus || 'pending',
            reqType: reqType || 'new',
            comments: comments || 'N/A',
            createdDate: new Date()
        });

        await newReq.save();

        // Push request ID into Department's pendingRequests
        const updatedDept = await Department.findByIdAndUpdate(
            dept._id,
            { $push: { pendingRequests: newReq._id } },
            { new: true }
        ).populate('pendingRequests', '-__v');

        return res.status(201).json({
            message: 'Requirement created and linked to department successfully',
            request: newReq,
            department: updatedDept
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Error creating requirement',
            error: error.message
        });
    }
};

export const deleteRequestById = async (req, res) => {
    try {
        const id = req.params.id;  // usually delete by URL param, not body
        const doc = await generateReqs.findByIdAndDelete(id);

        if (!doc) {
            return res.status(404).json({
                success: false,
                message: "Request not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Request deleted successfully",
            data: doc
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};


export const updateReqStatus = async (req, res) => {
    try {
        const { reqId, action } = req.body;
        const doc = await generateReqs.findByIdAndUpdate(
            reqId,
            { reqStatus: action },   // <-- set reqStatus to action
            { new: true }
        );

        res.status(200).json({
            success: true,
            data: doc
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


// 2) TL approval (approve/reject)
export const tlApproval = async (req, res) => {
    try {
        const { reqId, action, remarks } = req.body; // 'approve' or 'reject'
        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ error: "Action must be 'approve' or 'reject'" });
        }

        const update = {
            tlApproval: {
                status: action === 'approve' ? 'approved' : 'rejected',
                approvedBy: req.user.email || 'lala',
                approvedAt: new Date(),
                remarks: remarks || null
            }
        };

        if (action === 'approve') update.reqStatus = 'first_approval';
        if (action === 'reject') update.reqStatus = 'rejected';

        const doc = await generateReqs.findByIdAndUpdate(reqId, update, { new: true });
        if (!doc) return res.status(404).json({ error: 'Requirement not found' });

        res.json(doc);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// 3) Upload files (PDF, PNG, JPG/JPEG, XLS, XLSX)
// export const uploadQuotations = async (req, res) => {
//     console.log('jassi', req.params.id, req.body);
//     try {
//         const doc = await generateReqs.findById(req.params.id);
//         if (!doc) return res.status(404).json({ error: 'Requirement not found' });

//         if (!req.files || req.files.length === 0) {
//             return res.status(400).json({ error: 'No files uploaded' });
//         }

//         for (const file of req.files) {
//             if (!doc.quotationFiles.includes(file.filename)) {
//                 doc.quotationFiles.push(file.filename);
//             }
//         }

//         await doc.save();
//         res.status(201).json({ message: 'Files uploaded', files: doc.quotationFiles });
//     } catch (err) {
//         res.status(400).json({ error: err.message });
//     }
// };

export const uploadQuotations = async (req, res) => {
    try {
        const { id, type } = req.params; // type = 'quotation' or 'PO'
        console.log('Upload:', type, id);

        // Find requirement doc
        const doc = await generateReqs.findById(id);
        if (!doc) return res.status(404).json({ error: 'Requirement not found' });

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        // Decide which field to update based on type
        let fieldName;
        if (type === 'PO') {
            fieldName = 'poFiles';
            if (!doc.poFiles) doc.poFiles = []; // initialize if empty
        } else {
            fieldName = 'quotationFiles';
            if (!doc.quotationFiles) doc.quotationFiles = []; // initialize if empty
        }

        // Push uploaded files if not already present
        for (const file of req.files) {
            if (!doc[fieldName].includes(file.filename)) {
                doc[fieldName].push(file.filename);
            }
        }

        await doc.save();
        res.status(201).json({ message: 'Files uploaded', files: doc[fieldName] });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};


// get request
export const getGenerateReqs = async (req, res) => {
    try {
        // Get query params from frontend or set defaults
        const page = parseInt(req.query.page) || 1;          // default: 1st page
        const limit = parseInt(req.query.limit) || 10;       // default: 10 per page
        const search = req.query.search || "";               // default: no search
        console.log(page, limit, search)
        // Build search filter
        let filter = {};
        if (search) {
            filter = {
                $or: [
                    { employeeName: { $regex: search, $options: "i" } },
                    { employeeEmail: { $regex: search, $options: "i" } }  // case-insensitive
                ]
            };
        }

        // Count total docs (for frontend pagination info)
        const total = await generateReqs.countDocuments(filter);

        console.log("filter used:", JSON.stringify(filter, null, 2));
        console.log("total matching docs:", total);

        // Fetch data with pagination
        const getGenerateReq = await generateReqs
            .find(filter)
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();

        res.status(200).json({
            data: getGenerateReq,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalRecords: total
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching requests",
            error: error.message
        });
    }
};

// GET /api/reqs/:id/quotations/:filename
// export const downloadQuotation = async (req, res) => {
//     try {
//         const { id, filename } = req.params;

//         const doc = await generateReqs.findById(id);
//         if (!doc) return res.status(404).json({ error: 'Requirement not found' });

//         if (!doc.quotationFiles.includes(filename)) {
//             return res.status(404).json({ error: 'File not registered with this requirement' });
//         }

//         const filePath = path.join(BASE_PDFS_DIR, id, filename);
//         if (!fs.existsSync(filePath)) {
//             return res.status(410).json({ error: 'File missing on server' });
//         }

//         const contentType = mime.lookup(filename) || 'application/octet-stream';
//         res.setHeader('Content-Type', contentType);

//         // Use ?disposition=inline to preview; default is attachment (download)
//         const disposition = req.query.disposition === 'inline' ? 'inline' : 'attachment';
//         res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(filename)}"`);

//         fs.createReadStream(filePath).pipe(res);
//     } catch (err) {
//         res.status(400).json({ error: err.message });
//     }
// };

// GET /api/reqs/:type/:id/:filename
export const downloadQuotation = async (req, res) => {
    console.log('doc');
    try {
        const { type, id, filename } = req.params; // type = quotation or PO

        const doc = await generateReqs.findById(id);
        if (!doc) return res.status(404).json({ error: 'Requirement not found' });
        // Decide which array to check based on type
        const filesArray = type === 'PO' ? doc.poFiles || [] : doc.quotationFiles || [];
        if (!filesArray.includes(filename)) {
            return res.status(404).json({ error: 'File not registered with this requirement' });
        }

        // New path: pdfs/requirement/type/id/filename
        const filePath = path.join(BASE_PDFS_DIR, 'requirement', type, id, filename);
        if (!fs.existsSync(filePath)) {
            return res.status(410).json({ error: 'File missing on server' });
        }

        const contentType = mime.lookup(filename) || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);

        // Use ?disposition=inline to preview; default is attachment (download)
        const disposition = req.query.disposition === 'inline' ? 'inline' : 'attachment';
        res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(filename)}"`);

        fs.createReadStream(filePath).pipe(res);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
