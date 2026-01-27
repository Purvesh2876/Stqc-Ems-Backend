const https = require("https");
const axios = require("axios");
const abdListModel = require("../models/abdListModel");

// create instance of axios with custom config
const instance = axios.create({
  baseURL: "https://dev.arcisai.io/backend/api/admin",
  // baseURL: 'https://view.arcisai.io/backend/api/admin',
  // baseURL: 'http://localhost:7073/api/admin',
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});

// ---------------- Create ABD ----------------
exports.createAbd = async (req, res) => {
  const { abdId, abdName, channel, email } = req.body;

  try {
    // if (!abdId || !abdName || !channel || !email) {
    if (!abdId || !channel) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // if (!emailRegex.test(email)) {
    //     return res.status(400).json({ message: 'Invalid email format' });
    // }

    const existingAbd = await abdListModel.findOne({ abdId });
    if (existingAbd) {
      return res.status(400).json({ message: "ABD already exists" });
    }

    // Extract prefix from abdId (e.g., ABD-400188-RYNA → ABD-400188-)
    const parts = abdId.split("-");
    const prefix = `${parts[0]}-${parts[1]}-`;

    // Generate incremental assigned devices
    const assignDevices = [];
    for (let i = 1; i <= channel; i++) {
      const padded = String(i).padStart(5, "0"); // 00001, 00002, ...
      assignDevices.push({ id: `${prefix}${padded}` });
    }

    const newAbd = new abdListModel({
      abdId,
      //   abdName,
      channel,
      // email,
      assignDevice: assignDevices,
    });
    await newAbd.save();

    res.status(201).json({
      success: true,
      message: "ABD created successfully",
      abdId,
      assignedDevices: assignDevices.map((d) => d.id),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- Get ABD ----------------
exports.getAbd = async (req, res) => {
  try {
    const { abdName = "", page = 1 } = req.query;
    console.log("abdname", abdName);
    const limit = 10;
    const offset = (page - 1) * limit;

    const query = abdName ? { abdId: { $regex: abdName, $options: "i" } } : {};
    console.log(query);
    const totalCount = await abdListModel.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    const cameras = await abdListModel
      .find(query)
      .select("-__v")
      .skip(offset)
      .limit(limit)
      .lean();

    if (!cameras || cameras.length === 0) {
      return res.status(404).json({ message: "No ABD found" });
    }

    res.status(200).json({
      data: cameras,
      resultPerPage: limit,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------- Update ABD ----------------
exports.updateAbd = async (req, res) => {
  const { abdId } = req.query;
  const { abdName, email } = req.body;

  try {
    const abdData = await abdListModel.findOne({ abdId });
    if (!abdData) {
      return res.status(404).json({ message: "ABD not found" });
    }

    // Extract prefix/suffix from abdId
    // Example: ABD-00000-XXXXX -> ["ABD", "00000", "XXXXX"]
    const parts = abdId.split("-");
    const prefix = parts[0] + "-"; // "ABD-"
    const number = parseInt(parts[1]); // 0
    const suffix = "-" + parts[2]; // "-XXXXX"

    for (let i = 1; i <= abdData.channel; i++) {
      const newNumber = String(number + i).padStart(parts[1].length, "0");
      const deviceId = `${prefix}${newNumber}${suffix}`;

      await instance.post("/updateAbdCamera", {
        deviceId,
        email: email,
      });
    }

    await abdListModel.updateOne({ abdId }, { $set: { abdName, email } });

    res.status(200).json({ message: "ABD updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------- Delete ABD ----------------
exports.deleteAbd = async (req, res) => {
  const { abdId } = req.body;

  try {
    const abdData = await abdListModel.findOne({ abdId });
    if (!abdData) {
      return res.status(404).json({ message: "ABD not found" });
    }

    const { channel } = abdData;

    // Extract prefix/suffix from abdId
    const parts = abdId.split("-");
    const prefix = parts[0] + "-"; // "ABD-"
    const number = parseInt(parts[1]); // starting number
    const suffix = "-" + parts[2]; // "-XXXXX"

    for (let i = 1; i <= channel; i++) {
      const newNumber = String(number + i).padStart(parts[1].length, "0");
      const deviceId = `${prefix}${newNumber}${suffix}`;

      await instance.post("/deleteAbdCamera", { deviceId });
    }

    await abdListModel.deleteOne({ abdId });

    res
      .status(200)
      .json({ message: "ABD and its channels deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.checkAbdExists = async (req, res) => {
  try {
    const { abdId } = req.body;
    const isAbdExists = await abdListModel.findOne({ abdId });
    // console.log("ehloooe", isAbdExists);
    if (isAbdExists) {
      return res.status(200).json({
        exist: true,
        productType: isAbdExists.productType,
        channel: isAbdExists.channel,
        assignDevice:isAbdExists.assignDevice
      });
    }
    res.status(200).json({ exist: false });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
