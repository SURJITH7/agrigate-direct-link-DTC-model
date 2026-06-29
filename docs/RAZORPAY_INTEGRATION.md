# Razorpay Integration Guide for AgriGate

## Overview

This document outlines the Razorpay payment gateway integration for the AgriGate agricultural marketplace platform. The integration supports multiple payment methods including cards, UPI, net banking, wallets, and cash on delivery.

---

## Architecture

### Backend (Node.js + Express)

- **Framework**: Express.js
- **Payment Gateway**: Razorpay
- **Authentication**: JWT-based (protected routes)
- **Role-Based Access**: Consumer-only access for payment endpoints

### Frontend (React + Vite)

- **Framework**: React with Vite bundler
- **Payment UI**: Bootstrap components
- **SDK**: Razorpay Checkout (loaded via CDN)
- **State Management**: React Context (AuthContext, CartContext)

---

## Setup Instructions

### 1. Get Razorpay API Keys

1. Visit [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Sign up or log in to your account
3. Navigate to **Settings → API Keys**
4. You'll find:
   - **Key ID** (public) - `rzp_test_xxxxx` or `rzp_live_xxxxx`
   - **Key Secret** (private) - Keep this secure!

### 2. Backend Configuration

#### Install Dependencies

```bash
npm install razorpay
```

#### Environment Variables (.env)

```
# Razorpay API Keys (BACKEND ONLY)
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=your_secret_key_here

# Other configurations
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

#### Files & Components

- **Route**: `Backend/routes/payment.js`
  - `POST /api/payment/create-razorpay-order` - Create payment order
  - `POST /api/payment/verify-payment` - Verify payment signature
  - `GET /api/payment/orders/:orderId` - Fetch payment details

- **Integration in**: `Backend/server.js`
  ```javascript
  import paymentRouter from "./routes/payment.js";
  app.use("/api/payment", paymentRouter);
  ```

### 3. Frontend Configuration

#### Install Dependencies

```bash
npm install axios
```

#### Environment Variables (.env)

```
# Razorpay Key ID (PUBLIC - use only Key ID, not Secret!)
VITE_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
```

#### Key Files

- **Payment Component**: `Frontend/src/components/PaymentPage.jsx`
- **Environment File**: `Frontend/.env`

---

## API Endpoints

### 1. Create Razorpay Order

**Endpoint**: `POST /api/payment/create-razorpay-order`

**Authentication**: Required (JWT token in Authorization header)

**Request Body**:

```json
{
  "amount": 100,
  "currency": "INR",
  "description": "Purchase from AgriGate Market"
}
```

**Response**:

```json
{
  "id": "order_XXXXXXXXXXXX",
  "amount": 10000,
  "currency": "INR",
  "status": "created",
  "receipt": "rcpt_XXXXXXXXXXXX"
}
```

### 2. Verify Payment

**Endpoint**: `POST /api/payment/verify-payment`

**Authentication**: Required (JWT token in Authorization header)

**Request Body**:

```json
{
  "razorpay_order_id": "order_XXXXXXXXXXXX",
  "razorpay_payment_id": "pay_XXXXXXXXXXXX",
  "razorpay_signature": "signature_hash"
}
```

**Response**:

```json
{
  "verified": true,
  "message": "Payment verified successfully",
  "payment_id": "pay_XXXXXXXXXXXX",
  "order_id": "order_XXXXXXXXXXXX"
}
```

### 3. Get Payment Details

**Endpoint**: `GET /api/payment/orders/:orderId`

**Authentication**: Required (JWT token in Authorization header)

**Response**:

```json
{
  "id": "pay_XXXXXXXXXXXX",
  "status": "captured",
  "amount": 10000,
  "currency": "INR",
  "method": "card",
  "description": "Purchase from AgriGate Market",
  "email": "customer@example.com",
  "contact": "+919999999999"
}
```

---

## Frontend Integration

### Payment Flow

1. **User adds items to cart** → Cart stored in localStorage
2. **Checkout page loads** → Fetches cart and displays order summary
3. **User fills payment details** → Name, email, phone, address
4. **User selects payment method**:
   - Card
   - UPI
   - Net Banking
   - Wallets
   - Cash on Delivery (COD)
5. **Click Pay Now**:
   - For COD: Directly creates order
   - For others: Calls backend to create Razorpay order
6. **Razorpay Checkout opens** with prefilled customer details
7. **Payment Success**:
   - Razorpay handler captures response
   - Frontend verifies payment with backend
   - Backend creates order in database
   - User navigated to order history
8. **Payment Failure**: Error message displayed, user can retry

### Code Example

```javascript
// Load Razorpay SDK
const isLoaded = await loadRazorpayScript();

// Create Razorpay order
const orderRes = await privateFetch(
  "https://agrigate-backend-drsi.onrender.com/api/payment/create-razorpay-order",
  {
    method: "POST",
    body: JSON.stringify({ amount: 100, currency: "INR" }),
  },
);

// Open Razorpay Checkout
const options = {
  key: import.meta.env.VITE_RAZORPAY_KEY_ID,
  amount: 10000, // in paise
  currency: "INR",
  order_id: orderData.id,
  handler: function (response) {
    // Verify payment with backend
    // Create order in database
  },
};

const rzp = new window.Razorpay(options);
rzp.open();
```

---

## Security Best Practices

✅ **DO:**

- Keep `RAZORPAY_KEY_SECRET` in backend `.env` only
- Use `VITE_RAZORPAY_KEY_ID` in frontend (public)
- Verify signatures on the backend
- Use HTTPS in production
- Validate amounts on backend before creating orders
- Store payment verification results in database

❌ **DON'T:**

- Expose `RAZORPAY_KEY_SECRET` in frontend code
- Trust client-side payment amounts
- Skip signature verification
- Store sensitive payment details
- Use test keys in production

---

## Testing

### Test Credentials

- **Mode**: Test Mode (Sandbox)
- **Key ID**: `rzp_test_XXXXXXXXXXXX`
- **Key Secret**: `xxxxxxxxxxxx`

### Test Cards

```
Success:
- Card Number: 4111 1111 1111 1111
- Expiry: Any future date
- CVV: Any 3 digits

Failure (to test rejection):
- Card Number: 4222 2222 2222 2200
```

### Test with UPI

- Success: Any UPI ID (e.g., `success@razorpay`)
- Failure: `fail@razorpay`

---

## Troubleshooting

### Issue: "Invalid Razorpay Key ID"

**Solution**: Ensure the key starts with `rzp_test_` or `rzp_live_` and is less than 40 characters.

### Issue: CORS errors when calling backend

**Solution**: Verify CORS is enabled in `Backend/server.js`:

```javascript
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
```

### Issue: "Payment verification failed"

**Solution**:

- Check that `RAZORPAY_KEY_SECRET` is correctly set in `.env`
- Verify all three fields (order_id, payment_id, signature) are passed

### Issue: Order not created after payment

**Solution**:

- Check Order schema accepts all required fields
- Verify consumer role is set correctly
- Check server console for specific error messages

---

## Production Deployment

### Switch to Live Keys

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/app/keys)
2. Toggle to **Live Mode**
3. Copy Live Mode credentials
4. Update `.env` files with live keys:
   ```
   RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXX
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxx
   ```

### Environment Setup

```
# Production .env
RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=your_live_secret
NODE_ENV=production
```

```
# Frontend .env
VITE_RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXX
```

### SSL/HTTPS

- Razorpay requires HTTPS in production
- Ensure your server has valid SSL certificate

---

## Support & Resources

- 📖 [Razorpay Documentation](https://razorpay.com/docs/)
- 🔧 [Razorpay API Reference](https://razorpay.com/docs/api/)
- 💬 [Razorpay Support](https://support.razorpay.com/)
- 🚀 [Razorpay GitHub Samples](https://github.com/razorpay/razorpay-node)

---

## Additional Notes

- Payment verification signature ensures the payment hasn't been tampered with
- All amounts are in INR (Indian Rupees) and stored in paise (1 INR = 100 paise)
- COD orders bypass Razorpay and are created directly
- Order history is stored in MongoDB with payment transaction ID
- Customer details are prefilled from user profile for smooth checkout experience
