import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { protect, isConsumer } from "../middleware/authMiddleware.js";
import Order from "../models/Order.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * POST /api/payment/create-razorpay-order
 * Create a Razorpay order for payment
 * Body: { amount, currency, description (optional) }
 */
router.post("/create-razorpay-order", protect, isConsumer, async (req, res) => {
  try {
    const { amount, currency = "INR", description } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ message: "Invalid amount. Amount must be greater than 0." });
    }

    // Create order with Razorpay
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt: `rcpt_${Date.now()}`, // Unique receipt ID
      description: description || "Purchase from AgriGate Market",
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res
        .status(500)
        .json({ message: "Failed to create Razorpay order" });
    }

    res.status(201).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      receipt: order.receipt,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error.message);
    res.status(500).json({
      message: "Failed to create payment order",
      error: error.message,
    });
  }
});

/**
 * POST /api/payment/verify-payment
 * Verify Razorpay payment signature
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
router.post("/verify-payment", protect, isConsumer, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        message:
          "Missing required payment verification fields: order_id, payment_id, or signature",
      });
    }

    // Verify the signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (!isSignatureValid) {
      return res.status(400).json({
        message: "Invalid payment signature. Payment verification failed.",
        verified: false,
      });
    }

    // Signature is valid, proceed with order creation
    res.status(200).json({
      verified: true,
      message: "Payment verified successfully",
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
    });
  } catch (error) {
    console.error("Error verifying payment:", error.message);
    res.status(500).json({
      message: "Failed to verify payment",
      error: error.message,
    });
  }
});

/**
 * GET /api/payment/orders/:orderId
 * Fetch payment status for an order
 */
router.get("/orders/:orderId", protect, isConsumer, async (req, res) => {
  try {
    const { orderId } = req.params;

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(orderId);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.status(200).json({
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      description: payment.description,
      email: payment.email,
      contact: payment.contact,
    });
  } catch (error) {
    console.error("Error fetching payment:", error.message);
    res.status(500).json({
      message: "Failed to fetch payment details",
      error: error.message,
    });
  }
});

export default router;
