const QuotationUpload = require("../models/quotationUpload.js");
const path = require("path");
const fs = require("fs");

// @desc Upload a quotation file
// @route POST /api/quotations/upload
exports.uploadQuotation = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { req_id } = req.body;
    if (!req_id) {
      return res.status(400).json({ message: "Request ID is required" });
    }

    const newUpload = new QuotationUpload({
      req_id,
      filename: req.file.filename,
      filePath: req.file.path
    });

    await newUpload.save();
    res.status(201).json({ message: "Quotation uploaded successfully", data: newUpload });

  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc Get all quotation uploads
// @route GET /api/quotations
exports.getAllQuotations = async (req, res) => {
  try {
    const quotations = await QuotationUpload.find().populate("req_id");
    res.status(200).json(quotations);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc Delete a quotation by ID
// @route DELETE /api/quotations/:id
exports.deleteQuotation = async (req, res) => {
  try {
    const quotation = await QuotationUpload.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    // Remove file from storage
    if (fs.existsSync(quotation.filePath)) {
      fs.unlinkSync(quotation.filePath);
    }

    await quotation.remove();
    res.status(200).json({ message: "Quotation deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
