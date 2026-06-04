import React, { createContext, useContext } from "react";
import useLocationTracker from "./hooks/useLocationTracker";

const LocationContext = createContext(null);

export const LocationProvider = ({ children }) => {
  const locationData = useLocationTracker();

  return (
    <LocationContext.Provider value={locationData}>
      {children}
    </LocationContext.Provider>
  );
};

export const useGeoLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useGeoLocation must be used within a LocationProvider");
  }
  return context || { location: null, error: null };
};
