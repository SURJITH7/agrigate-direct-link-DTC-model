import express from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";
import { protect, isConsumer, isFarmer } from "../middleware/authMiddleware.js";
import { io } from "../server.js";
const router = express.Router();

// GET: farmers retrieve their orders
router.get("/", protect, isFarmer, async (req, res) => {
  try {
    const orders = await Order.find({ farmerId: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (err) {
    console.error("Failed to fetch orders:", err.message);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

// GET: consumers retrieve their orders
router.get("/my-orders", protect, isConsumer, async (req, res) => {
  try {
    const orders = await Order.find({ consumerId: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (err) {
    console.error("Failed to fetch consumer orders:", err.message);
    res.status(500).json({ message: "Failed to fetch consumer orders" });
  }
});

// PUT: Farmer updates an order's status
router.put("/:id/status", protect, isFarmer, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Ensure the farmer updating the order is the one assigned to it
    if (order.farmerId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this order" });
    }

    // Validate status against the schema enum
    if (!Order.schema.path("status").enumValues.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    order.status = status;
    await order.save();

    res.json(order);
  } catch (err) {
    console.error("Failed to update order status:", err.message);
    res.status(500).json({ message: "Failed to update order status" });
  }
});

// PUT: Consumer marks an order as delivered
router.put("/:id/mark-delivered", protect, isConsumer, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Ensure the consumer updating the order is the one who placed it
    if (order.consumerId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this order" });
    }

    // A consumer can only mark a 'shipped' order as 'delivered'
    if (order.status !== "shipped") {
      return res.status(400).json({
        message: `Order with status '${order.status}' cannot be marked as delivered.`,
      });
    }

    order.status = "delivered";
    await order.save();

    res.json(order);
  } catch (err) {
    console.error("Failed to mark order as delivered:", err.message);
    res.status(500).json({ message: "Failed to update order status" });
  }
});

// PUT: Consumer cancels an order
router.put("/:id/cancel", protect, isConsumer, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Ensure the consumer updating the order is the one who placed it
    if (order.consumerId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to cancel this order" });
    }

    // A consumer can only cancel a 'pending' order
    if (order.status !== "pending") {
      return res.status(400).json({
        message: `Order with status '${order.status}' cannot be cancelled.`,
      });
    }

    order.status = "cancelled";
    await order.save();

    res.json(order);
  } catch (err) {
    console.error("Failed to cancel order:", err.message);
    res.status(500).json({ message: "Failed to update order status" });
  }
});

// POST: consumers create orders. Payload should include items with farmerId per item.
router.post("/", protect, isConsumer, async (req, res) => {
  try {
    const { items, amount, transactionId, shippingDetails } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: "No items provided" });

    // 1. Validate stock and prepare for updates
    for (const item of items) {
      const product = await Product.findById(item._id);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product not found: ${item.name}` });
      }
      if (product.quantity < item.quantity) {
        return res.status(400).json({
          message: `Not enough stock for ${item.name}. Only ${product.quantity} left.`,
        });
      }
    }

    // Group items by farmerId
    const byFarmer = {};
    for (const it of items) {
      let fid = null;
      // farmerId may be provided as a string or object
      if (it.farmerId) {
        if (typeof it.farmerId === "object" && it.farmerId !== null) {
          fid =
            it.farmerId._id ||
            it.farmerId.id ||
            (it.farmerId.toString && it.farmerId.toString());
        } else {
          fid = it.farmerId;
        }
      } else if (it.farmer) {
        if (typeof it.farmer === "object" && it.farmer !== null) {
          fid =
            it.farmer._id ||
            it.farmer.id ||
            (it.farmer.toString && it.farmer.toString());
        } else {
          fid = it.farmer;
        }
      }

      // If still missing, try product lookup
      if (!fid && it._id) {
        try {
          const prod = await Product.findById(it._id).select("farmerId");
          if (prod && prod.farmerId) fid = prod.farmerId.toString();
        } catch (e) {
          console.error("Product lookup failed for item", it._id, e.message);
        }
      }

      if (!fid) {
        console.warn("Skipping item with no farmerId", it);
        continue;
      }

      const key = typeof fid === "string" ? fid : fid.toString();
      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(key)) {
        console.warn("Invalid farmerId for item, skipping:", key, it);
        continue;
      }
      byFarmer[key] = byFarmer[key] || [];
      byFarmer[key].push(it);
    }

    const created = [];
    for (const [farmerId, farmerItems] of Object.entries(byFarmer)) {
      const totalForFarmer = farmerItems.reduce(
        (s, p) => s + (p.price || 0) * (p.quantity || 1),
        0
      );
      const order = new Order({
        products: farmerItems.map((p) => ({
          name: p.name,
          quantity: p.quantity,
          price: p.price,
        })),
        status: "pending",
        customerName:
          shippingDetails?.name ||
          (req.user && req.user.fullName) ||
          "Customer",
        orderDate: new Date(),
        shippingAddress: shippingDetails?.address,
        totalEarnings: totalForFarmer,
        consumerId: req.user._id,
        // Store farmerId as a string and let Mongoose cast to ObjectId
        farmerId: farmerId,
      });
      await order.save();
      created.push(order);

      // 2. Decrement stock for each product in the order
      for (const item of farmerItems) {
        await Product.findByIdAndUpdate(item._id, {
          $inc: { quantity: -item.quantity },
        });
      }
    }

    // Emit socket events to notify farmers of new orders
    for (const order of created) {
      io.to(`farmer_${order.farmerId}`).emit('new_order', {
        orderId: order._id,
        customerName: order.customerName,
        products: order.products,
        totalEarnings: order.totalEarnings,
        createdAt: order.createdAt
      });
      
      // Also emit to all farmers room for general notifications
      io.emit('order_update', {
        type: 'new_order',
        farmerId: order.farmerId,
        order: order
      });
    }

    res.status(201).json({ ok: true, created });
  } catch (err) {
    console.error("Failed to create orders:", err);
    res.status(500).json({ message: "Failed to create orders" });
  }
});

export default router;
