const mongoose = require("mongoose");
const Product = require("../models/crmProductModel");
const Stock = require("../models/crmStockModel"); // adjust path
const Customer = require("../models/userModel"); // for population (optional)
const Order = require("../models/crmOrderModel"); // if needed in future
const Request = require("../models/crmRequestModel"); // if needed in future
const Lead = require("../models/crmLeadModel"); // if needed in future
// PRODUCT CONTROLLER

// Create a new product
exports.createProduct = async (req, res) => {
  try {
    const { productName, description, units, pricePerUnit, status } = req.body;

    const existingProduct = await Product.findOne({ productName });
    if (existingProduct) {
      // update existing product
      existingProduct.units += units; // increment units
      existingProduct.save();
      return res.status(200).json({ existingProduct, message: "Product already exists, units updated, if want to change other details, use update API" });
    }


    const newProduct = new Product({
      productName,
      description,
      units,
      pricePerUnit,
      status,           // optional (default = "in_stock" if not given)
      createdAt: new Date()  // since schema already has timestamps, this is optional
    });

    const savedProduct = await newProduct.save();
    return res.status(201).json(savedProduct);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all products
exports.getProducts = async (req, res) => {
  try {
    // Read query params (default page=1, limit=10)
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    // Calculate skip
    const skip = (page - 1) * limit;

    // Fetch products with pagination
    const products = await Product.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // optional: newest first

    // Count total documents
    const total = await Product.countDocuments();

    res.status(200).json({
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
      products
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    console.log("getProducts operation completed");
  }
};

// Get a single product by ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.query;

    // Fetch product
    const product = await Product.findById(id);

    if (!product) {
      console.log(`❌ No product found with id: ${id}`);
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error("🔥 Error in getProductById:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// Update a product by ID
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.query;
    const updates = req.body;
    const updatedProduct = await Product.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a product by ID
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.query;
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


//Stock Controller

// ✅ Create a stock entry
exports.createStock = async (req, res) => {
  try {
    const { id } = req.user;
    const { productId, quantity } = req.body;

    if (!id || !productId || !quantity) {
      return res.status(400).json({ error: "userId, productId, and quantity are required" });
    }

    const newStock = new Stock({
      userId: id,
      productId,
      quantity,
    });

    const savedStock = await newStock.save();
    res.status(201).json(savedStock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get all stock entries (with pagination + populate)
exports.getAllStocks = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    const stocks = await Stock.find()
      .populate("userId", "name email") // adjust fields as per customer schema
      .populate("productId", "productName price")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Stock.countDocuments();

    res.status(200).json({
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalStocks: total,
      stocks,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get a single stock by ID
exports.getStockById = async (req, res) => {
  try {
    const { id } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid stock ID format" });
    }

    const stock = await Stock.findById(id)
      .populate("userId", "name email")
      .populate("productId", "productName price");

    if (!stock) {
      return res.status(404).json({ error: "Stock entry not found" });
    }

    res.status(200).json(stock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Update stock by ID
exports.updateStock = async (req, res) => {
  try {
    const { id } = req.query;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid stock ID format" });
    }

    const updatedStock = await Stock.findByIdAndUpdate(id, updates, { new: true })
      .populate("userId", "name email")
      .populate("productId", "productName price");

    if (!updatedStock) {
      return res.status(404).json({ error: "Stock entry not found" });
    }

    res.status(200).json(updatedStock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Delete stock by ID
exports.deleteStock = async (req, res) => {
  try {
    const { id } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid stock ID format" });
    }

    const deletedStock = await Stock.findByIdAndDelete(id);

    if (!deletedStock) {
      return res.status(404).json({ error: "Stock entry not found" });
    }

    res.status(200).json({ message: "Stock entry deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Order Controller (if needed in future)

// ✅ Create an order
exports.createOrder = async (req, res) => {
  try {
    const { createdBy, orderCreatedBy, orderQuantity, productId, finalPrice, deliveryStatus } = req.body;

    if (!createdBy || !orderCreatedBy || !orderQuantity || !productId || !finalPrice) {
      return res.status(400).json({ error: "All required fields must be provided" });
    }

    const newOrder = new Order({
      createdBy,
      orderCreatedBy,
      orderQuantity,
      productId,
      finalPrice,
      deliveryStatus
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get all orders (with pagination + populate)
exports.getAllOrders = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    const orders = await Order.find()
      .populate("orderCreatedBy", "name email") // adjust fields from customer model
      .populate("productId", "productName price")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments();

    res.status(200).json({
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalOrders: total,
      orders,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get single order by ID
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const order = await Order.findById(id)
      .populate("orderCreatedBy", "name email")
      .populate("productId", "productName price");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Update order
exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.query;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const updatedOrder = await Order.findByIdAndUpdate(id, updates, { new: true })
      .populate("orderCreatedBy", "name email")
      .populate("productId", "productName price");

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Delete order
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const deletedOrder = await Order.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Request Controller

// 👉 Create Request
exports.createRequest = async (req, res) => {
  try {
    const { requestedBy, product, quantity, remarks, status } = req.body;

    const newRequest = new Request({
      requestedBy,
      product,
      quantity,
      remarks,
      status
    });

    const savedRequest = await newRequest.save();
    res.status(201).json(savedRequest);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 👉 Get All Requests
exports.getAllRequests = async (req, res) => {
  try {
    const requests = await Request.find()
      .populate("product", "productName price"); // populate product info
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👉 Get Single Request by ID
exports.getRequestById = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate("product", "productName price");
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }
    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 👉 Update Request
exports.updateRequest = async (req, res) => {
  try {
    const { requestedBy, product, quantity, remarks, status } = req.body;

    const updatedRequest = await Request.findByIdAndUpdate(
      req.params.id,
      { requestedBy, product, quantity, remarks, status },
      { new: true, runValidators: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ error: "Request not found" });
    }

    res.status(200).json(updatedRequest);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 👉 Delete Request
exports.deleteRequest = async (req, res) => {
  try {
    const deletedRequest = await Request.findByIdAndDelete(req.params.id);

    if (!deletedRequest) {
      return res.status(404).json({ error: "Request not found" });
    }

    res.status(200).json({ message: "Request deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
