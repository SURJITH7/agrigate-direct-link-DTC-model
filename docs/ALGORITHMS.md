# Important Algorithms — AgriGate

This document collects concise algorithmic snippets used across the project, with small contracts and important edge-cases. Use these for documentation, tests, or copy/paste into other projects.

---

## 1) Orders grouping & per-farmer order creation (server-side)

Description

- Group cart items by farmerId and create one Order document per farmer. Validates farmerId and falls back to product lookup if missing.

Contract

- Inputs: { items: Array, amount, transactionId?, shippingDetails? } (POST /api/orders)
- Output: 201 { ok: true, created: [Order...] } where each order has products, farmerId, consumerId
- Errors: 400 when items missing; 500 for server/database errors

Core algorithm (trimmed):

```js
// Group items by farmerId
const byFarmer = {};
for (const it of items) {
  let fid = null;
  if (it.farmerId) {
    fid =
      typeof it.farmerId === "object"
        ? it.farmerId._id ||
          it.farmerId.id ||
          (it.farmerId.toString && it.farmerId.toString())
        : it.farmerId;
  } else if (it.farmer) {
    fid =
      typeof it.farmer === "object"
        ? it.farmer._id ||
          it.farmer.id ||
          (it.farmer.toString && it.farmer.toString())
        : it.farmer;
  }

  // product lookup fallback
  if (!fid && it._id) {
    const prod = await Product.findById(it._id).select("farmerId");
    if (prod && prod.farmerId) fid = prod.farmerId.toString();
  }

  if (!fid) {
    console.warn("Skipping item with no farmerId", it);
    continue;
  }
  const key = typeof fid === "string" ? fid : fid.toString();
  if (!mongoose.Types.ObjectId.isValid(key)) {
    console.warn("Invalid farmerId", key);
    continue;
  }
  byFarmer[key] = byFarmer[key] || [];
  byFarmer[key].push(it);
}

// Create an Order per farmer
const created = [];
for (const [farmerId, farmerItems] of Object.entries(byFarmer)) {
  const totalForFarmer = farmerItems.reduce(
    (s, p) => s + (p.price || 0) * (p.quantity || 1),
    0
  );
  const order = new Order({
    products: farmerItems.map((p) => ({
      name: p.name,
      quantity: p.quantity,
      price: p.price,
    })),
    status: "pending",
    customerName:
      shippingDetails?.name || (req.user && req.user.fullName) || "Customer",
    orderDate: new Date(),
    shippingAddress: shippingDetails?.address,
    totalEarnings: totalForFarmer,
    consumerId: req.user._id,
    farmerId: farmerId, // let Mongoose cast string -> ObjectId
  });
  await order.save();
  created.push(order);
}
```

Edge cases & notes

- Ensure frontend sends `farmerId` per cart item to avoid product lookups.
- Items without a valid farmerId are skipped and logged (important to report skipped items to consumer UX).
- Validate ObjectId with `mongoose.Types.ObjectId.isValid` before grouping.
- Race conditions: if multiple simultaneous checkouts affect the same product inventory, coordinate with transactions or stock locking.

---

## 2) Socket: live locations (server-side)

Description

- Socket.IO server accepts `sendLocation` events and broadcasts a `updateLocations` payload to all clients. If socket has an authenticated userId (via JWT in cookie), last-known coordinates are persisted to the User document.

Contract

- Input event: `sendLocation` { lat, lng }
- Broadcast event: `updateLocations` -> { [userKey]: { lat, lng, socketId, updatedAt } }
- Errors: gracefully log and ignore malformed payloads

Core algorithm (trimmed):

```js
const liveLocations = {};

io.use((socket, next) => {
  // optional JWT cookie extraction; set socket.userId when present
  const cookie = socket.handshake.headers.cookie || "";
  const match = cookie.match(/token=([^;]+)/);
  if (match) {
    const decoded = jwt.verify(match[1], process.env.JWT_SECRET);
    socket.userId = decoded.id;
  }
  next();
});

io.on("connection", (socket) => {
  socket.on("sendLocation", async (data) => {
    try {
      const { lat, lng } = data;
      const userKey = socket.userId || socket.id;
      liveLocations[userKey] = {
        lat,
        lng,
        socketId: socket.id,
        updatedAt: new Date(),
      };

      if (socket.userId) {
        await User.findByIdAndUpdate(socket.userId, {
          latitude: lat,
          longitude: lng,
        });
      }

      io.emit("updateLocations", liveLocations);
    } catch (err) {
      console.error("sendLocation handler error:", err);
    }
  });

  socket.on("disconnect", () => {
    // remove by socketId
    Object.keys(liveLocations).forEach((key) => {
      if (liveLocations[key].socketId === socket.id) delete liveLocations[key];
    });
    io.emit("updateLocations", liveLocations);
  });
});
```

Edge cases & notes

- JWT cookie parsing from handshake is best-effort; if missing, location is tracked under socket.id only.
- liveLocations is in-memory: not suitable for multi-server setups (use Redis adapter or store into DB & publish via pub/sub).
- Persisting every location update may produce heavy DB writes; consider batching/throttling when many updates occur.

---

## 3) Client: useLocationTracker hook (core tracking, throttling & accuracy)

Description

- Browser Geolocation watchPosition is used to update UI "myLocation" and (for farmers) call backend `PUT /api/users/location` to persist coordinates. The hook filters low-accuracy readings and throttles backend sends.

Contract

- Returns: { location, error }
- Acts: starts watchPosition when `user` exists; if `user.role === 'farmer'` sends location updates to backend (via provided `privateFetch`)

Core algorithm (trimmed):

```js
const ACCURACY_THRESHOLD = 100;
const UPDATE_INTERVAL = 10000; // ms

useEffect(() => {
  if (!user) return;
  if (!navigator.geolocation) {
    setError("Geolocation is not supported");
    return;
  }
  const watcherId = navigator.geolocation.watchPosition(
    async (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      if (accuracy > ACCURACY_THRESHOLD) return; // ignore
      const now = Date.now();
      if (now - lastUpdateTime.current < UPDATE_INTERVAL) return; // throttle
      lastUpdateTime.current = now;
      const locationName = await reverseGeocode(latitude, longitude);
      const newLocation = { latitude, longitude, name: locationName };
      setLocation(newLocation);
      if (user && user.role === "farmer") sendLocationToBackend(newLocation);
    },
    (err) => {
      /* set error messages */
    },
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 }
  );
  return () => navigator.geolocation.clearWatch(watcherId);
}, [user, sendLocationToBackend]);
```

Edge cases & notes

- Reverse geocoding (Nominatim) can fail or be rate-limited — provide a coordinate fallback for UI.
- Permissions denied: provide clear UX with instructions.
- Throttle interval should balance freshness vs. DB/write cost; for live driver UI a smaller interval is ok, for persistent DB writes prefer 10+ seconds.

---

## 4) Client: LiveMap rendering & centering (react-leaflet)

Description

- Listens for `updateLocations` socket events, renders markers for live locations, centers on `myLocation` or a `target` passed via URL params, and draws a highlighted circle for the user location.

Contract

- Inputs: socket `updateLocations` -> object map; `myLocation` from hook; optional URL params `lat/lng/label` for a target.
- Output: visual map with markers, popup labels, and centering.

Core algorithm (trimmed):

```jsx
const socket = io('https://agrigate-backend-drsi.onrender.com', { withCredentials: true });
useEffect(() => { socket.on('updateLocations', data => setLocations(data || {})); return () => socket.off('updateLocations'); }, []);

// Centering helper component
function CenterOnLocation({ pos }) { const map = useMap(); useEffect(() => { if (pos) map.setView([pos.latitude, pos.longitude], 15, { animate: true }); }, [pos, map]); return null; }

// Render
<MapContainer center={[11.0168,76.9558]} zoom={13}>
  <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
  { target ? <CenterOnLocation pos={target} /> : (myLocation && <CenterOnLocation pos={myLocation} />) }
  { myLocation && <Marker position={[myLocation.latitude, myLocation.longitude]}><Popup>You are here</Popup></Marker> }
  <Circle center={[myLocation.latitude, myLocation.longitude]} radius={40} .../>
  { Object.entries(locations).map(([key, loc]) => <Marker key={key} position={[loc.lat, loc.lng]}><Popup>{`User: ${key}`}</Popup></Marker>) }
</MapContainer>
```

Edge cases & notes

- Leaflet marker assets need to be configured for Vite (icon paths) — ensure `L.Icon.Default.mergeOptions` is set.
- Very frequent updates can make the map jitter; consider smoothing (interpolation) or update throttling in the client.
- For targeting a specific farmer location pass `lat`/`lng` in the product "View in App Map" link to use the `target` flow.

---

## 5) Client: Cart persistence per-user (localStorage pattern)

Description

- Cart is stored in component state and persisted in `localStorage` keyed by the logged-in user id: `cart_<user._id>`.

Contract

- Reads from localStorage on load; writes after any change. Works only when logged-in user exists (consumer role assumed).

Core patterns (trimmed):

```js
// Save
const cartKey = `cart_${user._id}`;
localStorage.setItem(cartKey, JSON.stringify(cart));

// Load (on App start)
const saved = localStorage.getItem(`cart_${user._id}`);
if (saved) setCart(JSON.parse(saved));

// Per-action example: increment quantity
setCart((prev) => {
  const updated = prev.map((item) =>
    item._id === id ? { ...item, quantity: item.quantity + 1 } : item
  );
  if (user) localStorage.setItem(`cart_${user._id}`, JSON.stringify(updated));
  return updated;
});
```

Edge cases & notes

- If user logs out/in as different user, make sure to switch cartKey and not mix carts.
- Strongly recommend ensuring `farmerId` is included when adding an item; otherwise server will perform product lookup and may fail.
- localStorage size limits are small; for large carts consider persisting to backend for cross-device sync.

---

## Where to find the original implementations

- Orders grouping: `Backend/routes/orders.js`
- Socket handlers: `Backend/server.js`
- Hook: `Frontend/src/components/useLocationTracker.js`
- Live map: `Frontend/src/components/LiveMap.jsx`
- Cart: `Frontend/src/components/Cart.jsx`

---

If you want, I can:

- Save these as a markdown file in the repo (already done if you chose to save),
- Add unit tests for the order grouping algorithm (I can make a minimal test harness with Jest),
- Patch the frontend add-to-cart flow to always include `farmerId` in cart items (recommended),
- Add a short `Try it` section with recommended endpoint calls to validate the behaviors.
