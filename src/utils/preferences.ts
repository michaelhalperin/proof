import * as SecureStore from "expo-secure-store";

const STATISTICS_TAB_VISIBLE_KEY = "statisticsTabVisible";
const MAP_TAB_VISIBLE_KEY = "mapTabVisible";

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
