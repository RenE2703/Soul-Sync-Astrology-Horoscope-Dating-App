import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";

export interface LocationCoords {
  latitude: number;
  longitude: number;
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
 * Request permission and get current location in one call
 * @returns Object with location, permission status, and any error
 */
export async function requestAndGetLocation(): Promise<{
  location: LocationCoords | null;
  status: Location.PermissionStatus;
  error: string | null;
}> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      return {
        location: null,
        status,
        error: "Location permission denied",
      };
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      location: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      },
      status,
      error: null,
    };
  } catch (error) {
    return {
      location: null,
      status: "denied" as Location.PermissionStatus,
      error: error instanceof Error ? error.message : "Failed to get location",
    };
  }
}

/**
 * Hook for accessing location with permission handling
 */
export function useLocation() {
  const [state, setState] = useState<LocationState>({
    location: null,
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
      return { location: null, status: "denied" as Location.PermissionStatus, error: errorMsg };
    }
  }, []);

  // Refresh location (requires existing permission)
  const refreshLocation = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    const location = await getCurrentLocation();

    setState((prev) => ({
      ...prev,
      location,
      isLoading: false,
      errorMsg: location ? null : "Could not get location",
    }));

    return location;
  }, []);

  return {
    ...state,
    requestLocation,
    refreshLocation,
    isGranted: state.permissionStatus === "granted",
  };
}
