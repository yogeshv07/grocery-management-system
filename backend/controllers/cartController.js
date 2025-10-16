const Cart = require("../models/Cart");
const Product = require("../models/Product");
const mongoose = require("mongoose");

// Helper function to validate ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Get customer's cart
const getCart = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    if (!isValidObjectId(customerId)) {
      return res.status(400).json({ error: "Invalid customer ID format" });
    }
    const cart = await Cart.findOne({ customer: customerId })
      .populate('items.product', 'name description price image stock');

    if (!cart) {
      return res.json({ items: [], total: 0 });
    }

    // Filter out items with null products (deleted products)
    const validItems = cart.items.filter(item => item.product !== null);
    
    // Update cart if we removed any null products
    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    // Calculate total (handle null products)
    const total = validItems.reduce((sum, item) => {
      if (item.product && typeof item.product.price === 'number') {
        return sum + (item.product.price * item.quantity);
      }
      return sum;
    }, 0);

    res.json({ items: validItems, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add item to cart
const addToCart = async (req, res) => {
  try {
    const { customerId, productId, quantity = 1 } = req.body;

    // Validate input
    if (!customerId || !productId) {
      return res.status(400).json({ error: "Customer ID and Product ID are required" });
    }
    
    if (!isValidObjectId(customerId) || !isValidObjectId(productId)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ error: "Quantity must be a positive integer" });
    }

    // Find or create cart
    let cart = await Cart.findOne({ customer: customerId });
    if (!cart) {
      cart = await Cart.create({ customer: customerId, items: [] });
    }

    // Check if item already exists in cart
    const existingItem = cart.items.find(item => 
      item.product.toString() === productId
    );

    // Determine the new desired quantity
    const currentQtyInCart = existingItem ? existingItem.quantity : 0;
    const desiredQty = currentQtyInCart + quantity;

    // Use Product model's stock availability check
    try {
      await Product.checkStockAvailability(productId, desiredQty);
    } catch (stockError) {
      return res.status(400).json({ error: stockError.message });
    }

    // Update cart
    if (existingItem) {
      existingItem.quantity = desiredQty;
    } else {
      cart.items.push({ product: productId, quantity: desiredQty });
    }

    await cart.save();

    // Return updated cart with comprehensive product info
    const updatedCart = await Cart.findById(cart._id)
      .populate('items.product', 'name description price image stock stockStatus isAvailable minStockLevel');

    // Calculate total with null safety
    const total = updatedCart.items.reduce((sum, item) => {
      if (item.product && typeof item.product.price === 'number') {
        return sum + (item.product.price * item.quantity);
      }
      return sum;
    }, 0);

    res.json({ 
      message: "Item added to cart successfully", 
      items: updatedCart.items, 
      total,
      cartItemCount: updatedCart.items.length
    });
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const { customerId, productId, quantity } = req.body;

    // Validate input
    if (!customerId || !productId) {
      return res.status(400).json({ error: "Customer ID and Product ID are required" });
    }
    
    if (!isValidObjectId(customerId) || !isValidObjectId(productId)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
      return res.status(400).json({ error: "Quantity must be a non-negative integer" });
    }

    const cart = await Cart.findOne({ customer: customerId });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    const item = cart.items.find(item => 
      item.product.toString() === productId
    );

    if (!item) {
      return res.status(404).json({ error: "Item not found in cart" });
    }

    if (quantity === 0) {
      // Remove item from cart
      cart.items = cart.items.filter(item => 
        item.product.toString() !== productId
      );
    } else {
      // Validate quantity against product stock using enhanced model method
      try {
        await Product.checkStockAvailability(productId, quantity);
        item.quantity = quantity;
      } catch (stockError) {
        return res.status(400).json({ error: stockError.message });
      }
    }

    await cart.save();

    // Return updated cart with comprehensive product info
    const updatedCart = await Cart.findById(cart._id)
      .populate('items.product', 'name description price image stock stockStatus isAvailable minStockLevel');

    const total = updatedCart.items.reduce((sum, item) => {
      if (item.product && typeof item.product.price === 'number') {
        return sum + (item.product.price * item.quantity);
      }
      return sum;
    }, 0);

    res.json({ 
      message: quantity === 0 ? "Item removed from cart" : "Cart updated successfully", 
      items: updatedCart.items, 
      total,
      cartItemCount: updatedCart.items.length
    });
  } catch (err) {
    console.error('Update cart error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const { customerId, productId } = req.body;
    
    if (!customerId || !productId) {
      return res.status(400).json({ error: "Customer ID and Product ID are required" });
    }
    
    if (!isValidObjectId(customerId) || !isValidObjectId(productId)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const cart = await Cart.findOne({ customer: customerId });
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    cart.items = cart.items.filter(item => 
      item.product.toString() !== productId
    );

    await cart.save();

    // Return updated cart
    const updatedCart = await Cart.findById(cart._id)
      .populate('items.product', 'name description price image stock');

    const total = updatedCart.items.reduce((sum, item) => {
      if (item.product && typeof item.product.price === 'number') {
        return sum + (item.product.price * item.quantity);
      }
      return sum;
    }, 0);

    res.json({ 
      message: "Item removed from cart", 
      items: updatedCart.items, 
      total 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Clear cart
const clearCart = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    if (!isValidObjectId(customerId)) {
      return res.status(400).json({ error: "Invalid customer ID format" });
    }
    await Cart.findOneAndDelete({ customer: customerId });
    res.json({ message: "Cart cleared" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
