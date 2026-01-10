import dayjs from "dayjs";

/**
 * Get today's date key in YYYY-MM-DD format
 */
export function getTodayDateKey(): string {
  return dayjs().format("YYYY-MM-DD");
}

/**
 * Format date key to readable format
 */
export function formatDateKey(dateKey: string): string {
  return dayjs(dateKey).format("MMMM D, YYYY");
}

/**
 * Format timestamp to readable format
 */
export function formatTimestamp(timestamp: number): string {
  return dayjs(timestamp).format("MMMM D, YYYY [at] h:mm A");
}

/**
 * Get date key from Date object
 */
export function dateToDateKey(date: Date): string {
  return dayjs(date).format("YYYY-MM-DD");
}

/**
 * Get last N days as date keys
 */
export function getLastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = 0; i < n; i++) {
    const date = dayjs().subtract(i, "day");
    days.push(date.format("YYYY-MM-DD"));
  }
  return days.reverse(); // Oldest first
}
