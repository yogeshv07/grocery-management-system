const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");

// Get all reviews for a product
router.get("/:productId", reviewController.getReviewsByProduct);

// Create a new review
router.post("/", reviewController.createReview);

// Get average rating for a product
router.get("/:productId/average", reviewController.getAverageRating);

// Delete a review
router.delete("/:reviewId", reviewController.deleteReview);

module.exports = router;
