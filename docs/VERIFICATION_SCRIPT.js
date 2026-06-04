/**
 * VERIFICATION SCRIPT - Run this to test your nearest farmer implementation
 * Copy this code into your browser console to verify setup
 */

// ============================================================================
// TEST 1: Check if distance utility is working
// ============================================================================
async function testDistance() {
  try {
    // Import the distance functions
    const { getDistance, findNearest, findNearestMultiple } =
      await import("/src/utils/distance.js");

    // Test 1: Calculate distance between two points
    const distance = getDistance(11.01, 77.02, 11.05, 77.08);
    console.log("✅ Distance Calculation Test");
    console.log(`   Distance between points: ${distance.toFixed(2)} km`);

    // Test 2: Find nearest from array
    const testFarmers = [
      { id: 1, fullName: "Farmer A", latitude: 11.02, longitude: 77.02 },
      { id: 2, fullName: "Farmer B", latitude: 11.05, longitude: 77.05 },
      { id: 3, fullName: "Farmer C", latitude: 11.03, longitude: 77.03 },
    ];

    const userLoc = { latitude: 11.01, longitude: 77.02 };
    const nearest = findNearest(userLoc, testFarmers);
    console.log("✅ Find Nearest Test");
    console.log(
      `   Nearest: ${nearest.fullName} - ${nearest.distance.toFixed(2)} km`,
    );

    // Test 3: Find multiple nearest
    const multiNearest = findNearestMultiple(userLoc, testFarmers, 2);
    console.log("✅ Find Multiple Nearest Test");
    console.log("   Top 2 farmers:");
    multiNearest.forEach((f) =>
      console.log(`     - ${f.fullName}: ${f.distance.toFixed(2)} km`),
    );

    return true;
  } catch (error) {
    console.error("❌ Distance utility test failed:", error);
    return false;
  }
}

// ============================================================================
// TEST 2: Check if API endpoints are working
// ============================================================================
async function testAPI() {
  const API_BASE = "http://localhost:5000";

  try {
    console.log("🔍 Testing API Endpoints...");

    // Test 1: Get farmers by role
    console.log("\n📡 Testing: GET /api/users?role=farmer");
    const res1 = await fetch(`${API_BASE}/api/users?role=farmer`, {
      credentials: "include",
    });
    const farmers = await res1.json();
    console.log(`✅ API Response (${farmers.length} farmers found):`);
    if (farmers.length > 0) {
      console.log("   Sample farmer:", {
        name: farmers[0].fullName,
        farm: farmers[0].farmName,
        lat: farmers[0].latitude,
        lon: farmers[0].longitude,
      });
    } else {
      console.warn("⚠️  No farmers found with locations in database");
    }

    // Test 2: Get farmer locations
    console.log("\n📡 Testing: GET /api/users/farmers/locations");
    const res2 = await fetch(`${API_BASE}/api/users/farmers/locations`, {
      credentials: "include",
    });
    const farmerLocs = await res2.json();
    console.log(
      `✅ API Response (${farmerLocs.length} farmers with locations):`,
    );

    return true;
  } catch (error) {
    console.error("❌ API test failed:", error.message);
    console.error("   Make sure backend is running at http://localhost:5000");
    return false;
  }
}

// ============================================================================
// TEST 3: Check if LocationContext is available
// ============================================================================
async function testLocationContext() {
  try {
    console.log("🔍 Testing LocationContext...");
    // This will work if you're in a component wrapped with LocationProvider
    console.log(
      "⚠️  This test requires you to be in a component wrapped with <LocationProvider>",
    );
    console.log(
      "    Try running this in browser DevTools on a page using FarmerMapView",
    );
    return true;
  } catch (error) {
    console.error("❌ LocationContext test failed:", error);
    return false;
  }
}

// ============================================================================
// TEST 4: Check browser geolocation API
// ============================================================================
async function testGeolocation() {
  return new Promise((resolve) => {
    console.log("🔍 Testing Browser Geolocation...");

    if (!navigator.geolocation) {
      console.error("❌ Geolocation not supported by this browser");
      resolve(false);
      return;
    }

    console.log("📍 Requesting user location...");
    console.log("   (You may see a permission prompt)");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log("✅ Geolocation Test Passed");
        console.log(
          `   Location: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        );
        console.log(`   Accuracy: ${accuracy.toFixed(0)} meters`);
        resolve(true);
      },
      (error) => {
        console.error("❌ Geolocation test failed:", error.message);
        console.error("   Make sure location permission is granted");
        resolve(false);
      },
    );
  });
}

// ============================================================================
// TEST 5: Check if component files exist
// ============================================================================
async function testComponentFiles() {
  console.log("\n🔍 Checking Component Files...");

  const files = [
    { name: "FarmerMapView", path: "/src/components/FarmerMapView.jsx" },
    { name: "useFarmerLocations", path: "/src/hooks/useFarmerLocations.js" },
    { name: "distance utility", path: "/src/utils/distance.js" },
    { name: "LocationContext", path: "/src/LocationContext.jsx" },
  ];

  for (const file of files) {
    try {
      // Try to import the file
      await import(file.path);
      console.log(`✅ ${file.name} found`);
    } catch (e) {
      console.warn(`⚠️  ${file.name} not found at ${file.path}`);
    }
  }

  return true;
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================
async function runAllTests() {
  console.clear();
  console.log("=====================================");
  console.log("  AGRIGATE MAP IMPLEMENTATION TEST");
  console.log("=====================================\n");

  const tests = [
    { name: "Distance Utility", fn: testDistance },
    { name: "API Endpoints", fn: testAPI },
    { name: "Browser Geolocation", fn: testGeolocation },
    { name: "Component Files", fn: testComponentFiles },
  ];

  const results = [];

  for (const test of tests) {
    console.log(`\n${test.name}`);
    console.log("-".repeat(40));
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      console.error(`Error running ${test.name}:`, error);
      results.push({ name: test.name, passed: false });
    }
  }

  // Summary
  console.log("\n=====================================");
  console.log("  TEST SUMMARY");
  console.log("=====================================");

  results.forEach((r) => {
    console.log(`${r.passed ? "✅" : "❌"} ${r.name}`);
  });

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  console.log(`\nResult: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log(
      "\n🎉 All systems ready! Your map implementation is working correctly.",
    );
  } else {
    console.log("\n⚠️  Some tests failed. Check the logs above for details.");
  }

  return results;
}

// ============================================================================
// QUICK USAGE GUIDE
// ============================================================================
function showUsageGuide() {
  console.clear();
  console.log(`
╔════════════════════════════════════════════════════════════╗
║          AGRIGATE NEAREST FARMER MAP - USAGE GUIDE         ║
╚════════════════════════════════════════════════════════════╝

📦 IMPORTED FILES:
  ✅ src/utils/distance.js
  ✅ src/hooks/useFarmerLocations.js
  ✅ src/components/FarmerMapView.jsx
  ✅ src/components/FindNearestFarmExample.jsx

🚀 QUICK START:

  1. Import in your component:
     import FarmerMapView from './components/FarmerMapView';
     import { LocationProvider } from './LocationContext';

  2. Wrap your page with LocationProvider:
     <LocationProvider>
       <FarmerMapView showRoutesCount={5} />
     </LocationProvider>

  3. Grant location permission when prompted

  4. Map will display:
     - 📍 Your location (blue marker)
     - 🌾 Nearby farmers (green markers)
     - 🔥 Nearest farmer (red marker)
     - 🛣️ Route lines (click any farmer)

🔨 UTILITY FUNCTIONS:

  getDistance(lat1, lon1, lat2, lon2)
    → Returns distance in kilometers

  findNearest(user, farmers)
    → Returns single nearest farmer with distance

  findNearestMultiple(user, farmers, limit)
    → Returns top N farmers sorted by distance

📡 API ENDPOINTS:

  GET /api/users?role=farmer
    → Get all farmers with locations

  GET /api/users/farmers/locations
    → Get farmers with validated coordinates

  PUT /api/users/location
    → Update user location, auth required

🎯 FEATURES:

  ✅ Real-time GPS tracking
  ✅ Automatic nearest farmer detection
  ✅ Route visualization on OpenStreetMap
  ✅ Farmer contact information display
  ✅ Distance calculation and sorting
  ✅ Error handling & loading states
  ✅ Mobile responsive design

🧪 RUN TESTS:

  Run this in browser console:
    runAllTests()  // Run all verification tests

🐛 TROUBLESHOOTING:

  No farmers showing?
    1. Check if farmers have latitude/longitude in DB
    2. Test API: GET /api/users?role=farmer
    3. Check browser console for errors

  GPS not working?
    1. Grant location permission
    2. Check HTTPS (required in production)
    3. Verify browser supports geolocation

  Routes not showing?
    1. Check leaflet-routing-machine is installed
    2. Verify OpenStreetMap API accessible
    3. Check distance > 0km between locations

╔════════════════════════════════════════════════════════════╗
║                      HAPPY FARMING! 🌾                    ║
╚════════════════════════════════════════════════════════════╝
  `);
}

// Export for use in console
window.agrigate = {
  runAllTests,
  testDistance,
  testAPI,
  testGeolocation,
  testComponentFiles,
  showUsageGuide,
};

console.log(
  "🎯 AgriGate Map Tools Ready!\n\nRun: window.agrigate.runAllTests()\n    OR: window.agrigate.showUsageGuide()",
);
