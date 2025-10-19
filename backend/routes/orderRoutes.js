const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const { 
  createOrder, 
  getCustomerOrders, 
  getAllOrders, 
  updateOrderStatus, 
  getDeliveryOrders,
  cancelOrder
} = require("../controllers/orderController");

// Helper function to validate ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const router = express.Router();

// Create order from cart
router.post("/", createOrder);

// Get all orders (admin) - MUST come before /:orderId route
router.get("/all", getAllOrders);

// Get customer's orders
router.get("/customer/:customerId", getCustomerOrders);

// Get single order - MUST come after specific routes
router.get("/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!isValidObjectId(orderId)) {
      return res.status(400).json({ error: "Invalid order ID format" });
    }
    
    const order = await Order.findById(orderId)
      .populate('customer', 'name email phone')
      .populate('items.product', 'name description image')
      .populate('deliveryPerson', 'name phone');
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update order status
router.put("/:orderId/status", updateOrderStatus);

// Get delivery person's orders - MUST come before /:orderId route
router.get("/delivery/:deliveryPersonId", getDeliveryOrders);

// ✅ Cancel order route - Restores inventory automatically
router.put("/:orderId/cancel", cancelOrder);

module.exports = router;
