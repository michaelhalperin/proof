import * as Calendar from "expo-calendar";
import { Platform } from "react-native";
import { Record } from "../db/database";

/**
 * Get a calendar ID we can write to (default on iOS, first writable on Android).
 */
async function getWritableCalendarId(): Promise<string> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Calendar permission is required to add the event.");
  }

  if (Platform.OS === "ios") {
    const defaultCal = await Calendar.getDefaultCalendarAsync();
    return defaultCal.id;
  }

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writable = calendars.find((cal) => cal.allowsModifications);
  if (!writable) {
    throw new Error("No writable calendar found.");
  }
  return writable.id;
}

/**
 * Add today's proof as an all-day event to the device calendar.
 * Does not open the share menu; adds the event directly.
 */
export async function addProofToDeviceCalendar(
  dateKey: string,
  record: Record
): Promise<void> {
  const calendarId = await getWritableCalendarId();

  const [y, m, d] = dateKey.split("-").map(Number);
  const startDate = new Date(y, m - 1, d, 0, 0, 0);
  const endDate = new Date(y, m - 1, d + 1, 0, 0, 0);

  const title = "Proof logged";
  const notes = record.note?.trim()
    ? record.note.slice(0, 1000)
    : "Daily proof recorded in Prooffy.";

  await Calendar.createEventAsync(calendarId, {
    title,
    notes,
    startDate,
    endDate,
    allDay: true,
  });
}
