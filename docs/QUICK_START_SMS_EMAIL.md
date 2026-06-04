# Hybrid SMS + Email OTP - Quick Start Guide

## ⚡ Get Running in 5 Minutes

### Step 1: Email Setup (Required)

```bash
# In .env file, update:
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASSWORD=your_app_password    # 16-char from Google
```

**Get Gmail app password:**

1. Go to myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer"
3. Copy the 16-character password
4. Paste as EMAIL_PASSWORD

### Step 2: SMS Setup (Optional)

```bash
# In .env file, add:
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE=+1-555-867-5309
```

**Get Twilio credentials:**

1. Go to twilio.com/console
2. Copy Account SID and Auth Token from top
3. Get a phone number (free trial available)
4. Paste into .env

### Step 3: Start Backend

```bash
npm start
```

### Step 4: Test on Frontend

1. Visit registration page
2. Select "Email OTP" or "SMS OTP"
3. Enter email/phone
4. Click "Send OTP"
5. Check email/SMS for code
6. Enter code to verify

---

## 🎯 What Works

✅ Email OTP verification
✅ SMS OTP verification (if Twilio configured)
✅ User can choose method
✅ Rate limiting (30 seconds between sends)
✅ Failed attempt protection (5 attempts max)
✅ OTP expires in 5 minutes
✅ Users can switch methods
✅ Works with form submission

---

## 🐛 Troubleshooting

| Problem              | Solution                                     |
| -------------------- | -------------------------------------------- |
| "Invalid email"      | Use real email format: user@domain.com       |
| "Invalid phone"      | Use 10+ digits or international format       |
| "SMS not available"  | Check Twilio credentials in .env             |
| "Email not received" | Check Gmail password is 16-char app password |
| "Too many attempts"  | Request new OTP - wait 30 seconds            |
| OTP expired          | Request new OTP - valid for 5 min only       |

---

## 📋 What Changed

| File                                       | Changes                                  |
| ------------------------------------------ | ---------------------------------------- |
| `Backend/components/otpController.js`      | Complete rewrite for dual-method support |
| `Frontend/src/components/RegisterForm.jsx` | Added method selector and SMS input      |
| `Backend/models/OTP.js`                    | Added phone, method, verified fields     |
| `.env`                                     | Added TWILIO\_\* configuration variables |
| `.env.example`                             | Added TWILIO\_\* documentation           |
| `docs/SMS_SETUP_GUIDE.md`                  | New - Twilio setup instructions          |
| `docs/HYBRID_SMS_EMAIL_IMPLEMENTATION.md`  | New - Complete documentation             |

---

## 🔧 Environment Variables

### Email (Required)

```
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
```

### SMS (Optional)

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE=+1-555-867-5309
```

### Other (Existing)

```
PORT=5000
MONGO_URI=your_connection_string
JWT_SECRET=your_secret
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
```

---

## 📱 User Interface

### Method Selection

```
Choose Verification Method:
◉ 📧 Email OTP   ◯ 📱 SMS OTP
```

### Verification Badge

```
✅ Email verified: user@example.com [EMAIL]
✅ Phone verified: 3210 [SMS]
```

---

## 🚀 Go Live Checklist

- [ ] Email configured and tested
- [ ] SMS configured (optional) and tested
- [ ] Test registration with email
- [ ] Test registration with SMS (if using)
- [ ] Test rate limiting
- [ ] Test error handling
- [ ] Test switching methods
- [ ] Deploy to production
- [ ] Set up monitoring/logging

---

## 📞 Support

- **Email issues?** See EMAIL_SETUP_GUIDE.md
- **SMS issues?** See SMS_SETUP_GUIDE.md
- **API questions?** See QUICK_REFERENCE.md
- **Full details?** See HYBRID_SMS_EMAIL_IMPLEMENTATION.md

---

**Version**: 1.0  
**Last Updated**: 2024
