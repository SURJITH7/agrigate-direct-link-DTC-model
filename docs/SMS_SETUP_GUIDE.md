# SMS OTP Setup Guide for AgriGate

## Overview

AgriGate now supports both **Email OTP** and **SMS OTP** for user verification during registration. This guide explains how to set up the SMS functionality using Twilio.

## Why SMS OTP?

- ✅ **Higher Delivery Success**: SMS has higher delivery rates than Email
- ✅ **Instant Delivery**: Users receive SMS within seconds
- ✅ **Better User Experience**: Users can choose their preferred method
- ✅ **Reliable**: Works even if email is not configured
- ✅ **International Support**: Can send OTP to phone numbers worldwide

## Prerequisites

- Twilio account (free or paid)
- Node.js and npm
- Running AgriGate backend

## Step 1: Create a Twilio Account

### 1.1 Sign Up

1. Visit [Twilio Console](https://www.twilio.com/console)
2. Click **"Sign up"** (or sign in if you have an account)
3. Fill in your details:
   - Email address
   - Password
   - Full name
   - Project name
4. Verify your email
5. Complete the phone number verification

### 1.2 Get Your Credentials

After signing up, you'll see the Twilio Console dashboard:

- **Account SID**: Visible at the top of the page (starts with `AC...`)
- **Auth Token**: Visible at the top of the page (click "show" to reveal)
- **Phone Number**: You can get a free trial phone number or use your own

## Step 2: Get a Twilio Phone Number

### Option 1: Free Trial Phone Number (Recommended for Testing)

1. Go to **Phone Numbers** in the left sidebar
2. Click **"Get your first Twilio phone number"**
3. Choose a country and area code
4. Accept the terms and click **"Choose this number"**
5. Your number will be displayed (e.g., `+1-555-867-5309`)

### Option 2: Purchase a Phone Number

1. Go to **Phone Numbers** → **Manage**
2. Click **"Buy a number"**
3. Choose your country, area code, and number
4. Click **"Buy"**

### Note: Trial Account Limitations

Free trial accounts can only send SMS to verified phone numbers. Add your phone:

1. Go to **Phone Numbers** → **Verified Caller IDs**
2. Click **"Add a Verified Caller ID"**
3. Enter your phone number
4. Confirm with the code you receive

## Step 3: Configure AgriGate Backend

### 3.1 Update .env File

Open `Backend/.env` (or create one if it doesn't exist):

```env
# SMS Configuration for OTP (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE=+1-555-867-5309
```

Replace with your actual credentials from Twilio Console.

### 3.2 Verify Installation

Make sure Twilio is installed:

```bash
cd Backend
npm list twilio
```

If not installed:

```bash
npm install twilio
```

## Step 4: Test SMS OTP

### 4.1 Start the Backend

```bash
cd Backend
npm start
```

### 4.2 Test with Frontend

1. Go to the registration page
2. Select **"SMS OTP"** option
3. Enter your verified phone number
4. Click **"Send OTP"**
5. Check your SMS for the 6-digit code
6. Enter the code to verify

## Troubleshooting

### Issue: "SMS service is not configured"

**Cause**: Twilio credentials not set in `.env`

**Solution**:

1. Check `.env` file has all three Twilio variables
2. Verify credentials match exactly from Twilio Console
3. Restart backend server after updating `.env`

### Issue: "Request to Twilio failed"

**Cause**: Invalid credentials or network issue

**Solution**:

```bash
# Check backend logs
# Verify credentials in .env
# Check internet connection
# Restart backend: npm start
```

### Issue: SMS not received

**Cause**: Multiple possible reasons

**Solutions**:

- **Trial account**: Only verified phone numbers can receive SMS
- **Wrong number**: Check phone number format (should start with `+` and country code)
- **Network issue**: Check backend logs for errors
- **Twilio account**: Check Twilio Console for SMS logs

### Issue: "Too many failed attempts"

**Cause**: Wrong OTP entered 5+ times

**Solution**: Request a new OTP - wait 30 seconds and try again

## API Endpoints

### Send OTP via SMS

```
POST /api/auth/send-otp
Content-Type: application/json

{
  "phone": "9876543210",
  "method": "sms"
}
```

**Response (Success)**:

```json
{
  "success": true,
  "message": "OTP sent successfully to your phone",
  "phone": "3210",
  "method": "sms"
}
```

### Verify OTP (SMS)

```
POST /api/auth/verify-otp
Content-Type: application/json

{
  "phone": "9876543210",
  "otp": "123456",
  "method": "sms"
}
```

**Response (Success)**:

```json
{
  "success": true,
  "message": "Phone verified successfully",
  "phone": "3210",
  "method": "sms",
  "verified": true
}
```

### Resend OTP (SMS)

```
POST /api/auth/resend-otp
Content-Type: application/json

{
  "phone": "9876543210",
  "method": "sms"
}
```

## Phone Number Formatting

The system accepts phone numbers in multiple formats:

| Format            | Example           | Converted To    |
| ----------------- | ----------------- | --------------- |
| 10 digits         | `9876543210`      | `+19876543210`  |
| With +1           | `+19876543210`    | `+19876543210`  |
| With country code | `919876543210`    | `+919876543210` |
| International     | `+44-7700-900000` | `+447700900000` |

**Note**: For India, use format `+91XXXXXXXXXX` or just 10 digits (auto-adds +91)

## Production Considerations

### 1. Regional Compliance

- Verify SMS sending is legal in your region
- Comply with local telecom regulations
- Maintain opt-in records for GDPR/CCPA

### 2. Cost Management

- SMS has per-message cost ($0.01-$0.05 typically)
- Monitor Twilio billing in Console
- Set up SMS spending limits

### 3. Security

- **Never** commit `.env` file with real credentials
- Rotate auth tokens periodically
- Use environment variables only
- Monitor request logs for suspicious activity

### 4. Fallback Strategy

- Keep Email OTP as fallback
- Display both options on registration
- Don't force SMS-only (users may prefer email)

## Disabling SMS (Optional)

To remove SMS option while keeping Email:

**Option 1**: Leave Twilio variables empty in `.env`

```env
# TWILIO_ACCOUNT_SID=
# TWILIO_AUTH_TOKEN=
# TWILIO_PHONE=
```

**Option 2**: Delete Twilio variables completely

- Backend will detect this and disable SMS
- Frontend will only show Email option

## Reference

- [Twilio Documentation](https://www.twilio.com/docs)
- [Twilio Console](https://www.twilio.com/console)
- [SMS API Reference](https://www.twilio.com/docs/sms/send-messages)
- [Phone Number Management](https://www.twilio.com/console/phone-numbers/incoming)

## Next Steps

1. ✅ Create Twilio account
2. ✅ Get phone number
3. ✅ Update `.env` with credentials
4. ✅ Test SMS OTP on registration page
5. ✅ Deploy to production (after testing)

---

**Last Updated**: 2024
**Version**: 1.0
