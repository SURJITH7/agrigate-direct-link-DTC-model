import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the project root (AgriGate/.env)
dotenv.config({
  path: path.join(__dirname, "../.env"),
});

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASSWORD:", process.env.EMAIL_PASSWORD ? "Loaded" : "Missing");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function test() {
  try {
    await transporter.verify();
    console.log("✅ SMTP Verified");

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "AgriGate Test Email",
      text: "This is a test email from AgriGate.",
    });

    console.log("✅ Email Sent!");
    console.log(info);
  } catch (err) {
    console.error("❌ Error:");
    console.dir(err, { depth: null });
  }
}

test();