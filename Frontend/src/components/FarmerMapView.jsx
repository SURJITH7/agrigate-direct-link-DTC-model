import React, { useMemo, useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";
import { useGeoLocation } from "../LocationContext";
import useFarmerLocations from "../hooks/useFarmerLocations";
import { getDistance } from "../utils/distance";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import L from "leaflet";
import "leaflet-routing-machine";

// Fix for default marker icon issues
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Custom icon for farmers
const farmerIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-green.png",
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Custom icon for nearest farmer
const nearestIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-red.png",
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

/**
 * MapContent - Inner component that uses useMap hook
 * Separated to access map instance properly
 */
function MapContent({
  location,
  farmers,
  nearestSingle,
  selectedFarmer,
  onFarmerClick,
}) {
  const map = useMap();
  const routingControlRef = useRef(null);

  // Handle routing when farmer is selected
  useEffect(() => {
    if (!selectedFarmer || !location) {
      // Remove routing if exists
      if (routingControlRef.current) {
        try {
          map.removeControl(routingControlRef.current);
        } catch (e) {
          console.error("Error removing routing control:", e);
        }
        routingControlRef.current = null;
      }
      return;
    }

    // Remove existing routing
    if (routingControlRef.current) {
      try {
        map.removeControl(routingControlRef.current);
      } catch (e) {
        console.error("Error removing routing control:", e);
      }
    }

    // Add new routing
    try {
      const routing = L.Routing.control({
        waypoints: [
          L.latLng(location.latitude, location.longitude),
          L.latLng(selectedFarmer.latitude, selectedFarmer.longitude),
        ],
        routeWhileDragging: false,
        show: true,
        lineOptions: {
          styles: [{ color: "#1abc9c", opacity: 0.7, weight: 4 }],
        },
        createMarker: () => null, // Don't create markers for waypoints
      }).addTo(map);

      routingControlRef.current = routing;
    } catch (err) {
      console.error("Routing error:", err);
    }

    return () => {
      if (routingControlRef.current) {
        try {
          map.removeControl(routingControlRef.current);
        } catch (e) {
          console.error("Error removing routing control:", e);
        }
        routingControlRef.current = null;
      }
    };
  }, [selectedFarmer, location, map]);

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* User Location Marker */}
      <Marker
        position={[location.latitude, location.longitude]}
        icon={DefaultIcon}
      >
        <Popup>
          <div>
            <strong>Your Location</strong>
            <br />
            Accuracy: {Math.round(location.accuracy || 0)} meters
          </div>
        </Popup>
        <Tooltip direction="top" offset={[0, -10]}>
          You are here
        </Tooltip>
      </Marker>

      {/* Farmers Markers */}
      {farmers.map((farmer, idx) => {
        const isNearest =
          nearestSingle?.id === farmer.id || nearestSingle?._id === farmer._id;
        const distance = getDistance(
          location.latitude,
          location.longitude,
          farmer.latitude,
          farmer.longitude,
        );
        const markerIcon = isNearest ? nearestIcon : farmerIcon;

        return (
          <Marker
            key={farmer._id || idx}
            position={[farmer.latitude, farmer.longitude]}
            icon={markerIcon}
            eventHandlers={{
              click: () => onFarmerClick(farmer),
            }}
          >
            <Popup>
              <div style={{ minWidth: "150px" }}>
                <strong>{farmer.fullName}</strong>
                <br />
                <small>{farmer.farmName}</small>
                <br />
                <small>📍 {farmer.locationName || "Location"}</small>
                <br />
                <strong className={isNearest ? "text-danger" : "text-success"}>
                  {distance.toFixed(2)} km
                  {isNearest && " 🔥 NEAREST"}
                </strong>
                <br />
                {farmer.phone && <small>📞 {farmer.phone}</small>}
                <br />
                <button
                  className="btn btn-sm btn-primary mt-2 w-100"
                  onClick={() => onFarmerClick(farmer)}
                  style={{ fontSize: "0.75rem" }}
                >
                  {selectedFarmer?._id === farmer._id
                    ? "Route Active"
                    : "Show Route"}
                </button>
              </div>
            </Popup>
            <Tooltip direction="top" offset={[0, -10]}>
              {farmer.fullName} ({distance.toFixed(1)} km)
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
}

/**
 * FarmerMapView - Main component for displaying nearest farmers
 * Shows user location, nearby farmers, and route navigation
 */
function FarmerMapView({ showRoutesCount = 5 }) {
  const { location } = useGeoLocation();
  const { farmers, nearest, nearestSingle, loading } = useFarmerLocations(
    location,
    showRoutesCount,
  );
  const [selectedFarmer, setSelectedFarmer] = useState(null);

  // Map center
  const center = useMemo(() => {
    if (location) return [location.latitude, location.longitude];
    return [51.505, -0.09]; // Default fallback
  }, [location]);

  if (!location) {
    return (
      <div
        className="d-flex justify-content-center align-items-center bg-light"
        style={{ height: "600px", borderRadius: "12px" }}
      >
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading location...</span>
        </div>
        <span className="ms-3">Acquiring GPS signal...</span>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <MapContainer
        center={center}
        zoom={14}
        style={{
          height: "600px",
          width: "100%",
          borderRadius: "12px",
          zIndex: 1,
        }}
      >
        <MapContent
          location={location}
          farmers={farmers}
          nearestSingle={nearestSingle}
          selectedFarmer={selectedFarmer}
          onFarmerClick={setSelectedFarmer}
        />
      </MapContainer>

      {/* Info Panel */}
      <div className="mt-3 p-3 bg-light rounded">
        <div className="row">
          <div className="col-md-6">
            <h6>📍 Nearest Farmer</h6>
            {loading ? (
              <p className="text-muted">Loading farmers...</p>
            ) : nearestSingle ? (
              <div>
                <p className="mb-1">
                  <strong>{nearestSingle.fullName}</strong>
                </p>
                <p className="mb-1">
                  <small>{nearestSingle.farmName}</small>
                </p>
                <p className="mb-2">
                  <strong className="text-danger">
                    {nearestSingle.distance.toFixed(2)} km away
                  </strong>
                </p>
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => setSelectedFarmer(nearestSingle)}
                >
                  {selectedFarmer?._id === nearestSingle._id
                    ? "Route Shown"
                    : "Show Route"}
                </button>
              </div>
            ) : (
              <p className="text-muted">No farmers found nearby</p>
            )}
          </div>

          <div className="col-md-6">
            <h6>🌾 Nearby Farmers ({nearest.length})</h6>
            <div style={{ maxHeight: "200px", overflowY: "auto" }}>
              {nearest.slice(0, 5).map((farmer, idx) => (
                <div
                  key={farmer._id || idx}
                  className={`p-2 mb-2 bg-white rounded cursor-pointer border ${
                    selectedFarmer?._id === farmer._id
                      ? "border-danger border-2"
                      : "border-light"
                  }`}
                  onClick={() => setSelectedFarmer(farmer)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <strong className="d-block">{farmer.fullName}</strong>
                      <small className="text-muted">{farmer.farmName}</small>
                    </div>
                    <span className="badge bg-info">
                      {farmer.distance.toFixed(1)} km
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Your Location Details */}
        <div className="row mt-3">
          <div className="col-md-12">
            <h6>📍 Your Location</h6>
            <p className="mb-1">
              <strong>Latitude:</strong> {location.latitude.toFixed(5)}
            </p>
            <p className="mb-1">
              <strong>Longitude:</strong> {location.longitude.toFixed(5)}
            </p>
            {location.accuracy && (
              <p className="mb-0">
                <strong>Accuracy:</strong> {Math.round(location.accuracy)}{" "}
                meters
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          backgroundColor: "white",
          padding: "10px 15px",
          borderRadius: "5px",
          zIndex: 1000,
          boxShadow: "0 0 10px rgba(0,0,0,0.2)",
          fontSize: "12px",
        }}
      >
        <div className="mb-2">
          <span
            style={{
              display: "inline-block",
              width: "15px",
              height: "15px",
              backgroundColor: "#1f78d1",
              borderRadius: "3px",
            }}
          ></span>{" "}
          Your Location
        </div>
        <div className="mb-2">
          <span
            style={{
              display: "inline-block",
              width: "15px",
              height: "15px",
              backgroundColor: "#66c93a",
              borderRadius: "3px",
            }}
          ></span>{" "}
          Farmer Location
        </div>
        <div>
          <span
            style={{
              display: "inline-block",
              width: "15px",
              height: "15px",
              backgroundColor: "#f80000",
              borderRadius: "3px",
            }}
          ></span>{" "}
          Nearest Farmer
        </div>
      </div>
    </div>
  );
}

export default FarmerMapView;
