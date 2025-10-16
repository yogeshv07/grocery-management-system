const mongoose = require("mongoose");

const stockHistorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  type: {
    type: String,
    enum: [
      'INITIAL_STOCK',     // Initial stock setting
      'RESTOCK',           // Manual stock increase
      'SALE',              // Stock decrease due to sale
      'ORDER_CANCEL',      // Stock increase due to order cancellation
      'ADJUSTMENT',        // Manual stock adjustment
      'EXPIRED',           // Stock decrease due to expiry
      'DAMAGED',           // Stock decrease due to damage
      'RETURNED'           // Stock increase due to return
    ],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    validate: {
      validator: function(v) {
        return Number.isInteger(v) && v !== 0;
      },
      message: 'Quantity must be a non-zero integer'
    }
  },
  previousStock: {
    type: Number,
    required: true,
    min: 0
  },
  newStock: {
    type: Number,
    required: true,
    min: 0
  },
  reason: {
    type: String,
    maxlength: [200, 'Reason cannot exceed 200 characters'],
    trim: true
  },
  // Reference to related documents
  relatedOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order"
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  // Additional metadata
  batchNumber: String,
  expiryDate: Date,
  cost: {
    type: Number,
    min: 0
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for stock change direction
stockHistorySchema.virtual('changeType').get(function() {
  return this.quantity > 0 ? 'INCREASE' : 'DECREASE';
});

// Virtual for absolute quantity
stockHistorySchema.virtual('absoluteQuantity').get(function() {
  return Math.abs(this.quantity);
});

// Static method to log stock movement
stockHistorySchema.statics.logStockMovement = async function(data) {
  const {
    productId,
    type,
    quantity,
    previousStock,
    newStock,
    reason,
    relatedOrder,
    relatedUser,
    batchNumber,
    expiryDate,
    cost
  } = data;

  try {
    const stockHistory = await this.create({
      product: productId,
      type,
      quantity,
      previousStock,
      newStock,
      reason,
      relatedOrder,
      relatedUser,
      batchNumber,
      expiryDate,
      cost
    });

    return stockHistory;
  } catch (error) {
    console.error('Stock history logging error:', error);
    throw error;
  }
};

// Static method to get stock history for a product
stockHistorySchema.statics.getProductHistory = async function(productId, limit = 50) {
  return await this.find({ product: productId })
    .populate('relatedOrder', 'status createdAt')
    .populate('relatedUser', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get low stock alerts
stockHistorySchema.statics.getLowStockAlerts = async function() {
  const Product = mongoose.model('Product');
  
  const lowStockProducts = await Product.find({
    $expr: { $lte: ['$stock', '$minStockLevel'] },
    isActive: true
  }).select('name stock minStockLevel category');

  return lowStockProducts;
};

// Index for efficient queries
stockHistorySchema.index({ product: 1, createdAt: -1 });
stockHistorySchema.index({ type: 1, createdAt: -1 });
stockHistorySchema.index({ relatedOrder: 1 });

module.exports = mongoose.model("StockHistory", stockHistorySchema);
