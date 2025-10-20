const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

dotenv.config(); // load .env first

const userRoutes = require("./routes/userRoutes");
const User = require("./models/User");

const app = express();
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect MongoDB
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/managementsystem";

mongoose.connect(MONGO_URI)
.then(async () => {
    console.log("MongoDB connected");

})
.catch(err => console.log("MongoDB connection error:", err));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const Product = require("./models/Product");

(async () => {
  const count = await Product.countDocuments();
  if (count === 0) {
    await Product.insertMany([
      { name: "Laptop", description: "Gaming laptop", price: 900, stock: 10, isActive: true },
      { name: "Phone", description: "Smartphone", price: 500, stock: 15, isActive: true },
      { name: "Headphones", description: "Wireless", price: 150, stock: 20, isActive: true },
    ]);
    console.log("Sample products added");
  }
  
  // Migration: Ensure all existing products have isActive field
  const result = await Product.updateMany(
    { isActive: { $exists: false } },
    { $set: { isActive: true } }
  );
  
  if (result.modifiedCount > 0) {
    console.log(`Updated ${result.modifiedCount} products with isActive field`);
  }
})();


app.use("/api/invoice", require("./routes/invoiceRoutes"));
