import React from "react";
import FarmerMapView from "./FarmerMapView";
import { LocationProvider } from "../LocationContext";

/**
 * Example: Finding Nearest Farmers
 *
 * This component demonstrates how to use the FarmerMapView to show:
 * 1. User's current GPS location
 * 2. All nearby farmers with valid locations
 * 3. Nearest farmer highlighted
 * 4. Route to any selected farmer
 *
 * To use in your app:
 * 1. Wrap the page with LocationProvider
 * 2. Import and use FarmerMapView
 * 3. Ensure farmers have latitude/longitude in database
 */

function FindNearestFarmExample() {
  return (
    <LocationProvider>
      <div className="container-fluid py-5">
        <div className="row mb-4">
          <div className="col-md-12">
            <h1 className="mb-2">🌾 Find Fresh Products from Nearby Farmers</h1>
            <p className="text-muted">
              Discover the nearest farmers around you and view routes to their
              farms
            </p>
          </div>
        </div>

        {/* Main Map Section */}
        <div className="row">
          <div className="col-md-12">
            <div className="card shadow-sm">
              <div className="card-body">
                <FarmerMapView showRoutesCount={5} />
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="row mt-5">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">How It Works</h5>
              </div>
              <div className="card-body">
                <ul className="list-unstyled">
                  <li className="mb-3">
                    <strong>📍 Blue Marker</strong> - Your current location
                  </li>
                  <li className="mb-3">
                    <strong>🌾 Green Markers</strong> - Nearby farmers
                  </li>
                  <li className="mb-3">
                    <strong>🔥 Red Marker</strong> - Nearest farmer (closest)
                  </li>
                  <li className="mb-3">
                    <strong>🛣️ Click Marker</strong> - View route to that farmer
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">Features</h5>
              </div>
              <div className="card-body">
                <ul className="list-unstyled">
                  <li className="mb-3">
                    ✅ Real-time GPS tracking (high accuracy)
                  </li>
                  <li className="mb-3">
                    ✅ Automatic farmer distance calculation
                  </li>
                  <li className="mb-3">
                    ✅ Route navigation using OpenStreetMap
                  </li>
                  <li className="mb-3">✅ Sorted list of nearby farmers</li>
                  <li className="mb-3">
                    ✅ Farmer contact details & farm info
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="row mt-5">
          <div className="col-md-12">
            <div className="card bg-light">
              <div className="card-header">
                <h5 className="mb-0">📝 Usage Instructions</h5>
              </div>
              <div className="card-body">
                <ol>
                  <li className="mb-2">
                    <strong>Grant Location Permission</strong> - Browser will
                    ask for GPS access
                  </li>
                  <li className="mb-2">
                    <strong>Map loads</strong> - Shows your location and nearby
                    farmers
                  </li>
                  <li className="mb-2">
                    <strong>Click any farmer marker</strong> - Shows route to
                    that farm
                  </li>
                  <li className="mb-2">
                    <strong>Use sidebar</strong> - Click farmer name to select
                    route
                  </li>
                  <li className="mb-2">
                    <strong>View details</strong> - Hover over markers for
                    farmer info
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LocationProvider>
  );
}

export default FindNearestFarmExample;
