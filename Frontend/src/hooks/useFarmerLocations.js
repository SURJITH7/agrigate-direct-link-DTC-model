import { useState, useEffect } from "react";
import { findNearestMultiple, findNearest } from "../utils/distance";
import api from "../api";

/**
 * Hook to fetch farmers and find nearest ones to user location
 * @param {Object} userLocation - User's current location { latitude, longitude }
 * @param {number} limit - Number of nearest farmers to return (default 5)
 * @returns {Object} { farmers, nearest, nearestSingle, loading, error }
 */
export const useFarmerLocations = (userLocation, limit = 5) => {
  const [farmers, setFarmers] = useState([]);
  const [nearest, setNearest] = useState([]);
  const [nearestSingle, setNearestSingle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userLocation) {
      return;
    }

    const fetchFarmers = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all farmers with locations
        const response = await api.get("/api/users?role=farmer");
        const farmersList = response.data || [];

        // Filter farmers with valid locations
        const farmersWithLocation = farmersList.filter(
          (farmer) => farmer.latitude && farmer.longitude,
        );

        setFarmers(farmersWithLocation);

        // Find nearest farmers
        const nearestFarmers = findNearestMultiple(
          userLocation,
          farmersWithLocation,
          limit,
        );
        setNearest(nearestFarmers);

        // Find single nearest farmer
        const singleNearest = findNearest(userLocation, farmersWithLocation);
        setNearestSingle(singleNearest);
      } catch (err) {
        console.error("Error fetching farmers:", err);
        setError(err.message || "Failed to fetch farmers");
      } finally {
        setLoading(false);
      }
    };

    fetchFarmers();
  }, [userLocation, limit]);

  return { farmers, nearest, nearestSingle, loading, error };
};

export default useFarmerLocations;
