/**
 * Calculate the distance between two coordinates using the Haversine formula.
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in miles
 */
export function calculateDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate the distance between two coordinates using the Haversine formula.
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if a user is within a maximum distance
 * @param userLocation User's location
 * @param targetLocation Target location to check
 * @param maxDistanceMiles Maximum distance in miles
 * @returns true if within distance, false otherwise
 */
export function isWithinDistance(
  userLocation: { latitude: number; longitude: number } | undefined,
  targetLocation: { latitude: number; longitude: number } | undefined,
  maxDistanceMiles: number | undefined
): boolean {
  // If no max distance set, don't filter by distance
  if (!maxDistanceMiles) return true;
  
  // If either user doesn't have location, don't filter them out
  if (!userLocation || !targetLocation) return true;

  const distance = calculateDistanceMiles(
    userLocation.latitude,
    userLocation.longitude,
    targetLocation.latitude,
    targetLocation.longitude
  );

  return distance <= maxDistanceMiles;
}

/**
 * Get distance between two users (returns null if location unavailable)
 */
export function getDistanceBetweenUsers(
  userLocation: { latitude: number; longitude: number } | undefined,
  targetLocation: { latitude: number; longitude: number } | undefined
): number | null {
  if (!userLocation || !targetLocation) return null;

  return calculateDistanceMiles(
    userLocation.latitude,
    userLocation.longitude,
    targetLocation.latitude,
    targetLocation.longitude
  );
}
