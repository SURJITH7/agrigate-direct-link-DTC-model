import express from "express";
const router = express.Router();
import { sendOTP, verifyOTP, resendOTP } from "../components/otpController.js";

// OTP routes
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);

export default router;
