import React, { useState, useEffect, useMemo } from "react";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  Circle,
} from "@react-google-maps/api";
import { ref, set, onValue, onDisconnect } from "firebase/database";
import { db } from "../utils/firebaseConfig";
import { useAuth } from "./AuthContext"; // Assuming you have this from your context

const mapContainerStyle = {
  width: "100%",
  height: "80vh",
  borderRadius: "12px",
};

const defaultCenter = {
  lat: 20.5937, // Center of India
  lng: 78.9629,
};

const GoogleMapsTracking = () => {
  const { user } = useAuth();
  const [myLocation, setMyLocation] = useState(null);
  const [allUsers, setAllUsers] = useState({});

  // Load Google Maps Script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "YOUR_GOOGLE_MAPS_API_KEY",
  });

  // 1. Track My Location & Send to Firebase
  useEffect(() => {
    if (!user) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLoc = { lat: latitude, lng: longitude };

        setMyLocation(newLoc);

        // Write to Firebase Realtime Database
        // Path: locations/{userId}
        const userLocRef = ref(db, `locations/${user._id}`);
        set(userLocRef, {
          lat: latitude,
          lng: longitude,
          name: user.name,
          role: user.role,
          lastUpdated: Date.now(),
        });

        // Remove location when user disconnects/closes tab
        onDisconnect(userLocRef).remove();
      },
      (error) => console.error("Error watching location:", error),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user]);

  // 2. Listen for Updates from Other Users
  useEffect(() => {
    const locationsRef = ref(db, "locations");

    // Real-time listener
    const unsubscribe = onValue(locationsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Filter out self if desired, or keep to show self on map
        setAllUsers(data);
      } else {
        setAllUsers({});
      }
    });

    return () => unsubscribe();
  }, []);

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading Maps...</div>;

  return (
    <div className="map-container p-4">
      <h2 className="text-2xl font-bold mb-4">Live Tracking (Google Maps)</h2>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={15}
        center={myLocation || defaultCenter}
      >
        {/* Render All Users */}
        {Object.entries(allUsers).map(([userId, data]) => (
          <React.Fragment key={userId}>
            <Marker
              position={{ lat: data.lat, lng: data.lng }}
              title={data.name}
              // Different icon for current user vs others
              icon={
                userId === user?._id
                  ? "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                  : "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
              }
            />
            {/* Accuracy/Radius Circle */}
            <Circle
              center={{ lat: data.lat, lng: data.lng }}
              radius={userId === user?._id ? 50 : 30}
              options={{
                fillColor: userId === user?._id ? "#4285F4" : "#FF0000",
                fillOpacity: 0.2,
                strokeWeight: 0,
              }}
            />
          </React.Fragment>
        ))}
      </GoogleMap>
    </div>
  );
};

export default GoogleMapsTracking;
