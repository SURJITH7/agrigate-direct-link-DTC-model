# Quick Start - Testing the Location Map Fix

## Step 1: Restart Both Servers

### Terminal 1 - Backend (Port 5000)

```bash
cd c:\Users\sanja\OneDrive\Desktop\AgriGate
npm run dev
```

### Terminal 2 - Frontend (Port 5173)

```bash
cd c:\Users\sanja\OneDrive\Desktop\AgriGate\Frontend
npm run dev
```

---

## Step 2: Clear Browser State

1. Open DevTools (F12)
2. Go to Application → Cookies
3. Delete all cookies from `localhost:5173` and `localhost:5000`
4. Refresh the page

---

## Step 3: Test Login Flow

1. Navigate to `http://localhost:5173`
2. Click "Login" (or go to login page)
3. Use a farmer or consumer account credentials
4. Should see dashboard without 401 errors

---

## Step 4: Test Location Map

1. From farmer dashboard, click on the map page
2. Browser should prompt for location permission
3. **Grant permission** when prompted
4. Your location should appear as a marker on the map
5. Check browser console (F12) - should see location updates with no 401 errors

---

## Step 5: Verify Network Requests

1. Open DevTools → Network tab
2. Filter by "profile" or "location"
3. Verify responses:
   - `/api/users/profile` should be **200 OK**
   - `/api/users/location` should be **200 OK** (for farmers)
   - Both should have a **token** cookie in the request

---

## Common Issues & Solutions

### Issue: Still getting 401 errors

**Solution:**

- Restart both servers completely
- Clear cookies again
- Make sure `.env` file has `JWT_SECRET` set

### Issue: Location permission not prompted

**Solution:**

- Grant location permission in browser settings
- Or use Chrome DevTools to simulate location (F12 → ⋮ → More tools → Sensors)

### Issue: Map doesn't show my location marker

**Solution:**

- Check browser console for geolocation errors
- Ensure you're logged in as a farmer (consumers don't send location to backend)
- Wait 10 seconds for first location update

---

## Debug Commands

### Check if backend is running

```bash
curl -X GET https://agrigate-backend-drsi.onrender.com/
```

Should return: "Server is running"

### Test profile endpoint (replace TOKEN with actual cookie)

```bash
curl -X GET https://agrigate-backend-drsi.onrender.com/api/users/profile \
  -H "Cookie: token=YOUR_TOKEN_HERE"
```

### Check JWT_SECRET in .env

```bash
cat c:\Users\sanja\OneDrive\Desktop\AgriGate\.env | grep JWT_SECRET
```

---

## What Was Fixed

✅ Cookie `sameSite` setting - now uses "lax" in development
✅ Profile fetch headers - now includes Content-Type
✅ Logout cookie configuration - consistent with login
✅ Error handling - better debugging messages in location tracker

**Result:** Authentication persists correctly across page reloads, location tracking can initialize properly, and real-time location updates work without 401 errors.
