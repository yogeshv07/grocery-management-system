const Order = require("../models/Order");
const Product = require("../models/Product");

// Get sales analytics
exports.getSalesAnalytics = async (req, res) => {
  try {
    // Get total sales by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const salesByDate = await Order.aggregate([
      {
        $match: {
          status: "delivered", // ONLY delivered orders count toward revenue
          // Excludes: pending, confirmed, preparing, out_for_delivery, cancelled
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          totalSales: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Get top selling products (only from delivered orders)
    const topProducts = await Order.aggregate([
      {
        $match: {
          status: "delivered", // ONLY delivered orders
          // Out for delivery does NOT count - must be completed
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          productName: { $ifNull: ["$productInfo.name", "Unknown Product"] },
          productImage: "$productInfo.image",
          totalQuantity: 1,
          totalRevenue: 1,
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
    ]);

    // Get overall statistics (only delivered orders)
    const totalStats = await Order.aggregate([
      {
        $match: {
          status: "delivered", // ONLY delivered - revenue counted on completion
          // Out for delivery, preparing, etc. are NOT included
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    const stats = totalStats.length > 0 ? totalStats[0] : { totalRevenue: 0, totalOrders: 0 };

    // Get order status breakdown
    const statusBreakdown = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      salesByDate,
      topProducts,
      totalRevenue: stats.totalRevenue,
      totalOrders: stats.totalOrders,
      statusBreakdown,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics data" });
  }
};
