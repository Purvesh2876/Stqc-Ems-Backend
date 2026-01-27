const mongoose = require("mongoose");
const Lead = require("../models/crmLeadModel"); // if needed in future
//Leads Controller

// Create Lead (required fields only)
exports.createLead = async (req, res) => {
    try {
        const {
            name,
            mobile,
            email,
            company,
            location,
            industryType,
            customerType,
            requirement
        } = req.body;

        // Validate required fields
        if (!name || !mobile || !email || !company || !location || !industryType || !customerType || !requirement) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Validate requirement array objects
        for (const reqItem of requirement) {
            if (!reqItem.cameraType || !reqItem.quantity) {
                return res.status(400).json({ error: "Each requirement must have cameraType, quantity" });
            }
        }

        // Create new lead
        const newLead = new Lead({
            name,
            mobile,
            email,
            company,
            location,
            industryType,
            customerType,
            requirement
        });

        const savedLead = await newLead.save();
        return res.status(201).json(savedLead);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};

exports.createBulkUpload = async (req, res) => {
    try {
        const { data } = req.body; // Excel JSON from frontend
        console.log('upload files', data);
        if (!data || !Array.isArray(data) || data.length === 0) {
            return res.status(400).json({ error: "No data provided" });
        }

        // Insert all rows as new leads
        const insertedLeads = [];
        for (const row of data) {
            // Prepare requirement array if not already in array format
            const requirementArr = row.requirement || [
                {
                    cameraType: row.cameraType,
                    quantity: row.quantity,
                    orderTimeline: row.orderTimeline
                }
            ];

            const newLead = await Lead.create({
                ...row,
                requirement: requirementArr
            });

            console.log('lead', newLead)

            insertedLeads.push(newLead);
        }

        return res.status(200).json({
            message: "Bulk upload completed",
            insertedCount: insertedLeads.length,
            insertedLeads
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// Get all leads (with search + pagination)
exports.getAllLeads = async (req, res) => {
    try {
        let { page, search } = req.query;
        page = parseInt(page) || 1;
        limit = 10;
        const skip = (page - 1) * limit;

        // Build search filter
        let filter = {};
        if (search) {
            filter = {
                $or: [
                    { name: { $regex: search, $options: "i" } },       // case-insensitive
                    { email: { $regex: search, $options: "i" } },
                    { company: { $regex: search, $options: "i" } },
                    { location: { $regex: search, $options: "i" } },
                    { industryType: { $regex: search, $options: "i" } },
                    { customerType: { $regex: search, $options: "i" } }
                ]
            };
        }

        // Fetch leads with search + pagination
        const leads = await Lead.find(filter)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await Lead.countDocuments(filter);

        return res.status(200).json({
            page,
            limit,
            search,
            totalPages: Math.ceil(total / limit),
            totalLeads: total,
            leads
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};


// Get single lead by ID
exports.getLeadById = async (req, res) => {
    try {
        const { id } = req.query;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid lead ID" });
        }
        const lead = await Lead.findById(id);
        if (!lead) {
            return res.status(404).json({ error: "Lead not found" });
        }
        return res.status(200).json(lead);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// Update lead by ID
exports.updateLead = async (req, res) => {
    try {
        const { id } = req.query;
        const updates = req.body;

        console.log('id', id)

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid lead ID" });
        }

        // Fetch existing lead
        const lead = await Lead.findById(id);
        if (!lead) {
            return res.status(404).json({ error: "Lead not found" });
        }

        console.log('updates', updates.requirement);

        // If new requirements exist → merge them with old ones
        if (updates.requirement && Array.isArray(updates.requirement)) {
            // lead.requirement = [...lead.requirement, ...updates.requirement];
            lead.requirement = updates.requirement;
            delete updates.requirement; // remove from updates so it's not replaced
        }

        // Update other fields normally
        Object.assign(lead, updates);

        // Save and return
        const updatedLead = await lead.save();

        return res.status(200).json({
            message: "Lead updated successfully",
            lead: updatedLead
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// Delete lead by ID
exports.deleteLead = async (req, res) => {
    try {
        const { id } = req.query;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid lead ID" });
        }
        const deletedLead = await Lead.findByIdAndDelete(id);
        if (!deletedLead) {
            return res.status(404).json({ error: "Lead not found" });
        }
        return res.status(200).json({ message: "Lead deleted successfully" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

