import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface LocationInfo {
  city: string | null;
  region: string | null;
  country: string | null;
  displayName: string; // Formatted display string (e.g., "San Francisco, CA")
}

export interface LocationState {
  location: LocationCoords | null;
  errorMsg: string | null;
  isLoading: boolean;
  permissionStatus: Location.PermissionStatus | null;
}

/**
 * Request foreground location permission
 * @returns Permission status
 */
export async function requestLocationPermission(): Promise<Location.PermissionStatus> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status;
}

/**
 * Check current location permission status
 * @returns Permission status
 */
export async function checkLocationPermission(): Promise<Location.PermissionStatus> {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status;
}

/**
 * Get the current location using multiple strategies for reliability.
 * @returns Location coordinates or null if unavailable
 */
export async function getCurrentLocation(): Promise<LocationCoords | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    
    if (status !== "granted") {
      return null;
    }

    // Try getCurrentPositionAsync first (returns fresh/mock location)
    try {
      const location = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Location timeout")), 10000)
        ),
      ]);
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (e) {
      // Continue to fallback
    }

    // Fallback to getLastKnownPositionAsync (may be stale on emulators)
    try {
      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown) {
        return {
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
        };
      }
    } catch (e) {
      // No cached position either
    }

    return null;
  } catch (error) {
    console.error("Error getting location:", error);
    return null;
  }
}

/**
 * Reverse geocode coordinates to get city/region information.
 * Uses expo-location first, then falls back to OpenStreetMap Nominatim
 * which works reliably in Vietnam and other regions.
 * @param coords Location coordinates
 * @returns Location info with city, region, country, and display name
 */
export async function reverseGeocode(coords: LocationCoords): Promise<LocationInfo> {
  // Try expo-location first
  try {
    const results = await Location.reverseGeocodeAsync({
      latitude: coords.latitude,
      longitude: coords.longitude,
    });

    if (results.length > 0) {
      const result = results[0];
      const city = result.city || result.subregion || null;
      const region = result.region || null;
      const country = result.country || null;

      if (city || region) {
        const displayName = formatDisplayName(city, region, country);
        return { city, region, country, displayName };
      }
    }
  } catch (error) {
    console.warn("expo-location reverse geocode failed, trying Nominatim:", error);
  }

  // Fallback to OpenStreetMap Nominatim (works great worldwide, especially Vietnam)
  return reverseGeocodeNominatim(coords);
}

/**
 * Reverse geocode using OpenStreetMap Nominatim API.
 * This works reliably in Vietnam and returns localized place names.
 */
async function reverseGeocodeNominatim(coords: LocationCoords): Promise<LocationInfo> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json&accept-language=vi,en&zoom=10`,
      {
        headers: {
          "User-Agent": "SoulSyncApp/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data && data.address) {
      const addr = data.address;
      // Nominatim returns structured address; pick the most relevant parts
      const city =
        addr.city ||
        addr.town ||
        addr.municipality ||
        addr.county ||
        addr.suburb ||
        null;
      const region = addr.state || addr.province || null;
      const country = addr.country || null;

      const displayName = formatDisplayName(city, region, country);
      return { city, region, country, displayName };
    }

    return { city: null, region: null, country: null, displayName: "Unknown location" };
  } catch (error) {
    console.error("Nominatim reverse geocoding error:", error);
    return { city: null, region: null, country: null, displayName: "Unknown location" };
  }
}

/**
 * Format a display name from city, region, country parts.
 * Examples:
 *  - "Hồ Chí Minh, Việt Nam"
 *  - "Hà Nội, Việt Nam"
 *  - "San Francisco, CA"
 */
function formatDisplayName(
  city: string | null,
  region: string | null,
  country: string | null
): string {
  if (city) {
    // For US addresses, show state abbreviation
    if (
      country === "United States" ||
      country === "USA" ||
      country === "US"
    ) {
      const regionCode = region ? getRegionCode(region, country) : null;
      return regionCode ? `${city}, ${regionCode}` : city;
    }
    // For other countries, show country name
    if (country) {
      return `${city}, ${country}`;
    }
    return city;
  }

  if (region) {
    return country ? `${region}, ${country}` : region;
  }

  return country || "Unknown location";
}

/**
 * Get abbreviated region code for common countries
 */
function getRegionCode(region: string, country: string | null): string {
  // For US states, try to return abbreviation
  if (country === "United States" || country === "USA" || country === "US") {
    const stateAbbreviations: Record<string, string> = {
      "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR",
      "California": "CA", "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE",
      "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID",
      "Illinois": "IL", "Indiana": "IN", "Iowa": "IA", "Kansas": "KS",
      "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
      "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS",
      "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV",
      "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
      "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK",
      "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
      "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT",
      "Vermont": "VT", "Virginia": "VA", "Washington": "WA", "West Virginia": "WV",
      "Wisconsin": "WI", "Wyoming": "WY", "District of Columbia": "DC",
    };
    return stateAbbreviations[region] || region;
  }
  return region;
}

/**
 * Request permission and get current location in one call.
 * Uses watchPositionAsync (best for emulator mock locations),
 * then getCurrentPositionAsync, then getLastKnownPositionAsync.
 * @returns Object with location, location info, permission status, and any error
 */
export async function requestAndGetLocation(): Promise<{
  location: LocationCoords | null;
  locationInfo: LocationInfo | null;
  status: Location.PermissionStatus;
  error: string | null;
}> {
  try {
    console.log("[Location] Requesting permission...");
    const { status } = await Location.requestForegroundPermissionsAsync();
    console.log("[Location] Permission status:", status);

    if (status !== "granted") {
      return {
        location: null,
        locationInfo: null,
        status,
        error: "Location permission denied",
      };
    }

    let coords: LocationCoords | null = null;

    // Strategy 1: watchPositionAsync — subscribes to location updates
    // This is the ONLY method that reliably receives Android emulator mock locations
    try {
      console.log("[Location] Trying watchPositionAsync (8s timeout)...");
      coords = await new Promise<LocationCoords | null>((resolve) => {
        let resolved = false;
        let subscription: Location.LocationSubscription | null = null;

        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            subscription?.remove();
            console.warn("[Location] watchPositionAsync timed out");
            resolve(null);
          }
        }, 8000);

        Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Low,
            timeInterval: 1000,
            distanceInterval: 0,
          },
          (location) => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              subscription?.remove();
              console.log("[Location] watchPositionAsync got:", location.coords.latitude, location.coords.longitude);
              resolve({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              });
            }
          }
        ).then((sub) => {
          subscription = sub;
          // If already resolved (timeout), clean up immediately
          if (resolved) sub.remove();
        }).catch((err) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            console.warn("[Location] watchPositionAsync error:", err);
            resolve(null);
          }
        });
      });
    } catch (e) {
      console.warn("[Location] watchPositionAsync failed:", e);
    }

    // Strategy 2: getCurrentPositionAsync with timeout
    if (!coords) {
      try {
        console.log("[Location] Trying getCurrentPositionAsync (Low, 10s timeout)...");
        const locationResult = await Promise.race([
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Low,
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Location timeout after 10s")), 10000)
          ),
        ]);
        console.log("[Location] Got current position:", locationResult.coords.latitude, locationResult.coords.longitude);
        coords = {
          latitude: locationResult.coords.latitude,
          longitude: locationResult.coords.longitude,
        };
      } catch (e) {
        console.warn("[Location] getCurrentPositionAsync failed:", e);
      }
    }

    // Strategy 3: Last resort — cached position (may be stale on emulators)
    if (!coords) {
      try {
        console.log("[Location] Trying getLastKnownPositionAsync (cached, last resort)...");
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown) {
          console.log("[Location] Got last known position:", lastKnown.coords.latitude, lastKnown.coords.longitude);
          coords = {
            latitude: lastKnown.coords.latitude,
            longitude: lastKnown.coords.longitude,
          };
        }
      } catch (e) {
        console.warn("[Location] getLastKnownPositionAsync failed:", e);
      }
    }

    if (!coords) {
      console.error("[Location] Could not determine location with any method");
      return {
        location: null,
        locationInfo: null,
        status,
        error: "Could not determine your location. Please make sure GPS is enabled.",
      };
    }

    // Get location info via reverse geocoding
    console.log("[Location] Reverse geocoding coords:", coords.latitude, coords.longitude);
    const locationInfo = await reverseGeocode(coords);
    console.log("[Location] Reverse geocode result:", locationInfo.displayName);

    return {
      location: coords,
      locationInfo,
      status,
      error: null,
    };
  } catch (error) {
    console.error("[Location] Unexpected error:", error);
    return {
      location: null,
      locationInfo: null,
      status: "denied" as Location.PermissionStatus,
      error: error instanceof Error ? error.message : "Failed to get location",
    };
  }
}

/**
 * A single search result from forward geocoding.
 */
export interface GeoSearchResult {
  /** Display name from Nominatim (e.g. "75 Tân Lập, Đông Hoà, Dĩ An, Bình Dương, Việt Nam") */
  displayName: string;
  /** Coordinates — precision depends on the query specificity */
  location: LocationCoords;
  /** Type of result (e.g. "residential", "suburb", "city", "state") */
  type: string;
  /** Importance score from Nominatim (higher = more relevant) */
  importance: number;
}

/**
 * Search for locations by name using Nominatim.
 * Returns multiple results so the user can pick the most precise one.
 * 
 * Precision levels:
 * - "75 Tân Lập, Đông Hòa, Bình Dương" → street-level coordinates (~50m accuracy)
 * - "Đông Hòa, Bình Dương" → ward/commune center (~1-2km accuracy)
 * - "Bình Dương" → province center (~20-30km accuracy, NOT recommended)
 * 
 * @param query Place name or address
 * @returns Array of search results, sorted by relevance
 */
export async function searchLocations(query: string): Promise<GeoSearchResult[]> {
  try {
    console.log("[Location] Searching locations:", query);
    
    // Search with Vietnam priority first, then globally
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&accept-language=vi,en&countrycodes=vn&addressdetails=1`,
      {
        headers: { "User-Agent": "SoulSyncApp/1.0" },
      }
    );

    if (!response.ok) return [];

    let results = await response.json();

    // If no Vietnam results, try without country restriction
    if (!results || results.length === 0) {
      const response2 = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&accept-language=vi,en&addressdetails=1`,
        {
          headers: { "User-Agent": "SoulSyncApp/1.0" },
        }
      );
      if (!response2.ok) return [];
      results = await response2.json();
    }

    if (!results || results.length === 0) return [];

    return results.map((r: any) => ({
      displayName: r.display_name || "Unknown",
      location: {
        latitude: parseFloat(r.lat),
        longitude: parseFloat(r.lon),
      },
      type: r.type || r.class || "place",
      importance: r.importance || 0,
    }));
  } catch (error) {
    console.error("[Location] Search error:", error);
    return [];
  }
}

/**
 * Forward geocode a place name to coordinates using Nominatim.
 * Returns the BEST (most precise) match.
 * For multiple results, use searchLocations() instead.
 * 
 * @param query Place name (e.g. "Đông Hòa, Bình Dương")
 * @returns Location coords and info, or null if not found
 */
export async function forwardGeocode(query: string): Promise<{
  location: LocationCoords;
  locationInfo: LocationInfo;
} | null> {
  const results = await searchLocations(query);
  if (results.length === 0) return null;

  const best = results[0];
  
  // Reverse geocode the precise coordinates for a clean display name
  const locationInfo = await reverseGeocode(best.location);
  console.log("[Location] Forward geocode result:", locationInfo.displayName, best.location);

  return { location: best.location, locationInfo };
}

export interface ExtendedLocationState extends LocationState {
  locationInfo: LocationInfo | null;
}

/**
 * Hook for accessing location with permission handling
 */
export function useLocation() {
  const [state, setState] = useState<ExtendedLocationState>({
    location: null,
    locationInfo: null,
    errorMsg: null,
    isLoading: false,
    permissionStatus: null,
  });

  // Check permission status on mount
  useEffect(() => {
    (async () => {
      const status = await checkLocationPermission();
      setState((prev) => ({ ...prev, permissionStatus: status }));
    })();
  }, []);

  // Request permission and get location
  const requestLocation = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, errorMsg: null }));

    try {
      const result = await requestAndGetLocation();

      setState({
        location: result.location,
        locationInfo: result.locationInfo,
        errorMsg: result.error,
        isLoading: false,
        permissionStatus: result.status,
      });

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to get location";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        errorMsg,
      }));
      return { location: null, locationInfo: null, status: "denied" as Location.PermissionStatus, error: errorMsg };
    }
  }, []);

  // Refresh location (requires existing permission)
  const refreshLocation = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    const location = await getCurrentLocation();
    let locationInfo: LocationInfo | null = null;
    
    if (location) {
      locationInfo = await reverseGeocode(location);
    }

    setState((prev) => ({
      ...prev,
      location,
      locationInfo,
      isLoading: false,
      errorMsg: location ? null : "Could not get location",
    }));

    return { location, locationInfo };
  }, []);

  return {
    ...state,
    requestLocation,
    refreshLocation,
    isGranted: state.permissionStatus === "granted",
  };
}

/**
 * Hook for reverse geocoding a location
 * @param location Location coordinates to reverse geocode
 * @returns Location info state
 */
export function useReverseGeocode(location: LocationCoords | null | undefined) {
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!location) {
      setLocationInfo(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    reverseGeocode(location).then((info) => {
      if (!cancelled) {
        setLocationInfo(info);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [location?.latitude, location?.longitude]);

  return { locationInfo, isLoading };
}
