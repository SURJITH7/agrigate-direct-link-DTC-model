import React, { useState } from "react";
import LiveMap from "./LiveMap";
import { useGeoLocation } from "./LocationContext";

const MyLocationView = () => {
  const { location, error, setManualLocation, isManual } = useGeoLocation();
  const [address, setAddress] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleManualSearch = async (e) => {
    e.preventDefault();
    if (!address.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          address,
        )}&format=json&limit=1`,
      );
      const data = await response.json();
      if (data && data.length > 0) {
        if (typeof setManualLocation === "function") {
          setManualLocation({
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon),
            accuracy: 100, // Arbitrary accuracy for manual location
            name: address,
          });
        } else {
          console.error(
            "setManualLocation is missing. Check your LocationProvider!",
          );
        }
      } else {
        alert("Location not found. Please try a different query.");
      }
    } catch (err) {
      console.error("Geocoding failed:", err);
      alert("Failed to fetch location. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="container mt-4">
      <h2>My Location</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card p-3 shadow-sm mb-4">
        <form onSubmit={handleManualSearch} className="d-flex gap-2">
          <input
            type="text"
            className="form-control"
            placeholder="Enter location manually (e.g., Chennai, TN)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSearching}
          >
            {isSearching ? "Searching..." : "Set Location"}
          </button>
          {isManual && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                if (typeof setManualLocation === "function")
                  setManualLocation(null);
                setAddress("");
              }}
            >
              Use Real-time
            </button>
          )}
        </form>
      </div>

      <div className="card p-3 shadow-sm">
        <LiveMap />
        {location && (
          <div className="mt-3">
            <p>
              <strong>Latitude:</strong> {location.latitude}
            </p>
            <p>
              <strong>Longitude:</strong> {location.longitude}
            </p>
            {location.accuracy && (
              <p>
                <strong>Accuracy:</strong> {Math.round(location.accuracy)}{" "}
                meters
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyLocationView;
