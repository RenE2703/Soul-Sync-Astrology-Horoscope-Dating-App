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
 * Get the current location
 * @returns Location coordinates or null if unavailable
 */
export async function getCurrentLocation(): Promise<LocationCoords | null> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    
    if (status !== "granted") {
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error("Error getting location:", error);
    return null;
  }
}

/**
 * Reverse geocode coordinates to get city/region information
 * @param coords Location coordinates
 * @returns Location info with city, region, country, and display name
 */
export async function reverseGeocode(coords: LocationCoords): Promise<LocationInfo> {
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

      // Build display name
      let displayName = "";
      if (city) {
        displayName = city;
        // Add region/state abbreviation for US addresses
        if (region) {
          // Use region code if available (e.g., "CA" instead of "California")
          const regionCode = getRegionCode(region, country);
          displayName += `, ${regionCode}`;
        }
      } else if (region) {
        displayName = region;
        if (country) {
          displayName += `, ${country}`;
        }
      } else if (country) {
        displayName = country;
      } else {
        displayName = "Unknown location";
      }

      return { city, region, country, displayName };
    }

    return { city: null, region: null, country: null, displayName: "Unknown location" };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return { city: null, region: null, country: null, displayName: "Unknown location" };
  }
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
 * Request permission and get current location in one call
 * @returns Object with location, location info, permission status, and any error
 */
export async function requestAndGetLocation(): Promise<{
  location: LocationCoords | null;
  locationInfo: LocationInfo | null;
  status: Location.PermissionStatus;
  error: string | null;
}> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      return {
        location: null,
        locationInfo: null,
        status,
        error: "Location permission denied",
      };
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const coords = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    // Get location info via reverse geocoding
    const locationInfo = await reverseGeocode(coords);

    return {
      location: coords,
      locationInfo,
      status,
      error: null,
    };
  } catch (error) {
    return {
      location: null,
      locationInfo: null,
      status: "denied" as Location.PermissionStatus,
      error: error instanceof Error ? error.message : "Failed to get location",
    };
  }
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
