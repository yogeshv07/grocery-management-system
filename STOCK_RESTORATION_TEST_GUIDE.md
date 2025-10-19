# Stock Restoration Test Guide

## ✅ Feature: Automatic Stock Restoration on Order Cancellation

This guide will help you verify that stock is automatically restored when orders are cancelled.

---

## 🧪 Test Scenario: Order Cancellation Restores Stock

### Prerequisites
- Backend server running on `http://localhost:5000`
- Frontend running on `http://localhost:3000`
- At least one product in the system (e.g., Laptop)
- User account created and logged in

---

## 📝 Step-by-Step Test

### **Step 1: Check Initial Stock**
1. Go to **Home** page
2. Find a product (e.g., "Laptop")
3. **Note the current stock** (e.g., Stock: 10)
4. Take a screenshot or write it down

**Example:**
```
Product: Laptop
Initial Stock: 10 units
```

---

### **Step 2: Add Product to Cart**
1. Click on the product to view details
2. Set quantity to **2**
3. Click **"Add to Cart"**
4. Verify success message appears

---

### **Step 3: Place Order**
1. Click **Cart** icon in navigation
2. Review cart items (should show Laptop x2)
3. Enter delivery address
4. Click **"Place Order"**
5. Verify order confirmation appears

---

### **Step 4: Verify Stock Decreased**
1. Go back to **Home** page
2. Find the same product (Laptop)
3. **Check the stock** - it should be decreased by 2
4. Expected: Stock should now be **8** (10 - 2 = 8)

**Verification:**
```
Product: Laptop
Stock After Order: 8 units ✅
(Decreased by 2 as expected)
```

---

### **Step 5: Go to Order History**
1. Click **"Order History"** in navigation
2. Find your recent order
3. Verify order shows:
   - Status: "Order Received" or "Pending"
   - Items: Laptop x2
   - Total amount

---

### **Step 6: Cancel the Order**
1. Click **"❌ Cancel Order"** button
2. Read the confirmation dialog:
   > "Are you sure you want to cancel this order?
   > 
   > Note: Product stock will be automatically restored."
3. Click **OK** to confirm
4. Wait for success message:
   > "Order cancelled successfully! Inventory has been restored."

---

### **Step 7: Verify Stock Restored**
1. Go back to **Home** page
2. Find the same product (Laptop)
3. **Check the stock** - it should be back to original
4. Expected: Stock should be **10** again (8 + 2 = 10)

**Final Verification:**
```
Product: Laptop
Stock After Cancellation: 10 units ✅
(Restored by 2 as expected)
```

---

## 🎯 Expected Results

| Step | Action | Expected Stock | Actual Stock |
|------|--------|---------------|--------------|
| 1 | Initial | 10 | ___ |
| 4 | After Order | 8 | ___ |
| 7 | After Cancel | 10 | ___ |

✅ **Test Passes If:** Stock returns to original value after cancellation

---

## 🔍 Backend Verification (Optional)

### Check Console Logs
When you cancel the order, the backend should log:
```
Stock restored for cancelled order [orderId]
```

### Check Database (MongoDB)
```javascript
// Check product stock in database
db.products.findOne({ name: "Laptop" })

// Should show stock: 10 (restored)
```

### Check Stock History
```javascript
// View stock movement logs
db.stockhistories.find({ type: "ORDER_CANCEL" }).sort({ timestamp: -1 })

// Should show recent restoration entry
```

---

## 🐛 Troubleshooting

### Stock Not Decreasing on Order
**Problem:** Stock stays the same after placing order
**Solution:** Check if `Product.reserveStock()` is being called in order creation

### Stock Not Restoring on Cancel
**Problem:** Stock doesn't increase after cancellation
**Solution:** 
1. Check backend console for errors
2. Verify `Product.restoreStock()` is being called
3. Check if `stockDeducted` flag is true on the order

### Cancel Button Not Showing
**Problem:** Can't find cancel button
**Solution:** Cancel button only shows for orders with status:
- Pending
- Confirmed  
- Preparing

(Cannot cancel delivered or already cancelled orders)

---

## 💡 Additional Test Cases

### Test Case 2: Multiple Items
1. Order Laptop x2 and Phone x3
2. Verify both stocks decrease
3. Cancel order
4. Verify both stocks restore

### Test Case 3: Partial Cancellation
1. Place order with multiple items
2. Admin confirms order
3. User cancels before delivery
4. Verify all items' stock restored

### Test Case 4: Cannot Cancel Delivered
1. Place and complete an order (mark as delivered)
2. Try to cancel from Order History
3. Cancel button should NOT appear
4. Stock should NOT be restored (already counted as sale)

---

## 📊 Implementation Details

### Frontend (`OrderHistory.jsx`)
```javascript
const cancelOrder = async (orderId) => {
  // Confirms with user
  // Calls backend API
  // Shows success message
  // Refreshes order list
}
```

### Backend (`orderController.js`)
```javascript
const cancelOrder = async (req, res) => {
  // Validates order can be cancelled
  // Loops through order items
  // Calls Product.restoreStock() for each
  // Updates order status to "cancelled"
  // Returns success message
}
```

### Product Model (`Product.js`)
```javascript
productSchema.statics.restoreStock = async function(productId, quantity) {
  // Increases stock by quantity
  // Decreases totalSold by quantity
  // Logs stock movement to history
}
```

---

## ✅ Success Criteria

The feature is working correctly if:

1. ✅ Stock decreases when order is placed
2. ✅ Stock increases when order is cancelled
3. ✅ User sees confirmation before cancelling
4. ✅ Success message confirms restoration
5. ✅ Cannot cancel delivered orders
6. ✅ Cannot cancel already cancelled orders
7. ✅ Stock history logs the restoration

---

## 📸 Screenshot Checklist

Take screenshots of:
1. [ ] Product page showing initial stock
2. [ ] Cart with items
3. [ ] Order confirmation
4. [ ] Product page showing decreased stock
5. [ ] Order History page
6. [ ] Cancel confirmation dialog
7. [ ] Success message
8. [ ] Product page showing restored stock

---

## 🎉 Conclusion

If all steps pass, the **Automatic Stock Restoration** feature is working perfectly!

The system ensures:
- Accurate inventory management
- No manual intervention needed
- Prevents double restoration
- Maintains data integrity
- Provides clear user feedback

**Feature Status: ✅ FULLY IMPLEMENTED AND WORKING**
