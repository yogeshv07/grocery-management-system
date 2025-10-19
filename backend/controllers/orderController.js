const mongoose = require("mongoose");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

// Helper function to validate ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// =====================
// Create Order
// =====================
const createOrder = async (req, res) => {
  try {
    const { customerId, deliveryAddress, notes } = req.body;

    // Validate input
    if (!customerId || !deliveryAddress) {
      return res.status(400).json({ error: "Customer ID and delivery address are required" });
    }

    if (!isValidObjectId(customerId)) {
      return res.status(400).json({ error: "Invalid customer ID format" });
    }

    // Get customer's cart
    const cart = await Cart.findOne({ customer: customerId })
      .populate("items.product", "name description price stock isActive stockStatus");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Filter active products
    const validCartItems = cart.items.filter(
      (item) => item.product && item.product.isActive
    );

    if (validCartItems.length === 0) {
      return res.status(400).json({ error: "No valid items in cart" });
    }

    // Validate stock & prepare order items
    let totalAmount = 0;
    const orderItems = [];
    const stockReservations = [];

    try {
      for (const cartItem of validCartItems) {
        const productId = cartItem.product._id;
        const qty = cartItem.quantity;
        const product = cartItem.product;

        await Product.reserveStock(productId, qty, null);
        stockReservations.push({ productId, quantity: qty });

        const productPrice = typeof product.price === "number" ? product.price : 0;
        totalAmount += productPrice * qty;

        orderItems.push({
          product: productId,
          quantity: qty,
          price: productPrice,
        });
      }

      // Create order
      const order = await Order.create({
        customer: customerId,
        items: orderItems,
        totalAmount,
        deliveryAddress: deliveryAddress.trim(),
        notes: notes ? notes.trim() : "",
        stockDeducted: true,
      });

      // Clear cart
      await Cart.findOneAndDelete({ customer: customerId });

      const populatedOrder = await Order.findById(order._id)
        .populate("customer", "name email phone")
        .populate("items.product", "name description image price")
        .populate("deliveryPerson", "name phone");

      res.status(201).json({
        message: "Order created successfully and stock updated",
        order: populatedOrder,
        orderNumber: order._id.toString().slice(-8).toUpperCase(),
      });
    } catch (stockError) {
      for (const reservation of stockReservations) {
        try {
          await Product.restoreStock(reservation.productId, reservation.quantity);
        } catch (rollbackError) {
          console.error("Stock rollback error:", rollbackError);
        }
      }
      throw stockError;
    }
  } catch (err) {
    console.error("Create order error:", err);

    if (
      typeof err.message === "string" &&
      (err.message.includes("stock") ||
        err.message.includes("Product not found") ||
        err.message.includes("not active"))
    ) {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: "Failed to create order. Please try again." });
  }
};

// =====================
// Get Customer Orders
// =====================
const getCustomerOrders = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!isValidObjectId(customerId)) {
      return res.status(400).json({ error: "Invalid customer ID format" });
    }

    const orders = await Order.find({ customer: customerId })
      .populate("items.product", "name description image")
      .populate("deliveryPerson", "name phone")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =====================
// Get All Orders (Admin)
// =====================
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customer", "name email phone")
      .populate("items.product", "name description image")
      .populate("deliveryPerson", "name phone")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =====================
// Update Order Status
// =====================
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, deliveryPerson, estimatedDelivery } = req.body;

    if (!isValidObjectId(orderId)) {
      return res.status(400).json({ error: "Invalid order ID format" });
    }

    if (deliveryPerson && !isValidObjectId(deliveryPerson)) {
      return res.status(400).json({ error: "Invalid delivery person ID format" });
    }

    if (!orderId || !status) {
      return res.status(400).json({ error: "Order ID and status are required" });
    }

    const validStatuses = [
      "pending",
      "confirmed",
      "preparing",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid order status" });
    }

    const currentOrder = await Order.findById(orderId);
    if (!currentOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Restore stock on cancellation
    if (status === "cancelled" && currentOrder.status !== "cancelled" && currentOrder.stockDeducted) {
      for (const item of currentOrder.items) {
        await Product.restoreStock(item.product, item.quantity);
      }
      console.log(`Stock restored for cancelled order ${orderId}`);
    }

    const updateData = { status };
    if (deliveryPerson) updateData.deliveryPerson = deliveryPerson;
    if (estimatedDelivery) updateData.estimatedDelivery = new Date(estimatedDelivery);

    const updatedOrder = await Order.findByIdAndUpdate(orderId, updateData, { new: true })
      .populate("customer", "name email phone")
      .populate("items.product", "name description image price")
      .populate("deliveryPerson", "name phone");

    let message = "Order status updated successfully";
    if (status === "cancelled") message = "Order cancelled and stock restored";
    else if (status === "delivered") message = "Order marked as delivered";
    else if (status === "confirmed") message = "Order confirmed";

    res.json({
      message,
      order: updatedOrder,
      statusChanged: currentOrder.status !== status,
    });
  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({ error: err.message });
  }
};

// =====================
// Cancel Order (New)
// =====================
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!isValidObjectId(orderId)) {
      return res.status(400).json({ error: "Invalid order ID format" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (["delivered", "cancelled"].includes(order.status)) {
      return res.status(400).json({ error: "Cannot cancel this order" });
    }

    if (order.stockDeducted) {
      for (const item of order.items) {
        await Product.restoreStock(item.product, item.quantity);
      }
      order.stockDeducted = false;
    }

    order.status = "cancelled";
    await order.save();

    const updatedOrder = await Order.findById(orderId)
      .populate("customer", "name email phone")
      .populate("items.product", "name description image price")
      .populate("deliveryPerson", "name phone");

    res.json({
      message: "Order cancelled successfully and stock restored",
      order: updatedOrder,
    });
  } catch (err) {
    console.error("Cancel order error:", err);
    res.status(500).json({ error: "Failed to cancel order" });
  }
};

// =====================
// Get Delivery Person Orders
// =====================
const getDeliveryOrders = async (req, res) => {
  try {
    const { deliveryPersonId } = req.params;

    if (!isValidObjectId(deliveryPersonId)) {
      return res.status(400).json({ error: "Invalid delivery person ID format" });
    }

    const orders = await Order.find({ deliveryPerson: deliveryPersonId })
      .populate("customer", "name email phone address")
      .populate("items.product", "name description image")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =====================
// Exports
// =====================
module.exports = {
  createOrder,
  getCustomerOrders,
  getAllOrders,
  updateOrderStatus,
  getDeliveryOrders,
  cancelOrder, // ✅ new export
};
