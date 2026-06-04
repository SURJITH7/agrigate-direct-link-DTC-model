import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

const router = express.Router();


router.get("/recent", async (req, res) => {
  try {
    const farmerId = req.user._id;

    const recentNewOrders = await Order.find({ farmerId })
      .sort({ createdAt: -1 })
      .limit(5);

    const recentUpdatedOrders = await Order.find({
      farmerId,
      status: { $in: ["shipped", "delivered"] },
    })
      .sort({ updatedAt: -1 })
      .limit(5);

    const recentProducts = await Product.find({
      farmerId,
      status: { $in: ["approved", "rejected"] },
    })
      .sort({ updatedAt: -1 })
      .limit(5);

    const activities = [];

    recentNewOrders.forEach((order) => {
      const productNames = order.products.map((p) => p.name).join(", ");
      activities.push({
        _id: `new-order-${order._id}`,
        type: "new_order",
        message: `New order for ${productNames}.`,
        date: order.createdAt,
        link: "/orders",
      });
    });

    recentUpdatedOrders.forEach((order) => {
      if (order.updatedAt.getTime() - order.createdAt.getTime() > 1000) {
        let message;
        if (order.status === "delivered") {
          message = `Payment of ₹${order.totalEarnings.toFixed(
            2
          )} received for order.`;
        } else {
          message = `Order for ${order.products
            .map((p) => p.name)
            .join(", ")} was ${order.status}.`;
        }
        activities.push({
          _id: `update-order-${order._id}-${order.status}`,
          type: "order_update",
          message,
          date: order.updatedAt,
          link: "/orders",
        });
      }
    });

    recentProducts.forEach((product) => {
      if (product.updatedAt.getTime() - product.createdAt.getTime() > 1000) {
        activities.push({
          _id: `product-${product._id}-${product.status}`,
          type: "product_update",
          message: `Product "${product.name}" was ${product.status}.`,
          date: product.updatedAt,
          link: "/my-products",
        });
      }
    });

    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    const uniqueActivities = [];
    const seenIds = new Set();
    for (const activity of activities) {
      if (!seenIds.has(activity._id) && uniqueActivities.length < 5) {
        uniqueActivities.push(activity);
        seenIds.add(activity._id);
      }
    }

    res.json(uniqueActivities);
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    res.status(500).json({ error: "Server error while fetching activity" });
  }
});

// @desc    Get dashboard stats for a farmer
// @route   GET /api/activity/stats
// @access  Private (via server.js)
router.get("/stats", async (req, res) => {
  try {
    const farmerId = req.user._id;

    const totalProducts = await Product.countDocuments({ farmerId });
    const ordersReceived = await Order.countDocuments({ farmerId });
    const pendingOrders = await Order.countDocuments({
      farmerId,
      status: "pending",
    });

    const earningsResult = await Order.aggregate([
      { $match: { farmerId: farmerId, status: "delivered" } },
      { $group: { _id: null, total: { $sum: "$totalEarnings" } } },
    ]);

    const totalEarnings =
      earningsResult.length > 0 ? earningsResult[0].total : 0;

    res.json({
      totalProducts,
      ordersReceived,
      earnings: totalEarnings,
      pendingOrders,
    });
  } catch (error) {
    console.error("Error fetching farmer stats:", error);
    res.status(500).json({ error: "Server error while fetching stats" });
  }
});

export default router;
