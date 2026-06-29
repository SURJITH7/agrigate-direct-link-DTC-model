# Map Implementation Guide - Production Ready

## Overview

This implementation provides a complete nearest-farmer detection system with route navigation using Leaflet and OpenStreetMap.

---

## Components & Utilities

### 1. **Distance Utility** (`src/utils/distance.js`)

Provides three core functions:

- `getDistance(lat1, lon1, lat2, lon2)` - Calculate distance between two points using Haversine formula
- `findNearest(user, locations)` - Find single nearest location
- `findNearestMultiple(user, locations, limit)` - Find top N nearest locations

**Usage:**

```javascript
import {
  getDistance,
  findNearest,
  findNearestMultiple,
} from "../utils/distance";

const distance = getDistance(11.01, 77.02, 11.05, 77.08); // Returns km
const nearest = findNearest(userLocation, farmersList); // Returns nearest farmer with distance
const topFive = findNearestMultiple(userLocation, farmersList, 5); // Returns sorted array
```

---

### 2. **Location Tracker Hook** (`src/hooks/useLocationTracker.js`)

**Existing component - tracks user's real-time GPS position**

Returns: `{ location, error }`

---

### 3. **Farmer Locations Hook** (`src/hooks/useFarmerLocations.js`)

**NEW - Fetches farmers and calculates nearest ones**

```javascript
const { farmers, nearest, nearestSingle, loading, error } = useFarmerLocations(
  userLocation,
  limit,
);
```

**Returns:**

- `farmers` - All farmers with valid locations
- `nearest` - Array of top farmers sorted by distance
- `nearestSingle` - Single closest farmer
- `loading` - Fetch status
- `error` - Error message if any

**Usage:**

```javascript
import useFarmerLocations from "../hooks/useFarmerLocations";
import { useGeoLocation } from "../LocationContext";

function MyComponent() {
  const { location } = useGeoLocation();
  const { nearest, nearestSingle } = useFarmerLocations(location, 5);

  return (
    <div>
      <h3>Nearest Farmer: {nearestSingle?.fullName}</h3>
      <p>Distance: {nearestSingle?.distance.toFixed(2)} km</p>
    </div>
  );
}
```

---

### 4. **Farmer Map Component** (`src/components/FarmerMapView.jsx`)

**NEW - Complete map showing farmers and routing**

**Features:**

- Shows user's current location (blue marker)
- Shows all nearby farmers (green markers)
- Highlights nearest farmer (red marker)
- Click any farmer to show route (using Leaflet Routing Machine)
- Info panel with farmer details
- Distance display for all farmers

**Props:**

- `showRoutesCount` (default: 5) - Number of nearest farmers to display

**Usage:**

```javascript
import FarmerMapView from "../components/FarmerMapView";

function FreshProducts() {
  return (
    <div>
      <h2>Find Fresh Farmers</h2>
      <FarmerMapView showRoutesCount={5} />
    </div>
  );
}
```

---

### 5. **Backend Endpoints**

#### Get all farmers with locations (NEW)

```
GET /api/users/farmers/locations
```

Returns array of farmers with `latitude`, `longitude`, location name, etc.

#### Get users by role (NEW)

```
GET /api/users?role=farmer
```

Query parameters:

- `role` (required) - "farmer" or "consumer"

**Note:** For farmers, only returns users with valid coordinates.

#### Update user location (Existing)

```
PUT /api/users/location
Body: { latitude, longitude, name }
```

---

## Integration Steps

### Step 1: Install Dependencies

```bash
npm install leaflet-routing-machine
```

### Step 2: Use in Your Page

Replace your existing map code with:

```javascript
import FarmerMapView from "../components/FarmerMapView";
import { LocationProvider } from "../LocationContext";

function FreshProducts() {
  return (
    <LocationProvider>
      <div className="container mt-5">
        <h2>Find Fresh Products from Nearby Farmers</h2>
        <FarmerMapView showRoutesCount={5} />
      </div>
    </LocationProvider>
  );
}
```

### Step 3: Ensure Users Have Locations

When users register or update their profile:

1. Capture GPS coordinates
2. Send to backend via `/api/users/location` endpoint
3. Backend reverse geocodes to get location name

---

## Data Flow

```
User GPS (Browser)
  ↓
LocationProvider (React Context)
  ↓
useLocationTracker Hook (Real-time GPS)
  ↓
useFarmerLocations Hook (API call to get farmers)
  ↓
FarmerMapView Component (Display & Interaction)
  ↓
Leaflet Routing (Route calculation & display)
```

---

## Database Schema

**User Model:**

```javascript
{
  latitude: Number,
  longitude: Number,
  locationName: String,
  // ... other fields
}
```

All farmers and consumers should have these location fields populated.

---

## Features Breakdown

### Real-time Tracking

- Continuous GPS polling via `navigator.geolocation.watchPosition()`
- High accuracy enabled
- 5-second maximum cache age

### Distance Calculation

- Haversine formula for accurate distances
- Results in kilometers
- Handles edge cases (null/invalid coordinates)

### Farmer Discovery

- Fetch all farmers with valid coordinates
- Sort by distance to user
- Return top N (configurable)

### Route Navigation

- Uses OpenStreetMap routing
- Shows turn-by-turn directions
- Calculates travel distance & time
- Click farmer marker to activate route

### UI/UX

- Color-coded markers (blue=you, green=farmer, red=nearest)
- Tooltip on hover
- Info panel with farmer details
- Legend explaining marker colors
- Click-to-route functionality

---

## Performance Considerations

1. **Distance Calculation** - O(n) where n = number of farmers
2. **API Fetching** - Cached on first location acquired
3. **Map Rendering** - Efficient marker management with React
4. **Routing** - Only calculated on demand (when farmer selected)

For large datasets (1000+ farmers):

- Consider pagination or backend geo-queries
- Use MongoDB geospatial index:
  ```javascript
  // In farmer/user model migration
  db.users.createIndex({ location: "2dsphere" });
  ```

---

## Troubleshooting

### No farmers showing?

1. Check if farmers have valid `latitude` & `longitude` in DB
2. Verify user has GPS permission granted
3. Check browser console for errors
4. Test endpoint directly: `GET https://agrigate-backend-drsi.onrender.com/api/users?role=farmer`

### Routes not showing?

1. Ensure `leaflet-routing-machine` installed
2. Check CORS settings on backend
3. Verify OpenStreetMap API accessible

### GPS not working?

1. User must grant location permission
2. HTTPS required in production (browser policy)
3. Check `navigator.geolocation` availability

---

## API Examples

### Get nearby farmers (client-side):

```javascript
async function getNearbyFarmers(userLoc) {
  const res = await fetch("/api/users?role=farmer");
  const farmers = await res.json();
  return findNearestMultiple(userLoc, farmers, 5);
}
```

### Update user location:

```javascript
async function updateMyLocation(lat, lon, name) {
  await fetch("/api/users/location", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ latitude: lat, longitude: lon, name }),
  });
}
```

---

## Next Steps

1. **Geospatial DB Index** - Add MongoDB `2dsphere` index for better scaling
2. **Backend Filtering** - Move distance calculation to MongoDB for better performance
3. **Filters** - Add crop type, price, rating filters to farmer search
4. **Multi-stop Routes** - Show route optimization for multiple farmer pickups
5. **Real-time Updates** - Use WebSockets for live farmer location updates

---

## Testing

```javascript
// Test distance calculation
import { getDistance } from "../utils/distance";
const d = getDistance(11.01, 77.02, 11.05, 77.08);
console.log(d); // Should show ~5-6 km

// Test hook
import useFarmerLocations from "../hooks/useFarmerLocations";
const { nearest } = useFarmerLocations(
  { latitude: 11.01, longitude: 77.02 },
  5,
);
console.log(nearest); // Should show sorted farmers
```

---

## Support

For issues:

1. Check browser console for errors
2. Verify backend endpoints responding
3. Ensure location permission granted
4. Check farmer records have coordinates
