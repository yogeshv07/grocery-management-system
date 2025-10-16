const express = require("express");
const { 
  getCart, 
  addToCart, 
  updateCartItem, 
  removeFromCart, 
  clearCart 
} = require("../controllers/cartController");

const router = express.Router();

// Get customer's cart
router.get("/:customerId", getCart);

// Add item to cart
router.post("/add", addToCart);

// Update cart item quantity
router.put("/update", updateCartItem);

// Remove item from cart
router.delete("/remove", removeFromCart);

// Clear cart
router.delete("/:customerId", clearCart);

module.exports = router;
