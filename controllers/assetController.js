// controllers/assetController.js
const Asset = require("../models/assetModel");
const xlsx = require('xlsx');

// Create Asset
exports.createAsset = async (req, res) => {
    try {
        const {
            assetName,
            assetId,
            brand,
            assetAssignedTo,
            srNo,
            modelNo,
            organisation,
            processor,
            gpu,
            ram,
            storage,
            description
        } = req.body;

        const assetAssignee = req.user._id;

        // Validation
        if (!assetName || typeof assetName !== "string") {
            return res.status(400).json({ error: "Asset name is required and must be a string." });
        }
        if (!assetId || typeof assetId !== "string") {
            return res.status(400).json({ error: "Asset ID is required and must be a string." });
        }
        // if (!brand || typeof brand !== "string") {
        //     return res.status(400).json({ error: "Mac ID is required and must be a string." });
        // }
        if (!assetAssignedTo || typeof assetAssignedTo !== "string") {
            return res.status(400).json({ error: "Asset Assigned To is required and must be a string." });
        }
        // if (!srNo || typeof srNo !== "string") {
        //     return res.status(400).json({ error: "SR. number is required and must be a string." });
        // }
        // if (!modelNo || typeof modelNo !== "string") {
        //     return res.status(400).json({ error: "Model Number is required and must be a string." });
        // }

        const asset = new Asset({
            assetName,
            assetId,
            brand,
            assetAssignedTo,
            assetAssignee,
            srNo: srNo || "N/A",
            modelNo: modelNo || "N/A",
            organisation,
            processor: processor || "N/A",
            gpu: gpu || "N/A",
            ram: ram || "N/A",
            storage: storage || "N/A",
            description: description || "N/A",
        });

        const savedAsset = await asset.save();
        res.status(201).json({ message: "Asset created successfully", data: savedAsset });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

// Get All Assets assigned to the logged-in user with Pagination (10 per page)
exports.getAssets = async (req, res) => {
    try {
        // Get query params from frontend or set defaults
        const page = parseInt(req.query.page) || 1;      // default: 1st page
        const limit = parseInt(req.query.limit) || 10;   // default: 10 per page
        const search = (req.query.search || "").trim();  // default: no search
        console.log(page, limit, search);

        // Build search filter
        let filter = {};
        if (search) {
            filter = {
                $or: [
                    { assetId: { $regex: search, $options: "i" } },
                    { assetAssignedTo: { $regex: search, $options: "i" } },
                    { assetName: { $regex: search, $options: "i" } }
                ]
            };
        }

        // Count total docs (for frontend pagination info)
        const total = await Asset.countDocuments(filter);

        // Fetch data with pagination
        const assets = await Asset.find(filter)
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();

        res.status(200).json({
            data: assets,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalRecords: total
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching assets",
            error: error.message
        });
    }
};



// Get Single Asset by ID
exports.getAssetById = async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id);
        if (!asset) {
            return res.status(404).json({ error: "Asset not found" });
        }
        res.status(200).json(asset);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

// Update Asset
exports.updateAsset = async (req, res) => {
    console.log("call is here");
    try {
        const { assetName, assetId, brand, assetAssignedTo, assetAssignee, srNo, modelNo, organisation, processor, gpu, ram, storage, description } = req.body;
        console.log("Update Asset called with body: ", req.body);

        // Validation
        // if (assetName && typeof assetName !== "string") {
        //     return res.status(400).json({ error: "Asset name must be a string." });
        // }
        // if (assetId && typeof assetId !== "string") {
        //     return res.status(400).json({ error: "Asset ID must be a string." });
        // }
        // if (brand && typeof brand !== "string") {
        //     return res.status(400).json({ error: "Mac ID must be a string." });
        // }
        // if (assetAssignedTo && typeof assetAssignedTo !== "string") {
        //     return res.status(400).json({ error: "Asset Assigned To must be a string." });
        // }
        // if (assetAssignee && typeof assetAssignee !== "string") {
        //     return res.status(400).json({ error: "Asset Assignee must be a string." });
        // }
        // if (!srNo || typeof srNo !== "string") {
        //     return res.status(400).json({ error: "SR. number is required and must be a string." });
        // }
        // if (!modelNo || typeof modelNo !== "string") {
        //     return res.status(400).json({ error: "Model Number is required and must be a string." });
        // }
        const updatedAsset = await Asset.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    assetName,
                    assetId,
                    brand,
                    assetAssignedTo,
                    assetAssignee,
                    srNo,
                    modelNo,
                    organisation,
                    processor,
                    gpu,
                    ram,
                    storage,
                    description
                }
            },
            { new: true, runValidators: true }
        );

        if (!updatedAsset) {
            return res.status(404).json({ error: "Asset not found" });
        }

        res.status(200).json({ message: "Asset updated successfully", data: updatedAsset });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

// Delete Asset
exports.deleteAsset = async (req, res) => {
    try {
        const deletedAsset = await Asset.findByIdAndDelete(req.params.id);
        if (!deletedAsset) {
            return res.status(404).json({ error: "Asset not found" });
        }
        res.status(200).json({ message: "Asset deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

// Helper function to normalize organization value
const normalizeOrganization = (orgValue) => {
    if (!orgValue || typeof orgValue !== 'string') {
        return null;
    }
    
    // Convert to lowercase and trim spaces
    const normalized = orgValue.toLowerCase().trim();
    
    // Mapping of various input values to backend values
    const orgMapping = {
        'atpl': 'adiance',
        'adiance': 'adiance',
        'vspl': 'vmukti',
        'vmukti': 'vmukti',
        'consultant': 'consultant'
    };
    
    // Return mapped value or null if not found
    return orgMapping[normalized] || null;
};

// Import Assets from Excel
exports.importAssets = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const file = req.files[0];
        const workbook = xlsx.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        // Expected column names (exact match required)
        const expectedColumns = ["AssetName", "AssetId", "Brand", "Employee", "Organization"];
        
        // Check if data is empty
        if (!data || data.length === 0) {
            return res.status(400).json({ 
                error: "Excel file is empty or has no data rows" 
            });
        }

        // Get actual column names from first row
        const actualColumns = Object.keys(data[0]);
        
        // Validate that all required columns are present (order doesn't matter)
        const missingColumns = [];

        expectedColumns.forEach(col => {
            if (!actualColumns.includes(col)) {
                missingColumns.push(col);
            }
        });

        // Only reject if required columns are missing (allow extra columns)
        if (missingColumns.length > 0) {
            let errorMessage = "Column name validation failed. ";
            errorMessage += `Missing required columns: "${missingColumns.join('", "')}". `;
            errorMessage += `Expected columns: "${expectedColumns.join('", "')}". `;
            errorMessage += `Found columns: "${actualColumns.join('", "')}".`;
            
            return res.status(400).json({ 
                error: errorMessage
            });
        }

        // Check for duplicate AssetId in the excel file itself
        const assetIdMap = new Map();
        const duplicateAssetIds = new Set();
        
        for (const [index, row] of data.entries()) {
            const assetId = row.AssetId;
            if (assetId) {
                if (assetIdMap.has(assetId)) {
                    duplicateAssetIds.add(assetId);
                } else {
                    assetIdMap.set(assetId, index + 2); // +2 because index is 0-based and Excel rows start at 2 (header is row 1)
                }
            }
        }

        // If duplicate AssetId found, return error
        if (duplicateAssetIds.size > 0) {
            const duplicateList = Array.from(duplicateAssetIds).map(id => `"${id}"`).join(', ');
            return res.status(400).json({ 
                error: `Duplicate AssetId found in Excel file: ${duplicateList}. If this AssetId is linked to multiple assets then make a separate excel with that AssetId and all the asset names in the AssetName column.`
            });
        }

        const assetsToInsert = [];
        const errors = [];
        const validOrgs = ['adiance', 'vmukti', 'consultant'];

        for (const [index, row] of data.entries()) {
            const {
                AssetName, AssetId, Brand, Employee, Organization,
                SRNO, ModelNo, GPU, Processor, Ram, Storage, Comments
            } = row;

            // Compulsory fields validation
            if (!AssetName || !AssetId || !Brand || !Employee || !Organization) {
                const missing = [];
                if (!AssetName) missing.push('AssetName');
                if (!AssetId) missing.push('AssetId');
                if (!Brand) missing.push('Brand');
                if (!Employee) missing.push('Employee');
                if (!Organization) missing.push('Organization');

                errors.push(`Row ${index + 2}: Missing required fields: ${missing.join(', ')}`);
                continue;
            }

            // Normalize organization value
            const normalizedOrg = normalizeOrganization(Organization);
            
            // Validate normalized organization
            if (!normalizedOrg || !validOrgs.includes(normalizedOrg)) {
                errors.push(`Row ${index + 2}: Invalid Organization value "${Organization}". Accepted values: "ATPL" or "Adiance" for adiance, "VSPL" or "Vmukti" for vmukti, "CONSULTANT" for consultant.`);
                continue;
            }

            assetsToInsert.push({
                assetName: AssetName,
                assetId: AssetId,
                brand: Brand,
                assetAssignedTo: Employee,
                assetAssignee: req.user._id,
                organisation: normalizedOrg,
                srNo: SRNO || "N/A",
                modelNo: ModelNo || "N/A",
                gpu: GPU || "N/A",
                processor: Processor || "N/A",
                ram: Ram || "N/A",
                storage: Storage || "N/A",
                description: Comments || "N/A"
            });
        }

        let insertedCount = 0;
        if (assetsToInsert.length > 0) {
            try {
                const result = await Asset.insertMany(assetsToInsert, { ordered: false });
                insertedCount = result.length;
            } catch (insertError) {
                // Handle partial insertion errors
                if (insertError.writeErrors) {
                    insertedCount = insertError.insertedDocs.length;
                    insertError.writeErrors.forEach(err => {
                        errors.push(`Row (unknown): Database error - ${err.errmsg}`);
                    });
                } else {
                    // If it's not a writeError (e.g. validation error before write), rethrow
                    throw insertError;
                }
            }
        }

        if (errors.length > 0) {
            return res.status(200).json({
                message: "Assets processed with some errors",
                insertedCount: insertedCount,
                errors: errors
            });
        }

        res.status(200).json({
            message: "Assets imported successfully",
            insertedCount: insertedCount,
            errors: []
        });

    } catch (error) {
        console.error("Import error:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};