# Razorpay Integration - Testing Guide

## Quick Start Testing

### Prerequisites

1. Backend running: `npm run dev` (from root directory)
2. Frontend running: `npm run dev` (from Frontend directory)
3. Both on localhost (Backend: 5000, Frontend: 5173)
4. Logged in as a consumer user

---

## Step 1: Test Order Creation API

### Using cURL

```bash
# Replace TOKEN with your JWT token from login
curl -X POST https://agrigate-backend-drsi.onrender.com/api/payment/create-razorpay-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 500,
    "currency": "INR",
    "description": "Test Order"
  }'
```

### Expected Response

```json
{
  "id": "order_XXXXXXXXXXXX",
  "amount": 50000,
  "currency": "INR",
  "status": "created",
  "receipt": "rcpt_XXXXXXXXXXXX"
}
```

### Using Postman

1. Create new POST request to `https://agrigate-backend-drsi.onrender.com/api/payment/create-razorpay-order`
2. Headers tab:
   - Key: `Authorization`
   - Value: `Bearer YOUR_JWT_TOKEN`
   - Key: `Content-Type`
   - Value: `application/json`
3. Body (raw JSON):
   ```json
   {
     "amount": 500,
     "currency": "INR",
     "description": "Test Payment"
   }
   ```
4. Click Send

---

## Step 2: Test Payment Verification API

### Using cURL

```bash
curl -X POST https://agrigate-backend-drsi.onrender.com/api/payment/verify-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "razorpay_order_id": "order_XXXXXXXXXXXX",
    "razorpay_payment_id": "pay_XXXXXXXXXXXX",
    "razorpay_signature": "signature_hash"
  }'
```

### Expected Response (on successful verification)

```json
{
  "verified": true,
  "message": "Payment verified successfully",
  "payment_id": "pay_XXXXXXXXXXXX",
  "order_id": "order_XXXXXXXXXXXX"
}
```

---

## Step 3: Integration Testing (Frontend)

### Test Checkout Flow

1. **Add items to cart**
   - Navigate to Products page
   - Click "Add to Cart" on 2-3 items
   - Cart icon shows item count

2. **Go to Checkout**
   - Click on cart icon or navigate to checkout
   - Verify cart items displayed with correct prices

3. **Fill Payment Details**
   - Name: `Test User`
   - Email: `test@example.com`
   - Phone: `9999999999`
   - Billing Address: `Test Address`
   - Uncheck "Ship to Different Address" for first test

4. **Select Payment Method**
   - Try each option (Card, UPI, Net Banking, Wallets, COD)
   - **For testing, use "Card" first**

5. **Click Pay Now**
   - Razorpay checkout modal should open
   - Verify prefilled details (name, email, phone)

6. **Complete Test Payment**
   - Card Number: `4111 1111 1111 1111`
   - Expiry: Any future date (e.g., `12/25`)
   - CVV: Any 3 digits (e.g., `123`)
   - OTP: `123456` (if prompted)

7. **Verify Success**
   - Receipt displayed with transaction ID
   - Check browser console for successful verification
   - Navigate to order history to confirm order created

---

## Step 4: Test Different Scenarios

### Scenario 1: Successful Card Payment

- Use test card: `4111 1111 1111 1111`
- Expected: ✅ Payment success, order created

### Scenario 2: Failed Payment

- Use test card: `4222 2222 2222 2200`
- Expected: ❌ Payment failed error message

### Scenario 3: Cash on Delivery

- Select "Cash on Delivery" payment method
- Click Pay Now
- Expected: ✅ Order created directly without Razorpay

### Scenario 4: UPI Payment

- Select "UPI" payment method
- Click Pay Now
- Razorpay opens with UPI option
- Use `success@razorpay` for test success
- Expected: ✅ Payment success via UPI

### Scenario 5: Closed Checkout Modal

- Click Pay Now
- Immediately close Razorpay modal (X button)
- Expected: ❌ "Payment popup closed by user" error

### Scenario 6: Multiple Items & Coupon

- Add multiple items to cart
- Apply coupon "SAVE10" for 10% discount
- Complete payment with card
- Expected: ✅ Discount reflected in order total

---

## Step 5: Server Logs Verification

### Check Backend Logs

While testing, monitor console output for:

```
✅ Successful Order Creation:
Order created: order_XXXXXXXXXXXX

✅ Successful Verification:
Payment verified: pay_XXXXXXXXXXXX

❌ Errors:
Error creating Razorpay order: [error message]
Error verifying payment: [error message]
```

### Check Browser Console

Open DevTools (F12) and check:

1. Network tab: All API calls to `/api/payment/*` should return 200-201
2. Console tab: Should show successful payment ID logs
3. No CORS or auth errors

---

## Step 6: Database Verification

### Check Orders in MongoDB

```javascript
// Using MongoDB Compass or mongo shell
db.orders.findOne({
  paymentMethod: "razorpay"
});

// Should return:
{
  _id: ObjectId,
  consumerId: ObjectId,
  items: [ /* cart items */ ],
  amount: 500,
  paymentStatus: "completed",
  transactionId: "pay_XXXXXXXXXXXX",
  // ... other fields
}
```

---

## Common Issues & Solutions

### Issue 1: "Razorpay SDK failed to load"

- **Check**: Browser has internet connection
- **Check**: No browser extensions blocking scripts
- **Solution**: Clear browser cache and reload

### Issue 2: CORS Error on payment creation

- **Check**: Backend CORS configuration
- **Fix**: Ensure `origin: "http://localhost:5173"` in `server.js`

### Issue 3: "Network error on payment verification"

- **Check**: Backend is running
- **Check**: JWT token is valid
- **Try**: Logout and login again to refresh token

### Issue 4: Payment succeeds but order not creating

- **Check**: Order route is using correct role (consumer)
- **Check**: MongoDB connection is working
- **Check**: Order schema matches payload structure

### Issue 5: "Invalid Razorpay Key ID"

- **Check**: Key ID starts with `rzp_test_` (test mode) or `rzp_live_` (production)
- **Remove**: Any leading/trailing whitespace from .env
- **Restart**: Backend server after .env changes

---

## Test Checklist

- [ ] Backend can create Razorpay order
- [ ] Frontend loads Razorpay SDK without errors
- [ ] Checkout modal opens with correct styling
- [ ] Prefilled user details display correctly
- [ ] All payment methods load in Razorpay modal
- [ ] Test card payment succeeds
- [ ] Payment verification works
- [ ] Order created in database after payment
- [ ] User navigated to order history
- [ ] Receipt contains correct transaction ID
- [ ] Cart cleared after successful payment
- [ ] Error handling works for failed payments
- [ ] COD creates order without Razorpay

---

## Performance Testing

### Load Time

- Page load: < 2 seconds
- Razorpay modal open: < 1 second (first load may take longer)
- Payment verification: < 2 seconds

### Test with Network Throttling

1. Open DevTools
2. Network tab → Throttling dropdown
3. Select "Slow 3G"
4. Test checkout flow
5. Verify user-friendly error messages on timeouts

---

## Security Testing

✅ Test these security aspects:

1. **CSRF Protection**
   - Token refreshes after login

2. **Authentication**
   - Unauthenticated users cannot create orders
   - Try accessing without JWT token → Should get 401

3. **Authorization**
   - Farmers cannot access consumer payment endpoints
   - Try as farmer user → Should get 403

4. **Signature Verification**
   - Tampered signatures rejected
   - Try modifying `razorpay_signature` → Should fail verification

5. **Amount Validation**
   - Negative amounts rejected
   - Zero amounts rejected
   - Invalid currency rejected

---

## Production Readiness Checklist

Before deploying to production:

- [ ] Switch to Razorpay Live keys
- [ ] Update VITE_RAZORPAY_KEY_ID to live key
- [ ] Remove test data from database
- [ ] Enable HTTPS
- [ ] Update CORS origin to production URL
- [ ] Test with real payment methods
- [ ] Set up monitoring/logging
- [ ] Backup database regularly
- [ ] Document all environment variables
- [ ] Create runbook for production issues

---

## Support

For issues:

1. Check error message in browser console
2. Check backend logs for API errors
3. Verify JWT token is valid
4. Check Razorpay Dashboard for payment records
5. Refer to [Razorpay Integration Guide](./RAZORPAY_INTEGRATION.md)
