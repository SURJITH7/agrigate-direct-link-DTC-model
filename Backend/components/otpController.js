import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import asyncHandler from "express-async-handler";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import twilio from "twilio";
import otpGenerator from "otp-generator";
import validator from "validator";
import OTP from "../models/OTP.js";

// ============================================
// LOAD ENVIRONMENT VARIABLES
// ============================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, "..", "..", ".env"),
});

// ============================================
// EMAIL PROVIDER CONFIGURATION
// ============================================

// Set EMAIL_PROVIDER=gmail locally.
// Set EMAIL_PROVIDER=resend on Render.

const emailProvider =
  process.env.EMAIL_PROVIDER ||
  (process.env.NODE_ENV === "production" ? "resend" : "gmail");

let emailTransporter = null;
let resendClient = null;

if (emailProvider === "gmail") {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    emailTransporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    console.log("✓ Gmail SMTP email service configured");
  } else {
    console.warn("⚠️ Gmail credentials are missing");
  }
} else if (emailProvider === "resend") {
  if (process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
    console.log("✓ Resend email service configured");
  } else {
    console.warn("⚠️ RESEND_API_KEY is missing");
  }
} else {
  console.error(`❌ Unsupported EMAIL_PROVIDER: ${emailProvider}`);
}

// ============================================
// TWILIO SMS CONFIGURATION
// ============================================

let twilioClient = null;

if (
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_PHONE
) {
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  console.log("✓ SMS (Twilio) configured");
} else {
  console.warn("⚠️ SMS credentials are missing");
}

// ============================================
// EMAIL SENDER FUNCTION
// ============================================

const sendEmail = async ({ to, subject, html }) => {
  if (emailProvider === "gmail") {
    if (!emailTransporter) {
      throw new Error("Gmail email service is not configured");
    }

    return await emailTransporter.sendMail({
      from: `"AgriGate" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  }

  if (emailProvider === "resend") {
    if (!resendClient) {
      throw new Error("Resend email service is not configured");
    }

    const { data, error } = await resendClient.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL ||
        "AgriGate <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    });

    if (error) {
      throw new Error(error.message || "Resend email delivery failed");
    }

    return data;
  }

  throw new Error("Invalid email provider configuration");
};

// ============================================
// OTP GENERATOR
// ============================================

const generateOTP = () => {
  return otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });
};

// ============================================
// SEND OTP
// ============================================

const sendOTP = asyncHandler(async (req, res) => {
  const { email, phone, method } = req.body;

  if (!method || !["email", "sms"].includes(method)) {
    res.status(400);
    throw new Error("Method must be either 'email' or 'sms'");
  }

  // ==========================================
  // EMAIL OTP
  // ==========================================

  if (method === "email") {
    if (!email || !validator.isEmail(email)) {
      res.status(400);
      throw new Error("Please provide a valid email address");
    }

    if (
      (emailProvider === "gmail" && !emailTransporter) ||
      (emailProvider === "resend" && !resendClient)
    ) {
      res.status(503);
      throw new Error("Email service is not configured");
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Prevent repeated OTP requests within 30 seconds
    const recentOTP = await OTP.findOne({
      email: normalizedEmail,
      method: "email",
      createdAt: {
        $gt: new Date(Date.now() - 30 * 1000),
      },
    });

    if (recentOTP) {
      res.status(429);
      throw new Error("Please wait 30 seconds before requesting a new OTP");
    }

    const otp = generateOTP();

    // Create the new OTP record
    const otpRecord = await OTP.create({
      email: normalizedEmail,
      otp,
      method: "email",
      attempts: 0,
      verified: false,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    try {
      const html = `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
          <div style="max-width: 500px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #198754;">AgriGate Market</h2>

            <p style="color: #333; font-size: 16px;">
              Thank you for registering with AgriGate!
            </p>

            <p style="color: #666; font-size: 14px;">
              Use this OTP to verify your email address.
              This OTP is valid for 5 minutes only.
            </p>

            <div style="background-color: #198754; color: white; padding: 20px; border-radius: 5px; font-size: 28px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
              ${otp}
            </div>

            <p style="color: #999; font-size: 12px;">
              If you did not request this OTP, please ignore this email.
            </p>

            <p style="color: #999; font-size: 12px;">
              © 2026 AgriGate. All rights reserved.
            </p>
          </div>
        </div>
      `;

      const result = await sendEmail({
        to: normalizedEmail,
        subject: "AgriGate - Email Verification OTP",
        html,
      });

      console.log(`✓ Email OTP sent using ${emailProvider}`);

      if (result?.messageId) {
        console.log("Message ID:", result.messageId);
      } else if (result?.id) {
        console.log("Resend Email ID:", result.id);
      }

      // Delete older OTP records only after successful sending
      await OTP.deleteMany({
        email: normalizedEmail,
        method: "email",
        _id: { $ne: otpRecord._id },
      });

      return res.status(200).json({
        success: true,
        message: "OTP sent successfully to your email",
        email: normalizedEmail,
        method: "email",
      });
    } catch (error) {
      console.error("❌ Email sending failed:", error.message);

      await OTP.deleteOne({ _id: otpRecord._id });

      res.status(500);
      throw new Error(`Failed to send OTP: ${error.message}`);
    }
  }

  // ==========================================
  // SMS OTP
  // ==========================================

  if (method === "sms") {
    if (!phone) {
      res.status(400);
      throw new Error("Please provide a phone number");
    }

    if (!twilioClient) {
      res.status(503);
      throw new Error("SMS service is not configured");
    }

    const normalizedPhone = phone.replace(/\D/g, "");

    if (normalizedPhone.length < 10) {
      res.status(400);
      throw new Error("Please provide a valid phone number");
    }

    // Preserves your existing phone-number formatting
    const formattedPhone =
      normalizedPhone.length === 10
        ? `+1${normalizedPhone}`
        : `+${normalizedPhone}`;

    const recentOTP = await OTP.findOne({
      phone: formattedPhone,
      method: "sms",
      createdAt: {
        $gt: new Date(Date.now() - 30 * 1000),
      },
    });

    if (recentOTP) {
      res.status(429);
      throw new Error("Please wait 30 seconds before requesting a new OTP");
    }

    const otp = generateOTP();

    const otpRecord = await OTP.create({
      phone: formattedPhone,
      otp,
      method: "sms",
      attempts: 0,
      verified: false,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    try {
      await twilioClient.messages.create({
        body: `Your AgriGate verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`,
        from: process.env.TWILIO_PHONE,
        to: formattedPhone,
      });

      await OTP.deleteMany({
        phone: formattedPhone,
        method: "sms",
        _id: { $ne: otpRecord._id },
      });

      console.log("✓ SMS OTP sent");

      return res.status(200).json({
        success: true,
        message: "OTP sent successfully to your phone",
        phone: formattedPhone.slice(-4),
        method: "sms",
      });
    } catch (error) {
      console.error("❌ SMS sending failed:", error.message);

      await OTP.deleteOne({ _id: otpRecord._id });

      res.status(500);
      throw new Error("Failed to send OTP via SMS. Please try email instead.");
    }
  }
});

// ============================================
// VERIFY OTP
// ============================================

const verifyOTP = asyncHandler(async (req, res) => {
  const { email, phone, otp, method } = req.body;

  if (!otp) {
    res.status(400);
    throw new Error("Please provide OTP");
  }

  if (!method || !["email", "sms"].includes(method)) {
    res.status(400);
    throw new Error("Method must be either 'email' or 'sms'");
  }

  let query;
  let verifiedValue;

  if (method === "email") {
    if (!email || !validator.isEmail(email)) {
      res.status(400);
      throw new Error("Please provide a valid email address");
    }

    const normalizedEmail = email.toLowerCase().trim();

    query = {
      email: normalizedEmail,
      method: "email",
    };

    verifiedValue = normalizedEmail;
  } else {
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

    query = {
      phone: formattedPhone,
      method: "sms",
    };

    verifiedValue = formattedPhone;
  }

  const otpRecord = await OTP.findOne(query);

  if (!otpRecord) {
    res.status(400);
    throw new Error("OTP not found. Please request a new OTP.");
  }

  if (new Date() > otpRecord.expiresAt) {
    await OTP.deleteOne({ _id: otpRecord._id });

    res.status(400);
    throw new Error("OTP has expired. Please request a new one.");
  }

  if (otpRecord.verified) {
    res.status(400);
    throw new Error("This OTP has already been used.");
  }

  if (otpRecord.otp !== otp.toString()) {
    otpRecord.attempts = (otpRecord.attempts || 0) + 1;

    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({ _id: otpRecord._id });

      res.status(429);
      throw new Error(
        "Too many failed attempts. Please request a new OTP."
      );
    }

    await otpRecord.save();

    res.status(400);
    throw new Error("Invalid OTP");
  }

  otpRecord.verified = true;
  await otpRecord.save();

  console.log(`✓ ${method} verified`);

  if (method === "email") {
    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      email: verifiedValue,
      method: "email",
      verified: true,
    });
  }

  return res.status(200).json({
    success: true,
    message: "Phone verified successfully",
    phone: verifiedValue.slice(-4),
    method: "sms",
    verified: true,
  });
});

// ============================================
// RESEND OTP
// ============================================

const resendOTP = asyncHandler(async (req, res) => {
  const { email, phone, method } = req.body;

  if (!method || !["email", "sms"].includes(method)) {
    res.status(400);
    throw new Error("Method must be either 'email' or 'sms'");
  }

  // Reuse the existing sendOTP logic
  req.body = {
    email,
    phone,
    method,
  };

  return await sendOTP(req, res);
});

// ============================================
// EXPORT CONTROLLERS
// ============================================

export {
  sendOTP,
  verifyOTP,
  resendOTP,
};
