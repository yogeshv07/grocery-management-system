const Review = require("../models/Review");
const Product = require("../models/Product");

// Get all reviews for a specific product
exports.getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const reviews = await Review.find({ productId })
      .sort({ createdAt: -1 })
      .lean();
    
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};

// Create a new review
exports.createReview = async (req, res) => {
  try {
    const { productId, customerId, customerName, rating, comment } = req.body;
    
    // Validate required fields
    if (!productId || !customerId || !customerName || !rating || !comment) {
      return res.status(400).json({ error: "All fields are required" });
    }
    
    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    // Create review
    const review = new Review({
      productId,
      customerId,
      customerName,
      rating,
      comment,
    });
    
    await review.save();
    
    res.status(201).json({ message: "Review created successfully", review });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ error: "Failed to create review" });
  }
};

// Get average rating for a product
exports.getAverageRating = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const result = await Review.aggregate([
      { $match: { productId: mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);
    
    if (result.length === 0) {
      return res.json({ averageRating: 0, totalReviews: 0 });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error("Error calculating average rating:", error);
    res.status(500).json({ error: "Failed to calculate average rating" });
  }
};

// Delete a review (optional - for admin or user)
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    const review = await Review.findByIdAndDelete(reviewId);
    
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }
    
    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ error: "Failed to delete review" });
  }
};
