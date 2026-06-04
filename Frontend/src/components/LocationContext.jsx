import React, { createContext, useContext, useState } from "react";
import useLocationTracker from "../hooks/useLocationTracker";

const LocationContext = createContext(null);

export const LocationProvider = ({ children }) => {
  const locationData = useLocationTracker();
  const [manualLocation, setManualLocation] = useState(null);

  const contextValue = {
    ...locationData,
    location: manualLocation || locationData.location,
    setManualLocation,
    isManual: !!manualLocation,
  };

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
};

export const useGeoLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useGeoLocation must be used within a LocationProvider");
  }
  return (
    context || {
      location: null,
      error: null,
      setManualLocation: () => {},
      isManual: false,
    }
  );
};
