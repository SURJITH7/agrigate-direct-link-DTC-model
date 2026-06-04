# 🗺️ AgriGate Nearest Farmer Map - Quick Reference

## 30-Second Setup

```bash
# 1. Install dependency
npm install leaflet-routing-machine

# 2. Use in component
import FarmerMapView from "./components/FarmerMapView";
import { LocationProvider } from "./LocationContext";

// 3. Wrap & render
<LocationProvider>
  <FarmerMapView showRoutesCount={5} />
</LocationProvider>
```

---

## Core Functions

### Distance Calculation

```javascript
import { getDistance } from "./utils/distance";

const km = getDistance(lat1, lon1, lat2, lon2);
// Returns: number (kilometers)
```

### Find Nearest Farmer

```javascript
import { findNearest } from "./utils/distance";

const nearest = findNearest(userLocation, farmers);
// Returns: { ...farmer, distance: 5.2 }
```

### Find Multiple Nearest

```javascript
import { findNearestMultiple } from "./utils/distance";

const topFive = findNearestMultiple(userLocation, farmers, 5);
// Returns: Array sorted by distance
```

---

## Hook Usage

```javascript
import useFarmerLocations from "./hooks/useFarmerLocations";
import { useGeoLocation } from "./LocationContext";

function MyComponent() {
  const { location } = useGeoLocation();
  const { farmers, nearest, nearestSingle, loading, error } =
    useFarmerLocations(location, 5);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {farmers.map((farm) => (
        <div key={farm._id}>
          {farm.fullName} - {farm.distance.toFixed(1)} km
        </div>
      ))}
    </div>
  );
}
```

---

## Component Props

### FarmerMapView

```javascript
<FarmerMapView
  showRoutesCount={5} // Number of farmers to show (default: 5)
/>
```

---

## API Endpoints Quick Reference

### Get all farmers with locations

```javascript
GET /api/users?role=farmer
// Returns farmers with latitude/longitude
```

### Update location

```javascript
PUT /api/users/location
Body: {
  latitude: number,
  longitude: number,
  name: string  // Location name (optional)
}
```

---

## Quick Troubleshooting

| Problem            | Solution                                  |
| ------------------ | ----------------------------------------- |
| Map shows spinner  | Grant GPS permission                      |
| No farmers showing | Check DB has farmers with lat/lon         |
| API 404 error      | Verify backend routes added               |
| Routes not showing | Run `npm install leaflet-routing-machine` |
| GPS not tracking   | Use HTTPS (prod) or localhost (dev)       |

---

## Testing

```javascript
// In browser console
window.agrigate.runAllTests(); // Run all tests
```

---

## Files Created

✅ `src/utils/distance.js` - Distance calculations
✅ `src/hooks/useFarmerLocations.js` - Fetch farmers
✅ `src/components/FarmerMapView.jsx` - Map component
✅ `src/components/FindNearestFarmExample.jsx` - Example usage

---

## Files Modified

✅ `Backend/components/userController.js` - Added farmer endpoints
✅ `Backend/routes/userRoutes.js` - Added routes
✅ `Frontend/package.json` - Added leaflet-routing-machine

---

## Status

✅ **COMPLETE & PRODUCTION READY**

All files created, tested, and documented. Ready for deployment!

- http://localhost:5173 → Register → Send OTP → Check Email

---

## 📁 File Structure

```
Backend/
├── models/
│   ├── User.js ✏️ (isVerified, verifiedAt added)
│   └── OTP.js 🆕
├── components/
│   ├── userController.js ✏️ (register, login updated)
│   └── otpController.js 🆕 (sendOTP, verifyOTP, resendOTP)
├── routes/
│   ├── authRoutes.js 🆕 (/send-otp, /verify-otp, /resend-otp)
│   └── userRoutes.js ✏️ (/register updated)
└── server.js ✏️ (authRoutes imported)

Frontend/
└── src/components/
    └── RegisterForm.jsx 🆕 (Complete OTP registration)

Docs/
├── OTP_VERIFICATION_GUIDE.md 🆕 (Complete guide)
├── EMAIL_SETUP_GUIDE.md 🆕 (Email config)
└── IMPLEMENTATION_SUMMARY.md 🆕 (What was built)
```

---

## 🔌 API Endpoints

### Send OTP

```
POST /api/auth/send-otp
Body: { email: "user@example.com" }
Response: { message: "OTP sent", email: "user@example.com" }
```

### Verify OTP

```
POST /api/auth/verify-otp
Body: { email: "user@example.com", otp: "123456" }
Response: { message: "OTP verified", verified: true }
```

### Register User

```
POST /api/users/register
Body: {
  fullName: "John",
  email: "john@example.com",
  password: "pass123",
  confirmPassword: "pass123",
  phone: "9999999999",
  role: "consumer"
}
Response: { _id, email, isVerified: true }
```

### Login User

```
POST /api/users/login
Body: { email: "user@example.com", password: "pass123" }
Response: { _id, email, role } (only if isVerified=true)
```

---

## ⚙️ Environment Variables

```
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=your_jwt_secret

# Email (NEW)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=16_char_app_password

# Payment
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
```

---

## 🗄️ Database Schema

### OTP Document

```javascript
{
  email: "user@example.com",
  otp: "123456",
  expiresAt: Date, // 5 min TTL
  attempts: 0,
  createdAt: Date,
  updatedAt: Date
}
```

### User Updates

```javascript
{
  // ... existing fields ...
  isVerified: false, // default
  verifiedAt: null
}
```

---

## 🧪 Testing

### Happy Path

1. Enter email → Send OTP
2. Copy OTP from email
3. Verify OTP → Fill form → Register
4. ✅ Logged in

### Error Cases

| Scenario           | Result                      |
| ------------------ | --------------------------- |
| Invalid email      | "Invalid email format"      |
| Spam requests      | "Wait 30 seconds"           |
| Wrong OTP          | "Invalid OTP" (5 tries max) |
| Expired OTP        | "OTP expired"               |
| Already registered | "Email already registered"  |
| Login unverified   | "Verify email first"        |

---

## 🔒 Security Features

✅ OTP expires in 5 minutes
✅ Max 5 failed attempts
✅ 30-second cooldown between requests
✅ Passwords hashed with bcrypt
✅ Email validated and normalized
✅ Credentials in environment variables
✅ Auto-delete expired OTPs

---

## 📧 Email Template

```
AgriGate Market
Your verification OTP is:
      123456
Valid for 5 minutes
```

---

## 🐛 Troubleshooting

| Issue                | Solution                                 |
| -------------------- | ---------------------------------------- |
| Emails not sent      | Check EMAIL_USER, EMAIL_PASSWORD in .env |
| OTP not received     | Check spam folder, wait 30 sec           |
| Verification fails   | Use correct 6-digit OTP                  |
| Can't login          | Email must be verified first             |
| Wrong password error | Use app password, not Gmail password     |

---

## 📚 Documentation

- `OTP_VERIFICATION_GUIDE.md` - Detailed API docs
- `EMAIL_SETUP_GUIDE.md` - Gmail configuration
- `IMPLEMENTATION_SUMMARY.md` - What was built

---

## 🎯 Key Files

| File                                     | Purpose         | Status     |
| ---------------------------------------- | --------------- | ---------- |
| Backend/models/OTP.js                    | OTP schema      | 🆕 NEW     |
| Backend/components/otpController.js      | OTP logic       | 🆕 NEW     |
| Backend/routes/authRoutes.js             | Auth endpoints  | 🆕 NEW     |
| Backend/models/User.js                   | User schema     | ✏️ Updated |
| Backend/components/userController.js     | User logic      | ✏️ Updated |
| Frontend/src/components/RegisterForm.jsx | Registration UI | ✏️ Updated |

---

## 💾 Database Indexes

MongoDB automatically creates:

- OTP TTL index (auto-delete after 5 min)
- Unique index on User.email
- Unique index on OTP.email + createdAt

---

## 🚀 Deployment

### Test Environment

```bash
EMAIL_SERVICE=gmail
EMAIL_USER=test@gmail.com
EMAIL_PASSWORD=app_password_here
```

### Production

```bash
EMAIL_SERVICE=sendgrid
# OR
EMAIL_SERVICE=mailgun
# Use your production credentials
```

---

## 📞 API Response Codes

| Code | Meaning                   |
| ---- | ------------------------- |
| 200  | Success                   |
| 201  | Created                   |
| 400  | Bad request / invalid OTP |
| 403  | Forbidden / not verified  |
| 429  | Too many requests         |
| 500  | Server error              |

---

## ⏱️ Timing

| Action          | Duration      |
| --------------- | ------------- |
| OTP validity    | 5 minutes     |
| Resend cooldown | 30 seconds    |
| Email delivery  | 10-30 seconds |
| OTP auto-delete | 5 minutes TTL |
| Max attempts    | 5 tries       |

---

## ✨ Features Included

✅ Two-step registration
✅ Email OTP verification
✅ Resend OTP functionality
✅ Rate limiting
✅ Brute force protection
✅ Automatic OTP cleanup
✅ Mobile-responsive UI
✅ Real-time validation
✅ Loading states
✅ Error/success alerts
✅ Consumer + Farmer fields
✅ GPS location support

---

## 🔄 Registration Flow

```
Email Input
    ↓
Send OTP (30s cooldown)
    ↓
Verify Email (5 attempts max)
    ↓
Fill Registration Form
    ↓
Create Account (isVerified=true)
    ↓
Auto Login → Dashboard
```

---

## 📊 Database Operations

```javascript
// OTP Operations
- Create OTP (expires 5 min)
- Find OTP by email
- Update failed attempts
- Delete OTP after success
- Auto-delete expired (TTL)

// User Operations
- Create user (isVerified=true)
- Find user by email
- Check isVerified before login
- Update verifiedAt timestamp
```

---

## 🎓 Learning Resources

- Nodemailer docs: https://nodemailer.com/
- OTP Generator: https://www.npmjs.com/package/otp-generator
- Validator.js: https://www.npmjs.com/package/validator
- Gmail App Passwords: https://myaccount.google.com/apppasswords

---

**Last Updated**: April 2026
**Status**: ✅ Production Ready
**Version**: 1.0
