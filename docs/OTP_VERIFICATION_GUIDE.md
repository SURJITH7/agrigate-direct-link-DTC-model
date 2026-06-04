# Email OTP Verification System - Complete Guide

## Overview

AgriGate now implements a secure two-step registration process using Email OTP (One-Time Password) verification. Users must verify their email before creating an account.

---

## Architecture

### Backend Components

1. **OTP Model** (`Backend/models/OTP.js`)
   - Stores: email, otp, expiresAt, attempts
   - Auto-deletes after 5 minutes
   - Max 5 failed attempts

2. **OTP Controller** (`Backend/components/otpController.js`)
   - `sendOTP()` - Generate and send OTP
   - `verifyOTP()` - Validate OTP
   - `resendOTP()` - Resend OTP

3. **Auth Routes** (`Backend/routes/authRoutes.js`)
   - `POST /api/auth/send-otp`
   - `POST /api/auth/verify-otp`
   - `POST /api/auth/resend-otp`

4. **Updated User Controller** (`Backend/components/userController.js`)
   - Modified `registerUser()` - Now requires isVerified
   - Modified `loginUser()` - Checks isVerified before login

5. **Updated User Schema** (`Backend/models/User.js`)
   - `isVerified` - Boolean (default: false)
   - `verifiedAt` - Timestamp of verification

### Frontend Components

1. **New Registration Form** (`Frontend/src/components/RegisterForm.jsx`)
   - Step 1: Email OTP verification
   - Step 2: Complete registration after verification
   - Real-time validation
   - Resend OTP functionality
   - Loading states

---

## Registration Flow

### User Journey

```
1. User enters email
   ↓
2. Click "Send OTP"
   ↓
3. Backend generates OTP and sends via email
   ↓
4. User receives OTP in inbox
   ↓
5. User enters 6-digit OTP
   ↓
6. Click "Verify OTP"
   ↓
7. Backend validates OTP
   ↓
8. Email marked as verified ✓
   ↓
9. User fills registration details (name, password, location, etc.)
   ↓
10. Click "Complete Registration"
   ↓
11. User account created with isVerified = true
   ↓
12. User logged in and redirected to dashboard
```

---

## API Endpoints

### 1. Send OTP

**POST** `/api/auth/send-otp`

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response (Success - 200):**

```json
{
  "message": "OTP sent successfully to your email",
  "email": "user@example.com"
}
```

**Response (Error - 400):**

```json
{
  "message": "Please provide a valid email address"
}
```

**Validation:**

- Email format validation
- Prevents spam (30-second cooldown)
- Checks if email already registered and verified
- Deletes any existing OTP for the email

---

### 2. Verify OTP

**POST** `/api/auth/verify-otp`

**Request:**

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response (Success - 200):**

```json
{
  "message": "OTP verified successfully",
  "email": "user@example.com",
  "verified": true
}
```

**Response (Error - 400):**

```json
{
  "message": "Invalid OTP"
}
```

**Validation:**

- Checks OTP expiry (5 minutes)
- Prevents brute force (max 5 attempts)
- Auto-deletes OTP after successful verification

---

### 3. Resend OTP

**POST** `/api/auth/resend-otp`

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response:**
Same as Send OTP endpoint

---

### 4. Register User (Updated)

**POST** `/api/users/register`

**Request:**

```json
{
  "fullName": "John Doe",
  "email": "user@example.com",
  "password": "SecurePassword123",
  "confirmPassword": "SecurePassword123",
  "role": "consumer",
  "phone": "9999999999",
  "deliveryAddress": "123 Main St",
  "latitude": 28.7041,
  "longitude": 77.1025
}
```

**Response (Success - 201):**

```json
{
  "_id": "user_id",
  "fullName": "John Doe",
  "email": "user@example.com",
  "role": "consumer",
  "isVerified": true,
  "profilePic": null
}
```

**Important:**

- User MUST have verified email via OTP before calling this
- `isVerified` is automatically set to `true`

---

### 5. Login User (Updated)

**POST** `/api/users/login`

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response (Success - 200):**

```json
{
  "_id": "user_id",
  "fullName": "John Doe",
  "email": "user@example.com",
  "role": "consumer",
  "profilePic": null
}
```

**Response (Error - 403 - Not Verified):**

```json
{
  "message": "Please verify your email before logging in. Use Send OTP button to verify."
}
```

---

## Setup Instructions

### Backend Setup

1. **Install Dependencies**

```bash
npm install nodemailer otp-generator validator
```

2. **Configure Environment Variables** (`.env`)

```
# Email Service
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
```

3. **Get Gmail App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Google generates a 16-character password
   - Use this in `EMAIL_PASSWORD` (NOT your regular password)

4. **Start Backend**

```bash
npm run dev
```

---

### Frontend Setup

1. **Install Dependencies**

```bash
cd Frontend
npm install axios
```

2. **Environment Variables** (`.env` already configured)
   - Razorpay Key ID
   - Backend API URL (localhost:5000)

3. **Start Frontend**

```bash
npm run dev
```

---

## Security Features

✅ **OTP Expiration**

- OTPs expire after 5 minutes
- Auto-deleted from database

✅ **Rate Limiting**

- 30-second cooldown between OTP requests
- Max 5 failed verification attempts
- Email locked after 5 failed attempts

✅ **Email Validation**

- Regex-based format validation
- Prevents duplicate registrations
- Lowercase normalization

✅ **Password Security**

- Minimum 6 characters
- Bcrypt hashing
- Salt rounds: 10

✅ **OTP Generation**

- Cryptographically secure
- 6-digit numeric
- Unique per email

---

## Email Template

Users receive a branded email with:

- AgriGate Market branding
- 6-digit OTP in large, easy-to-read format
- Expiry information (5 minutes)
- Professional HTML formatting
- Security notice about ignoring if not requested

---

## Frontend Features

### Registration Page Features

1. **Step 1: Email Verification**
   - Email input with validation
   - Send OTP button
   - Loading states
   - Error messages
   - Success notifications

2. **Step 2: OTP Entry**
   - 6-digit input (numbers only)
   - Real-time validation
   - Verify OTP button
   - Resend OTP with countdown (30 seconds)
   - Change Email option
   - Auto-focus management

3. **Step 3: Registration Details**
   - Email display (read-only after verification)
   - Full name input
   - Phone number input
   - Password with strength indicator
   - Confirm password
   - Role selection (Consumer/Farmer)

4. **Consumer-Specific Fields**
   - Delivery address
   - Latitude/Longitude
   - GPS location button
   - Address geocoding

5. **Farmer-Specific Fields**
   - Farm name
   - Farm address
   - UPI ID
   - Latitude/Longitude
   - GPS location button

### User Experience

- **Responsive Design**: Works on mobile, tablet, desktop
- **Loading States**: Spinners on buttons during API calls
- **Error Handling**: Clear error messages for each scenario
- **Success Feedback**: Confirmations after each step
- **Accessibility**: Proper labels, semantic HTML
- **Form Validation**: Real-time client-side validation

---

## Testing the System

### Test Case 1: Successful Registration

1. Go to Registration page
2. Enter: `test@gmail.com`
3. Click "Send OTP"
4. Check email inbox for OTP
5. Copy OTP code
6. Paste in OTP field
7. Click "Verify OTP"
8. Fill registration details
9. Click "Complete Registration"
10. ✅ Should be logged in

### Test Case 2: Invalid OTP

1. Send OTP to email
2. Enter wrong 6-digit code
3. Click "Verify OTP"
4. ❌ Should show error: "Invalid OTP"
5. Try 5 times total
6. On 5th attempt: "Too many failed attempts"

### Test Case 3: Expired OTP

1. Send OTP to email
2. Wait 5 minutes
3. Enter OTP
4. Click "Verify OTP"
5. ❌ Should show error: "OTP has expired"

### Test Case 4: Duplicate Email

1. Register with `user@gmail.com`
2. Try to register again with same email
3. ❌ Should show error: "Email already registered"

### Test Case 5: Login Before Verification

1. Try to login with unverified email
2. ❌ Should show error: "Please verify your email before logging in"

---

## Database Schema Updates

### OTP Collection

```javascript
{
  _id: ObjectId,
  email: String,        // user@example.com
  otp: String,          // "123456"
  expiresAt: Date,      // 5 minutes from creation
  attempts: Number,     // Failed attempts counter
  createdAt: Date,      // Auto-generated
  updatedAt: Date       // Auto-generated
}
```

### User Collection Update

```javascript
{
  // ... existing fields ...
  isVerified: Boolean,  // new field - default false
  verifiedAt: Date,     // new field - when verified
}
```

---

## Error Handling

### Common Errors and Solutions

| Error                      | Cause                      | Solution                             |
| -------------------------- | -------------------------- | ------------------------------------ |
| "Invalid email address"    | Malformed email            | Check email format (user@domain.com) |
| "Email already registered" | Email exists + verified    | Use different email or login         |
| "OTP not found"            | Too many failed attempts   | Click "Resend OTP"                   |
| "OTP has expired"          | More than 5 minutes passed | Click "Resend OTP" to get new one    |
| "Too many failed attempts" | 5+ wrong OTPs              | Request new OTP via resend           |
| "Email service error"      | Gmail credentials wrong    | Verify EMAIL_USER and EMAIL_PASSWORD |
| "Please wait 30 seconds"   | Spam prevention            | Wait before requesting new OTP       |

---

## Production Checklist

- [ ] Email credentials configured in production `.env`
- [ ] Use production Gmail account or SendGrid/Mailgun
- [ ] MongoDB TTL indexes verified (auto-delete expired OTPs)
- [ ] Rate limiting configured
- [ ] HTTPS enabled
- [ ] CORS whitelisted for production domain
- [ ] Email templates tested
- [ ] Error messages user-friendly
- [ ] Monitoring set up for failed registrations
- [ ] Backup email service configured

---

## Troubleshooting

### "Emails not being sent"

1. Check `EMAIL_USER` and `EMAIL_PASSWORD` in `.env`
2. Verify Gmail app password (not regular password)
3. Check if 2FA is enabled on Gmail
4. Whitelist application in Gmail security settings
5. Check server logs: `console.error` in otpController

### "OTP verification always fails"

1. Verify `RAZORPAY_KEY_SECRET` is correct (used in signature verification)
2. Wait 5+ minutes and try resend
3. Check if email in database matches
4. Check MongoDB connection

### "Users can't login after verification"

1. Check if `isVerified` field exists in User schema
2. Check login response - should not show 403 error
3. Verify `verifiedAt` timestamp was set
4. Check MongoDB for user record

---

## References

- [Nodemailer Documentation](https://nodemailer.com/)
- [OTP Generator](https://www.npmjs.com/package/otp-generator)
- [Validator.js](https://www.npmjs.com/package/validator)
- [Gmail App Passwords](https://myaccount.google.com/apppasswords)
- [MongoDB TTL Indexes](https://docs.mongodb.com/manual/tutorial/expire-data/)
