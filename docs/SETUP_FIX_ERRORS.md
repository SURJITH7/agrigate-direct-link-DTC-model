# Quick Setup - Fix Authentication & OTP Errors

## 🔧 The Problems

| Error                       | Cause                               | Fix                         |
| --------------------------- | ----------------------------------- | --------------------------- |
| `401 Unauthorized`          | User not logged in or no auth token | Complete registration first |
| `503 on /api/auth/send-otp` | Email/SMS not configured            | Configure credentials below |

---

## ✅ Setup in 3 Steps

### Step 1: Configure Email (For OTP)

**Option A: Use Gmail (Recommended for Testing)**

1. Go to: https://myaccount.google.com/apppasswords
2. Select **Mail** and **Windows Computer**
3. Copy the 16-character password shown
4. Update `.env`:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
```

**Option B: Use Mailtrap (Free, Easy Testing)**

1. Go to: https://mailtrap.io/signin
2. Create account and get credentials
3. Update `.env`:

```env
EMAIL_SERVICE=mailtrap
EMAIL_USER=your_mailtrap_user@mailtrap.io
EMAIL_PASSWORD=your_mailtrap_password
```

### Step 2: Optional - Configure SMS (Twilio)

Leave these as-is if you don't need SMS. Users will only see Email option.

```env
# Leave blank to disable SMS:
# TWILIO_ACCOUNT_SID=
# TWILIO_AUTH_TOKEN=
# TWILIO_PHONE=
```

**Or configure if you want SMS:**

1. Go to: https://www.twilio.com/console
2. Copy Account SID and Auth Token
3. Get a phone number
4. Update `.env`:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE=+1-555-867-5309
```

### Step 3: Restart Backend

```bash
# Stop the running server (Ctrl+C)
# Then restart:
npm start
```

---

## 🧪 Test It

### Test Registration + Email OTP

1. Visit frontend registration page
2. Select **"Email OTP"**
3. Enter your test email: `your_gmail@gmail.com`
4. Click **"Send OTP"**
5. Check your email for 6-digit code
6. Enter code and verify ✅

### Test Profile Access

After registration:

1. Login with your test account
2. Visit `/consumer` or `/farmer` dashboard
3. Go to Profile section
4. Should show your verified email

---

## 🆘 Troubleshooting

### "Email service is not configured"

**Check your `.env` file:**

```bash
# WRONG - placeholder values:
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password

# CORRECT - real values:
EMAIL_USER=sanja@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
```

### "Email sending failed"

Check these:

1. **Gmail users**:
   - Use 16-character app password (NOT your regular password)
   - Enable 2-factor authentication first
   - Visit: https://myaccount.google.com/apppasswords

2. **All users**:
   - Verify EMAIL_USER is a real email
   - Verify EMAIL_PASSWORD is correct
   - Restart backend after changing .env
   - Check internet connection

### "401 Unauthorized on /api/users/profile"

This is expected! The endpoint requires authentication.

**Solution**:

1. Complete registration first
2. Login with your credentials
3. Then access profile

The 401 error is correct behavior - it prevents unauthorized access.

---

## 📝 Current Configuration Status

Check your `.env` file to see which services are active:

```bash
# Run this from project root:
cat .env | grep -E "EMAIL_|TWILIO_"
```

**You should see:**

- ✅ EMAIL_USER (not placeholder)
- ✅ EMAIL_PASSWORD (not placeholder)
- ⚠️ TWILIO\_\* (optional, can be empty)

---

## 🚀 After Setup

1. Complete user registration ✅
2. Verify OTP via email ✅
3. Login with credentials ✅
4. Access profile endpoint ✅
5. All errors should be gone! ✅

---

## 📞 Need Help?

| Issue         | Guide                                  |
| ------------- | -------------------------------------- |
| Email setup   | See EMAIL_SETUP_GUIDE.md               |
| SMS setup     | See SMS_SETUP_GUIDE.md                 |
| API reference | See QUICK_REFERENCE.md                 |
| Full details  | See HYBRID_SMS_EMAIL_IMPLEMENTATION.md |

---

**Status**: Backend is now configured to catch configuration issues early and return helpful error messages.
