import { useEffect, useRef } from "react";
import { useGeoLocation } from "./LocationContext";

function LocationSender() {
  const { location } = useGeoLocation();
  const lastSentRef = useRef(0);

  useEffect(() => {
    if (!location) return;

    const now = Date.now();
    // Throttle: only send if 5 seconds have passed since the last update
    if (now - lastSentRef.current > 5000) {
      lastSentRef.current = now;

      // Example API call - replace with your actual backend endpoint
      // console.log("Broadcasting location:", location);

      /* 
      fetch("http://localhost:5000/api/live-tracking/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: location.timestamp
        }),
      }).catch(err => console.error("Tracking upload failed", err));
      */
    }
  }, [location]);

  return null; // This component is logic-only, no UI
}

export default LocationSender;
