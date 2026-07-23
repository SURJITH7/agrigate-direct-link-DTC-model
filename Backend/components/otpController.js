import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Ensure dotenv is configured for this module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

import asyncHandler from "express-async-handler";
import nodemailer from "nodemailer";
import twilio from "twilio";
import otpGenerator from "otp-generator";
import validator from "validator";
import OTP from "../models/OTP.js";
import User from "../models/User.js";

// Configure nodemailer transporter for email
let emailTransporter = null;
let emailConfigError = null;

try {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    // emailTransporter = nodemailer.createTransport({
    //   service: process.env.EMAIL_SERVICE || "gmail",
    //   auth: {
    //     user: process.env.EMAIL_USER,
    //     pass: process.env.EMAIL_PASSWORD,
    //   },
    // });
    emailTransporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    family: 4,   // Force IPv4
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
  });
    emailTransporter.verify((error, success) => {
      if (error) {
        console.error("❌ SMTP Verify Error:");
        console.error(error);
      } else {
        console.log("✅ SMTP Server is ready");
      }
    });

    console.log("✓ Email transporter configured for:", process.env.EMAIL_USER);
  } else {
    emailConfigError =
      "Email not configured (EMAIL_USER or EMAIL_PASSWORD missing)";
    console.warn("⚠️", emailConfigError);
  }
} catch (error) {
  emailConfigError = `Failed to initialize email: ${error.message}`;
  console.error("❌", emailConfigError);
}

// Configure Twilio for SMS (if credentials provided)
let twilioClient = null;
let smsConfigError = null;

try {
  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE
  ) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
    console.log("✓ SMS (Twilio) configured");
  } else {
    smsConfigError = "SMS not configured (Twilio credentials missing)";
    console.warn("⚠️", smsConfigError);
  }
} catch (error) {
  smsConfigError = `Failed to initialize SMS: ${error.message}`;
  console.error("❌", smsConfigError);
}

/**
 * @desc    Send OTP via Email or SMS
 * @route   POST /api/auth/send-otp
 * @access  Public
 */
const sendOTP = asyncHandler(async (req, res) => {
  const { email, phone, method } = req.body;

  // Validate method parameter
  if (!method || !["email", "sms"].includes(method)) {
    res.status(400);
    throw new Error("Method must be either 'email' or 'sms'");
  }

  // Validate email method
  if (method === "email") {
    if (!emailTransporter) {
      res.status(503);
      throw new Error(
        emailConfigError ||
          "Email service is not configured. Please configure EMAIL_USER and EMAIL_PASSWORD in .env",
      );
    }

    if (!email || !validator.isEmail(email)) {
      res.status(400);
      throw new Error("Please provide a valid email address");
    }

    const normalizedEmail = email.toLowerCase();

    // Check if OTP was recently sent (prevent spam - allow 1 OTP per 30 seconds)
    const recentOTP = await OTP.findOne({
      email: normalizedEmail,
      method: "email",
      createdAt: { $gt: new Date(Date.now() - 30 * 1000) },
    });

    if (recentOTP) {
      res.status(429);
      throw new Error("Please wait 30 seconds before requesting a new OTP");
    }

    // Generate 6-digit OTP
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email: normalizedEmail });

    // Create new OTP record
    const otpRecord = await OTP.create({
      email: normalizedEmail,
      otp,
      method: "email",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    if (!otpRecord) {
      res.status(500);
      throw new Error("Failed to generate OTP");
    }

    // Send OTP via email
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: normalizedEmail,
        subject: "AgriGate - Email Verification OTP",
        html: `
          <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
            <div style="max-width: 500px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
              <h2 style="color: #198754; margin-bottom: 20px;">AgriGate Market</h2>
              <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Thank you for registering with AgriGate!</p>
              <p style="color: #666; font-size: 14px; margin-bottom: 20px;">Use this OTP to verify your email address. This OTP is valid for 5 minutes only.</p>
              <div style="background-color: #198754; color: white; padding: 20px; border-radius: 5px; font-size: 28px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                ${otp}
              </div>
              <p style="color: #999; font-size: 12px; margin-top: 20px;">
                If you did not request this OTP, please ignore this email.
              </p>
              <p style="color: #999; font-size: 12px;">
                © 2026 AgriGate. All rights reserved.
              </p>
            </div>
          </div>
        `,
      };

      await emailTransporter.sendMail(mailOptions);
      console.log(`✓ Email OTP sent to ${normalizedEmail}`);
    } catch (error) {
      console.error("❌ Email sending failed:", error.message);
      console.error("Full error:", error);
      res.status(500);
      throw new Error(
        `Failed to send OTP to email: ${error.message}. Please check email configuration.`,
      );
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email",
      email: normalizedEmail,
      method: "email",
    });
  }

  // Validate SMS method
  if (method === "sms") {
    if (!phone) {
      res.status(400);
      throw new Error("Please provide a phone number");
    }

    if (!twilioClient) {
      res.status(503);
      throw new Error(
        "SMS service is not configured. Please use email verification.",
      );
    }

    // Validate and normalize phone number
    const normalizedPhone = phone.replace(/\D/g, "");
    if (normalizedPhone.length < 10) {
      res.status(400);
      throw new Error(
        "Please provide a valid phone number (at least 10 digits)",
      );
    }

    // Ensure it has country code (defaults to +1 for US/Canada if missing)
    const formattedPhone =
      normalizedPhone.length === 10
        ? `+1${normalizedPhone}`
        : `+${normalizedPhone}`;

    // Check if OTP was recently sent (prevent spam)
    const recentOTP = await OTP.findOne({
      phone: formattedPhone,
      method: "sms",
      createdAt: { $gt: new Date(Date.now() - 30 * 1000) },
    });

    if (recentOTP) {
      res.status(429);
      throw new Error("Please wait 30 seconds before requesting a new OTP");
    }

    // Generate 6-digit OTP
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    // Delete any existing OTP for this phone
    await OTP.deleteMany({ phone: formattedPhone });

    // Create new OTP record
    const otpRecord = await OTP.create({
      phone: formattedPhone,
      otp,
      method: "sms",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    if (!otpRecord) {
      res.status(500);
      throw new Error("Failed to generate OTP");
    }

    // Send OTP via SMS
    try {
      await twilioClient.messages.create({
        body: `Your AgriGate verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`,
        from: process.env.TWILIO_PHONE,
        to: formattedPhone,
      });
      console.log(`✓ SMS OTP sent to ${formattedPhone}`);
    } catch (error) {
      console.error("❌ SMS sending failed:", error.message);
      // Delete the OTP record if SMS fails
      await OTP.deleteOne({ _id: otpRecord._id });
      res.status(500);
      throw new Error(
        `Failed to send OTP via SMS: ${error.message}. Please try email instead.`,
      );
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to your phone",
      phone: formattedPhone.slice(-4),
      method: "sms",
    });
  }
});

/**
 * @desc    Verify OTP
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, phone, otp, method } = req.body;

  // Validate inputs
  if (!otp) {
    res.status(400);
    throw new Error("Please provide OTP");
  }

  if (!method || !["email", "sms"].includes(method)) {
    res.status(400);
    throw new Error("Method must be either 'email' or 'sms'");
  }

  // Verify email method
  if (method === "email") {
    if (!email || !validator.isEmail(email)) {
      res.status(400);
      throw new Error("Please provide a valid email address");
    }

    const normalizedEmail = email.toLowerCase();

    // Find OTP record
    const otpRecord = await OTP.findOne({
      email: normalizedEmail,
      method: "email",
      otp: otp.toString(),
    });

    if (!otpRecord) {
      // Increment failed attempts
      const failedOTP = await OTP.findOne({
        email: normalizedEmail,
        method: "email",
      });
      if (failedOTP) {
        failedOTP.attempts = (failedOTP.attempts || 0) + 1;
        await failedOTP.save();

        if (failedOTP.attempts >= 5) {
          await OTP.deleteOne({ _id: failedOTP._id });
          res.status(429);
          throw new Error(
            "Too many failed attempts. Please request a new OTP.",
          );
        }
      }

      res.status(400);
      throw new Error("Invalid OTP");
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      res.status(400);
      throw new Error("OTP has expired. Please request a new one.");
    }

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    console.log(`✓ Email verified: ${normalizedEmail}`);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      email: normalizedEmail,
      method: "email",
      verified: true,
    });
  }

  // Verify SMS method
  if (method === "sms") {
    if (!phone) {
      res.status(400);
      throw new Error("Please provide a phone number");
    }

    const normalizedPhone = phone.replace(/\D/g, "");
    if (normalizedPhone.length < 10) {
      res.status(400);
      throw new Error("Please provide a valid phone number");
    }

    const formattedPhone =
      normalizedPhone.length === 10
        ? `+1${normalizedPhone}`
        : `+${normalizedPhone}`;

    // Find OTP record
    const otpRecord = await OTP.findOne({
      phone: formattedPhone,
      method: "sms",
      otp: otp.toString(),
    });

    if (!otpRecord) {
      // Increment failed attempts
      const failedOTP = await OTP.findOne({
        phone: formattedPhone,
        method: "sms",
      });
      if (failedOTP) {
        failedOTP.attempts = (failedOTP.attempts || 0) + 1;
        await failedOTP.save();

        if (failedOTP.attempts >= 5) {
          await OTP.deleteOne({ _id: failedOTP._id });
          res.status(429);
          throw new Error(
            "Too many failed attempts. Please request a new OTP.",
          );
        }
      }

      res.status(400);
      throw new Error("Invalid OTP");
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      res.status(400);
      throw new Error("OTP has expired. Please request a new one.");
    }

    // Mark OTP as verified
    otpRecord.verified = true;
    await otpRecord.save();

    console.log(`✓ Phone verified: ${formattedPhone}`);

    return res.status(200).json({
      success: true,
      message: "Phone verified successfully",
      phone: formattedPhone.slice(-4),
      method: "sms",
      verified: true,
    });
  }
});

/**
 * @desc    Resend OTP
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
const resendOTP = asyncHandler(async (req, res) => {
  const { email, phone, method } = req.body;

  if (!method || !["email", "sms"].includes(method)) {
    res.status(400);
    throw new Error("Method must be either 'email' or 'sms'");
  }

  if (method === "email") {
    if (!email) {
      res.status(400);
      throw new Error("Please provide email address");
    }
    // Call sendOTP again
    req.body = { email, method: "email" };
    return await sendOTP(req, res);
  }

  if (method === "sms") {
    if (!phone) {
      res.status(400);
      throw new Error("Please provide phone number");
    }
    // Call sendOTP again
    req.body = { phone, method: "sms" };
    return await sendOTP(req, res);
  }
});

export { sendOTP, verifyOTP, resendOTP };
