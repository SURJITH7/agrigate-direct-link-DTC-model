import React, { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useGeoLocation } from "../LocationContext";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon issues in React/Webpack environments
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

function LiveMap() {
  const { location } = useGeoLocation();

  const center = useMemo(() => {
    if (location) return [location.latitude, location.longitude];
    return [51.505, -0.09]; // Default fallback if location is not yet available
  }, [location]);

  if (!location) {
    return (
      <div
        className="d-flex justify-content-center align-items-center bg-light"
        style={{ height: "500px", borderRadius: "12px" }}
      >
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading location...</span>
        </div>
        <span className="ms-3">Acquiring GPS signal...</span>
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={15}
      style={{
        height: "500px",
        width: "100%",
        borderRadius: "12px",
        zIndex: 1,
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[location.latitude, location.longitude]}>
        <Popup>
          You are here. <br /> Accuracy: {Math.round(location.accuracy)} meters.
        </Popup>
      </Marker>
    </MapContainer>
  );
}

export default LiveMap;
