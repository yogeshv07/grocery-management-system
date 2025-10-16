const express = require("express");
const multer = require("multer");
const path = require("path");
const Product = require("../models/Product");
const StockHistory = require("../models/StockHistory");

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single product
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new product (admin only) with image upload
router.post("/", (req, res) => {
  upload.single('image')(req, res, async (err) => {
    try {
      // Handle multer errors
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({ error: err.message });
      }

      console.log('Request body:', req.body);
      console.log('Request file:', req.file);
      
      const { name, description, price } = req.body;

      if (!name || !price) {
        return res.status(400).json({ 
          error: "Name and price are required",
          receivedBody: req.body 
        });
      }

      const { stock, category } = req.body;

      const productData = {
        name: name.trim(),
        description: description ? description.trim() : '',
        price: parseFloat(price),
        stock: stock ? parseInt(stock) : 0,
        category: category ? category.trim() : ''
      };

      // If image was uploaded, add filename to product data
      if (req.file) {
        productData.image = req.file.filename;
        console.log('Image uploaded:', req.file.filename);
      }

      const product = await Product.create(productData);
      res.status(201).json({ message: "Product added successfully", product });
    } catch (err) {
      console.error('Error adding product:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: "File too large. Maximum size is 5MB" });
      }
      res.status(500).json({ error: err.message });
    }
  });
});

// Update product
router.put("/:id", (req, res) => {
  upload.single('image')(req, res, async (err) => {
    try {
      // Handle multer errors
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({ error: err.message });
      }

      const { id } = req.params;
      const { name, description, price, stock, category } = req.body;

      if (!name || !price) {
        return res.status(400).json({ 
          error: "Name and price are required" 
        });
      }

      const updateData = {
        name: name.trim(),
        description: description ? description.trim() : '',
        price: parseFloat(price),
        stock: stock ? parseInt(stock) : 0,
        category: category ? category.trim() : ''
      };

      // If new image was uploaded, add filename to update data
      if (req.file) {
        updateData.image = req.file.filename;
        console.log('New image uploaded:', req.file.filename);
      }

      const product = await Product.findByIdAndUpdate(id, updateData, { new: true });
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json({ message: "Product updated successfully", product });
    } catch (err) {
      console.error('Error updating product:', err);
      res.status(500).json({ error: err.message });
    }
  });
});

// Delete product
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // TODO: Optionally delete the image file from uploads folder
    // if (product.image) {
    //   const imagePath = path.join(__dirname, '../uploads', product.image);
    //   if (fs.existsSync(imagePath)) {
    //     fs.unlinkSync(imagePath);
    //   }
    // }

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: err.message });
  }
});

// Stock Management Routes

// Update stock manually
router.put("/:id/stock", async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, reason, type = 'ADJUSTMENT' } = req.body;

    if (!Number.isInteger(stock) || stock < 0) {
      return res.status(400).json({ error: "Stock must be a non-negative integer" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const previousStock = product.stock;
    const quantity = stock - previousStock;

    // Update product stock
    product.stock = stock;
    if (stock > previousStock) {
      product.lastRestocked = new Date();
    }
    await product.save();

    // Log stock history
    await StockHistory.logStockMovement({
      productId: id,
      type: type,
      quantity: quantity,
      previousStock: previousStock,
      newStock: stock,
      reason: reason || `Manual stock ${type.toLowerCase()}`
    });

    res.json({ 
      message: "Stock updated successfully", 
      product: {
        ...product.toObject(),
        stockStatus: product.stockStatus,
        isAvailable: product.isAvailable
      },
      stockChange: quantity
    });
  } catch (err) {
    console.error('Error updating stock:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get stock history for a product
router.get("/:id/stock-history", async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const history = await StockHistory.getProductHistory(id, parseInt(limit));
    
    res.json({
      product: {
        id: product._id,
        name: product.name,
        currentStock: product.stock,
        stockStatus: product.stockStatus
      },
      history
    });
  } catch (err) {
    console.error('Error fetching stock history:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get low stock alerts
router.get("/alerts/low-stock", async (req, res) => {
  try {
    const lowStockProducts = await StockHistory.getLowStockAlerts();
    
    res.json({
      count: lowStockProducts.length,
      products: lowStockProducts
    });
  } catch (err) {
    console.error('Error fetching low stock alerts:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get stock statistics
router.get("/stats/stock", async (req, res) => {
  try {
    const stats = await Product.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStock: { $sum: "$stock" },
          outOfStock: {
            $sum: { $cond: [{ $eq: ["$stock", 0] }, 1, 0] }
          },
          lowStock: {
            $sum: { $cond: [{ $lte: ["$stock", "$minStockLevel"] }, 1, 0] }
          },
          averageStock: { $avg: "$stock" },
          totalValue: { $sum: { $multiply: ["$stock", "$price"] } }
        }
      }
    ]);

    const result = stats[0] || {
      totalProducts: 0,
      totalStock: 0,
      outOfStock: 0,
      lowStock: 0,
      averageStock: 0,
      totalValue: 0
    };

    res.json(result);
  } catch (err) {
    console.error('Error fetching stock statistics:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
