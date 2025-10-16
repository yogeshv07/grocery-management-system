const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  price: { 
    type: Number, 
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative'],
    validate: {
      validator: function(v) {
        return v >= 0;
      },
      message: 'Price must be a positive number'
    }
  },
  image: String,
  stock: { 
    type: Number, 
    default: 0,
    min: [0, 'Stock cannot be negative'],
    validate: {
      validator: function(v) {
        return Number.isInteger(v) && v >= 0;
      },
      message: 'Stock must be a non-negative integer'
    }
  },
  category: {
    type: String,
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters']
  },
  // Stock management fields
  minStockLevel: {
    type: Number,
    default: 5,
    min: [0, 'Minimum stock level cannot be negative']
  },
  maxStockLevel: {
    type: Number,
    default: 1000,
    min: [1, 'Maximum stock level must be at least 1']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Stock tracking
  totalSold: {
    type: Number,
    default: 0,
    min: [0, 'Total sold cannot be negative']
  },
  lastRestocked: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.stock <= 0) return 'OUT_OF_STOCK';
  if (this.stock <= this.minStockLevel) return 'LOW_STOCK';
  if (this.stock >= this.maxStockLevel) return 'OVERSTOCK';
  return 'IN_STOCK';
});

// Virtual for availability
productSchema.virtual('isAvailable').get(function() {
  return this.isActive && this.stock > 0;
});

// Pre-save middleware for stock validation
productSchema.pre('save', function(next) {
  // Ensure minStockLevel is not greater than maxStockLevel
  if (this.minStockLevel > this.maxStockLevel) {
    next(new Error('Minimum stock level cannot be greater than maximum stock level'));
  }
  
  // Update lastRestocked if stock increased
  if (this.isModified('stock') && this.stock > (this.constructor.findOne({_id: this._id})?.stock || 0)) {
    this.lastRestocked = new Date();
  }
  
  next();
});

// Static method to check stock availability
productSchema.statics.checkStockAvailability = async function(productId, requestedQuantity) {
  const product = await this.findById(productId);
  if (!product) {
    throw new Error('Product not found');
  }
  
  if (!product.isActive) {
    throw new Error('Product is not active');
  }
  
  if (product.stock <= 0) {
    throw new Error(`${product.name} is out of stock`);
  }
  
  if (product.stock < requestedQuantity) {
    throw new Error(`Only ${product.stock} unit(s) of ${product.name} available`);
  }
  
  return true;
};

// Static method to reserve stock
productSchema.statics.reserveStock = async function(productId, quantity, relatedOrder = null) {
  console.log(`Attempting to reserve ${quantity} units of product ${productId}`);
  
  // First, get the current product to check basic availability
  const product = await this.findById(productId);
  if (!product) {
    throw new Error('Product not found');
  }

  console.log(`Product found: ${product.name}, Current stock: ${product.stock}, Active: ${product.isActive}`);
  console.log(`Product document:`, JSON.stringify(product, null, 2));

  if (!product.isActive) {
    throw new Error('Product is not active');
  }

  if (product.stock < quantity) {
    throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${quantity}`);
  }

  const previousStock = product.stock;
  
  console.log(`Performing atomic update: decrementing ${quantity} from ${previousStock}`);
  
  // Perform atomic stock decrement with condition
  const result = await this.updateOne(
    { 
      _id: productId, 
      stock: { $gte: quantity },
      isActive: { $ne: false }  // Allow true or undefined/null (default active)
    },
    { 
      $inc: { stock: -quantity, totalSold: quantity }
    }
  );
  
  console.log(`Update result:`, { 
    acknowledged: result.acknowledged, 
    modifiedCount: result.modifiedCount, 
    matchedCount: result.matchedCount 
  });
  
  // If the atomic update failed, it means stock changed between our check and update
  if (result.modifiedCount === 0) {
    // Get the most current stock data
    const freshProduct = await this.findById(productId);
    const currentStock = freshProduct ? freshProduct.stock : 0;
    
    console.log(`Atomic update failed. Fresh stock check: ${currentStock}, Active: ${freshProduct?.isActive}`);
    
    if (!freshProduct || !freshProduct.isActive) {
      throw new Error('Product is no longer available');
    }
    
    throw new Error(`Stock changed during checkout. ${product.name} now has ${currentStock} available, but ${quantity} was requested. Please try again.`);
  }

  // Log stock movement
  try {
    const StockHistory = this.model('StockHistory');
    await StockHistory.logStockMovement({
      productId: productId,
      type: 'SALE',
      quantity: -quantity,
      previousStock: previousStock,
      newStock: previousStock - quantity,
      reason: 'Stock reserved for order',
      relatedOrder: relatedOrder
    });
  } catch (historyError) {
    console.error('Stock history logging error:', historyError);
  }
  
  return result;
};

// Static method to restore stock (for order cancellations)
productSchema.statics.restoreStock = async function(productId, quantity, relatedOrder = null) {
  const product = await this.findById(productId);
  if (!product) {
    throw new Error('Product not found');
  }

  const previousStock = product.stock;
  
  const result = await this.updateOne(
    { _id: productId },
    { 
      $inc: { stock: quantity, totalSold: -quantity }
    }
  );

  // Log stock movement
  try {
    const StockHistory = this.model('StockHistory');
    await StockHistory.logStockMovement({
      productId: productId,
      type: 'ORDER_CANCEL',
      quantity: quantity,
      previousStock: previousStock,
      newStock: previousStock + quantity,
      reason: 'Stock restored due to order cancellation',
      relatedOrder: relatedOrder
    });
  } catch (historyError) {
    console.error('Stock history logging error:', historyError);
  }
  
  return result;
};

// Index for efficient queries
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ stock: 1 });
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model("Product", productSchema);
