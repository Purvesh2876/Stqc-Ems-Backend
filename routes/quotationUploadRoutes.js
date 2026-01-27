const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { uploadQuotation, getAllQuotations, deleteQuotation } = require("../controllers/quotationUpload");

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/quotations/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Routes
router.post("/upload", upload.single("quotation"), uploadQuotation);
router.get("/", getAllQuotations);
router.delete("/:id", deleteQuotation);

module.exports = router;
