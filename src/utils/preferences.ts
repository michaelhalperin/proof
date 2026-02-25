import * as SecureStore from "expo-secure-store";

const STATISTICS_TAB_VISIBLE_KEY = "statisticsTabVisible";
const MAP_TAB_VISIBLE_KEY = "mapTabVisible";
const PROFILE_IMAGE_URI_KEY = "profileImageUri";
const CALENDAR_EXPORT_DATE_KEY = "calendarExportDateKey";

/**
 * Get whether Statistics tab should be visible
 * Defaults to true if not set
 */
export async function isStatisticsTabVisible(): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(STATISTICS_TAB_VISIBLE_KEY);
    // Default to true if not set (for existing users)
    return value === null ? true : value === "true";
  } catch {
    return true;
  }
}

/**
 * Set whether Statistics tab should be visible
 */
export async function setStatisticsTabVisible(visible: boolean): Promise<void> {
  await SecureStore.setItemAsync(
    STATISTICS_TAB_VISIBLE_KEY,
    visible.toString()
  );
}

/**
 * Get whether Map tab should be visible
 * Defaults to true if not set
 */
export async function isMapTabVisible(): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(MAP_TAB_VISIBLE_KEY);
    // Default to true if not set (for existing users)
    return value === null ? true : value === "true";
  } catch {
    return true;
  }
}

/**
 * Set whether Map tab should be visible
 */
export async function setMapTabVisible(visible: boolean): Promise<void> {
  await SecureStore.setItemAsync(MAP_TAB_VISIBLE_KEY, visible.toString());
}

/**
 * Get stored profile image file URI, or null if not set
 */
export async function getProfileImageUri(): Promise<string | null> {
  try {
    const uri = await SecureStore.getItemAsync(PROFILE_IMAGE_URI_KEY);
    return uri;
  } catch {
    return null;
  }
}

/**
 * Save profile image file URI (call after copying image to app storage)
 */
export async function setProfileImageUri(uri: string): Promise<void> {
  await SecureStore.setItemAsync(PROFILE_IMAGE_URI_KEY, uri);
}

/**
 * Clear stored profile image URI (call after deleting the file if desired)
 */
export async function clearProfileImageUri(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(PROFILE_IMAGE_URI_KEY);
  } catch {
    // ignore
  }
}

/**
 * Get the dateKey (YYYY-MM-DD) that was last added to the device calendar, or null.
 */
export async function getCalendarExportDateKey(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(CALENDAR_EXPORT_DATE_KEY);
  } catch {
    return null;
  }
}

/**
 * Mark that the given dateKey was added to the device calendar.
 */
export async function setCalendarExportDateKey(dateKey: string): Promise<void> {
  await SecureStore.setItemAsync(CALENDAR_EXPORT_DATE_KEY, dateKey);
}
