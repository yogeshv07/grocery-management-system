const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");

// Get sales analytics
router.get("/sales", analyticsController.getSalesAnalytics);

module.exports = router;
