import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      lowercase: true,
      sparse: true, // Allow null for SMS-only verification
    },
    phone: {
      type: String,
      sparse: true, // Allow null for email-only verification
    },
    otp: {
      type: String,
      required: true,
    },
    method: {
      type: String,
      enum: ["email", "sms"],
      required: true,
      default: "email",
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      index: { expireAfterSeconds: 0 }, // Auto-delete after expiry
    },
    attempts: {
      type: Number,
      default: 0,
      max: 5, // Max 5 attempts
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Create index to auto-delete expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OTP = mongoose.model("OTP", otpSchema);
export default OTP;
