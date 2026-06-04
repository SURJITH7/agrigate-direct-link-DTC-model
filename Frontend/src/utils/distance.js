/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers

  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find nearest location to user
 * @param {Object} user - User object with latitude, longitude
 * @param {Array} locations - Array of location objects with latitude, longitude
 * @returns {Object|null} Nearest location object with distance property, or null
 */
export function findNearest(user, locations) {
  if (!user || !locations || locations.length === 0) {
    return null;
  }

  let minDist = Infinity;
  let nearest = null;

  locations.forEach((loc) => {
    if (!loc.latitude || !loc.longitude) return; // Skip invalid locations

    const dist = getDistance(
      user.latitude,
      user.longitude,
      loc.latitude,
      loc.longitude,
    );

    if (dist < minDist) {
      minDist = dist;
      nearest = { ...loc, distance: dist };
    }
  });

  return nearest;
}

/**
 * Find multiple nearest locations sorted by distance
 * @param {Object} user - User object with latitude, longitude
 * @param {Array} locations - Array of location objects
 * @param {number} limit - Number of results to return (default 10)
 * @returns {Array} Array of location objects sorted by distance
 */
export function findNearestMultiple(user, locations, limit = 10) {
  if (!user || !locations || locations.length === 0) {
    return [];
  }

  const withDistance = locations
    .filter((loc) => loc.latitude && loc.longitude)
    .map((loc) => ({
      ...loc,
      distance: getDistance(
        user.latitude,
        user.longitude,
        loc.latitude,
        loc.longitude,
      ),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);

  return withDistance;
}
