import * as Location from "expo-location";

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

/**
 * Request location permissions
 */
export async function requestLocationPermissions(): Promise<boolean> {
  const { status: existingStatus } =
    await Location.getForegroundPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Location.requestForegroundPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === "granted";
}

/**
 * Get current location
 */
export async function getCurrentLocation(): Promise<LocationData | null> {
  try {
    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) {
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    // Try to get address (reverse geocoding)
    let address: string | undefined;
    try {
      const [place] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (place) {
        const parts = [
          place.street,
          place.city,
          place.region,
          place.country,
        ].filter(Boolean);
        address = parts.join(", ");
      }
    } catch (error) {
      console.warn("Error getting address:", error);
      // Continue without address
    }

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      address,
    };
  } catch (error) {
    console.error("Error getting location:", error);
    return null;
  }
}

/**
 * Parse location from JSON string
 */
export function parseLocation(
  locationJson: string | null | undefined
): LocationData | null {
  if (!locationJson) return null;
  try {
    return JSON.parse(locationJson);
  } catch {
    return null;
  }
}

/**
 * Stringify location to JSON
 */
export function stringifyLocation(
  location: LocationData | null
): string | null {
  if (!location) return null;
  return JSON.stringify(location);
}
