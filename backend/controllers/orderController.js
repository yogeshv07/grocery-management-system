const mongoose = require("mongoose");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

// Helper function to validate ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Create order from cart with enhanced stock management
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

    // Get customer's cart with full product details
    const cart = await Cart.findOne({ customer: customerId })
      .populate('items.product', 'name description price stock isActive stockStatus');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Filter out items with null/inactive products
    const validCartItems = cart.items.filter(item => 
      item.product && item.product.isActive
    );

    if (validCartItems.length === 0) {
      return res.status(400).json({ error: "No valid items in cart" });
    }

    // Validate stock and prepare order items with enhanced error handling
    let totalAmount = 0;
    const orderItems = [];
    const stockReservations = []; // Track reservations for rollback

    try {
      for (const cartItem of validCartItems) {
        const productId = cartItem.product._id;
        const qty = cartItem.quantity;
        const product = cartItem.product;

        // Reserve stock directly (it includes validation)
        await Product.reserveStock(productId, qty, null);
        stockReservations.push({ productId, quantity: qty });

        const productPrice = typeof product.price === 'number' ? product.price : 0;
        const itemTotal = productPrice * qty;
        totalAmount += itemTotal;
        orderItems.push({ 
          product: productId, 
          quantity: qty, 
          price: productPrice 
        });
      }

      // Create order with stock already decremented
      const order = await Order.create({
        customer: customerId,
        items: orderItems,
        totalAmount,
        deliveryAddress: deliveryAddress.trim(),
        notes: notes ? notes.trim() : "",
        stockDeducted: true
      });

      // Clear cart after successful order creation
      await Cart.findOneAndDelete({ customer: customerId });

      // Populate the order with comprehensive details
      const populatedOrder = await Order.findById(order._id)
        .populate('customer', 'name email phone')
        .populate('items.product', 'name description image price')
        .populate('deliveryPerson', 'name phone');

      res.status(201).json({
        message: "Order created successfully and stock updated",
        order: populatedOrder,
        orderNumber: order._id.toString().slice(-8).toUpperCase()
      });

    } catch (stockError) {
      // Rollback stock reservations on failure
      for (const reservation of stockReservations) {
        try {
          await Product.restoreStock(reservation.productId, reservation.quantity);
        } catch (rollbackError) {
          console.error('Stock rollback error:', rollbackError);
        }
      }
      throw stockError;
    }

  } catch (err) {
    console.error('Create order error:', err);
    
    // Handle specific error types
    if (typeof err.message === 'string') {
      if (err.message.includes('stock') || 
          err.message.includes('Product not found') || 
          err.message.includes('not active')) {
        return res.status(400).json({ error: err.message });
      }
    }
    
    res.status(500).json({ error: "Failed to create order. Please try again." });
  }
};

// Get orders for customer
const getCustomerOrders = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    if (!isValidObjectId(customerId)) {
      return res.status(400).json({ error: "Invalid customer ID format" });
    }
    const orders = await Order.find({ customer: customerId })
      .populate('items.product', 'name description image')
      .populate('deliveryPerson', 'name phone')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all orders (admin)
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('customer', 'name email phone')
      .populate('items.product', 'name description image')
      .populate('deliveryPerson', 'name phone')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update order status with enhanced stock management
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, deliveryPerson, estimatedDelivery } = req.body;

    // Validate input
    if (!isValidObjectId(orderId)) {
      return res.status(400).json({ error: "Invalid order ID format" });
    }
    
    if (deliveryPerson && !isValidObjectId(deliveryPerson)) {
      return res.status(400).json({ error: "Invalid delivery person ID format" });
    }
    if (!orderId || !status) {
      return res.status(400).json({ error: "Order ID and status are required" });
    }

    const validStatuses = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid order status" });
    }

    // Get current order
    const currentOrder = await Order.findById(orderId);
    if (!currentOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Handle order cancellation - restore stock
    if (status === 'cancelled' && currentOrder.status !== 'cancelled' && currentOrder.stockDeducted) {
      try {
        // Restore stock for all items in the order
        for (const item of currentOrder.items) {
          await Product.restoreStock(item.product, item.quantity);
        }
        console.log(`Stock restored for cancelled order ${orderId}`);
      } catch (stockError) {
        console.error('Stock restoration error:', stockError);
        return res.status(500).json({ 
          error: "Failed to restore stock. Please contact administrator." 
        });
      }
    }

    // Prepare update data
    const updateData = { status };
    if (deliveryPerson) updateData.deliveryPerson = deliveryPerson;
    if (estimatedDelivery) updateData.estimatedDelivery = new Date(estimatedDelivery);

    // Update order
    const updatedOrder = await Order.findByIdAndUpdate(orderId, updateData, { new: true })
      .populate('customer', 'name email phone')
      .populate('items.product', 'name description image price')
      .populate('deliveryPerson', 'name phone');

    // Determine appropriate success message
    let message = 'Order status updated successfully';
    if (status === 'cancelled') {
      message = 'Order cancelled and stock restored';
    } else if (status === 'delivered') {
      message = 'Order marked as delivered';
    } else if (status === 'confirmed') {
      message = 'Order confirmed';
    }

    res.json({ 
      message, 
      order: updatedOrder,
      statusChanged: currentOrder.status !== status
    });
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get orders for delivery person
const getDeliveryOrders = async (req, res) => {
  try {
    const { deliveryPersonId } = req.params;
    
    if (!isValidObjectId(deliveryPersonId)) {
      return res.status(400).json({ error: "Invalid delivery person ID format" });
    }
    const orders = await Order.find({ 
      deliveryPerson: deliveryPersonId
    })
      .populate('customer', 'name email phone address')
      .populate('items.product', 'name description image')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createOrder,
  getCustomerOrders,
  getAllOrders,
  updateOrderStatus,
  getDeliveryOrders
};
