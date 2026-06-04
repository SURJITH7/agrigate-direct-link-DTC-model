# OTP Email Configuration - Quick Setup

## Step 1: Enable Gmail App Password

### Why App Password?

Gmail requires app passwords for third-party applications that send emails. It's more secure than using your regular Gmail password.

### Steps:

1. **Go to**: https://myaccount.google.com/apppasswords
2. **Sign in** with your Gmail account
3. **Select App**: Choose "Mail"
4. **Select Device**: Choose "Windows Computer" (or your device)
5. **Generate**: Click "Generate"
6. **Copy**: Google shows a 16-character password like `abcd efgh ijkl mnop`
   - Copy this entire password (with or without spaces)

### Example:

```
Gmail generates: abcd efgh ijkl mnop
Use as: abcdefghijklmnop
```

---

## Step 2: Update Backend .env File

Edit `c:\Users\sanja\OneDrive\Desktop\AgriGate\.env`

```
# Email Configuration for OTP
EMAIL_SERVICE=gmail
EMAIL_USER=your_actual_email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
```

**Important:**

- `EMAIL_USER` = Your actual Gmail address
- `EMAIL_PASSWORD` = The 16-character app password (NOT your Gmail password)
- `EMAIL_SERVICE` = "gmail" (case-sensitive)

### Example:

```
EMAIL_SERVICE=gmail
EMAIL_USER=sanjay.agrigate@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
```

---

## Step 3: Verify Installation

Check that all packages are installed:

```bash
cd c:\Users\sanja\OneDrive\Desktop\AgriGate
npm list nodemailer otp-generator validator
```

Should output:

```
agrigate@1.0.0 c:\Users\sanja\OneDrive\Desktop\AgriGate
├── nodemailer@6.x.x
├── otp-generator@4.x.x
└── validator@13.x.x
```

---

## Step 4: Start Backend Server

```bash
npm run dev
```

**Expected Output:**

```
[nodemon] starting `node Backend/server.js`
[dotenv] injecting env (8) from .env
Server running on port 5000
Connected to MongoDB
```

---

## Step 5: Start Frontend Server

```bash
cd Frontend
npm run dev
```

**Expected Output:**

```
  VITE v5.0.0  ready in XX ms

  ➜  Local:   http://localhost:5173/
```

---

## Step 6: Test OTP System

1. Open http://localhost:5173 in browser
2. Go to **Register/Sign Up** page
3. Click on **Consumer** or **Farmer** registration
4. Enter your email
5. Click **"Send OTP"**
6. **Check your email inbox** for OTP
   - Might take 10-30 seconds to arrive
   - Check spam/promotions folder if not in inbox
7. Copy 6-digit OTP
8. Paste in OTP field on website
9. Click **"Verify OTP"**
10. Complete registration form
11. Click **"Complete Registration"**

---

## Troubleshooting Email Issues

### Issue: "Failed to send OTP to email"

**Problem 1: Gmail App Password not set**

- Solution: Follow Step 1 to generate app password
- Remove spaces: `abcd efgh ijkl mnop` → `abcdefghijklmnop`

**Problem 2: Wrong EMAIL_SERVICE**

- Check: `.env` should have `EMAIL_SERVICE=gmail` (lowercase)

**Problem 3: 2FA not enabled**

- Solution: Enable 2-Step Verification on your Gmail
- Go: https://myaccount.google.com/security

**Problem 4: Gmail blocking "Less secure apps"**

- Solution: Use App Password instead
- Gmail blocks regular passwords for security

### Issue: "OTP not received in email"

1. **Wait longer**: Emails can take up to 30 seconds
2. **Check spam folder**: Might be marked as spam
3. **Check inbox filters**: Custom rules might hide it
4. **Resend OTP**: Click "Resend OTP" button if 30 seconds passed
5. **Check email address**: Verify you entered correct email

### Issue: "Invalid credentials" or authentication error

- Verify `.env` has `EMAIL_PASSWORD` as the 16-character app password
- NOT your Gmail password
- NOT your email address in the password field
- Check for leading/trailing spaces in password

### Issue: Backend shows connection error

**Error in terminal:**

```
[ERROR] Failed to send OTP: Failed to get server address
```

**Solution:**

1. Check internet connection
2. Verify Gmail is accessible
3. Check `.env` format (no extra spaces)
4. Restart backend: `npm run dev`

---

## Test Email List

### Testing Emails to Use:

```
test.agrigate@gmail.com
demo.harvest@gmail.com
sample.farmer@gmail.com
verify.consumer@gmail.com
```

Create Gmail accounts for testing if you don't have extras.

---

## Using Different Email Service

### Option 1: SendGrid

1. Go to: https://sendgrid.com
2. Sign up (free tier available)
3. Get API key
4. Update `.env`:
   ```
   EMAIL_SERVICE=SendGrid
   EMAIL_USER=apikey
   EMAIL_PASSWORD=SG.xxxxxxxxxxxxx
   ```

### Option 2: Mailgun

1. Go to: https://www.mailgun.com
2. Sign up (free tier available)
3. Get API key
4. Update `.env`:
   ```
   EMAIL_SERVICE=Mailgun
   EMAIL_USER=postmaster@sandboxa1b2c3d4.mailgun.org
   EMAIL_PASSWORD=your_api_key
   ```

---

## Email Template Customization

Edit `Backend/components/otpController.js` around line 80:

Find the `mailOptions` object and modify:

```javascript
const mailOptions = {
  from: process.env.EMAIL_USER,
  to: normalizedEmail,
  subject: "Your Custom Subject Here",
  html: `
    <div style="...">
      <!-- Modify HTML here -->
    </div>
  `,
};
```

---

## Security Best Practices

✅ **DO:**

- Store email credentials in `.env` (never in code)
- Use app passwords instead of Gmail password
- Use HTTPS in production
- Rotate email credentials periodically
- Monitor email sending logs

❌ **DON'T:**

- Commit `.env` file to Git
- Share email credentials
- Use personal Gmail password
- Leave test credentials in production
- Log sensitive data

---

## Production Deployment

### Before Going Live:

1. **Get dedicated email service**
   - SendGrid (most reliable)
   - Mailgun
   - AWS SES
   - Azure Communication Services

2. **Update .env** with production credentials

3. **Test thoroughly**
   - Multiple registrations
   - Multiple email providers (Gmail, Outlook, etc.)
   - Check email delivery time
   - Test spam folder behavior

4. **Monitor**
   - Email delivery logs
   - Failed registrations
   - User complaints

5. **Set up alerts**
   - Email service downtime
   - High failure rates
   - Authentication issues

---

## Support

If emails still don't work:

1. Check backend console for detailed error messages
2. Verify `.env` file one more time
3. Test Gmail with the provided credentials outside the app
4. Switch to SendGrid/Mailgun for more reliable service
5. Enable debug logging in `otpController.js`

---

## Quick Reference

| Config          | Value                | Example              |
| --------------- | -------------------- | -------------------- |
| EMAIL_SERVICE   | gmail                | gmail                |
| EMAIL_USER      | Your Gmail address   | user@gmail.com       |
| EMAIL_PASSWORD  | 16-char app password | abcdefghijklmnop     |
| OTP Length      | Always 6 digits      | 123456               |
| OTP Expiry      | 5 minutes            | 300 seconds          |
| Max Attempts    | 5 failed tries       | Then request new OTP |
| Resend Cooldown | 30 seconds           | After requesting     |
