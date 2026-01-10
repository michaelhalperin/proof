import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";

const REMINDER_ENABLED_KEY = "reminderEnabled";
const REMINDER_TIME_KEY = "reminderTime";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === "granted";
}

/**
 * Check if reminders are enabled
 */
export async function isReminderEnabled(): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(REMINDER_ENABLED_KEY);
    return value === "true";
  } catch {
    return false;
  }
}

/**
 * Set reminder enabled/disabled
 */
export async function setReminderEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(REMINDER_ENABLED_KEY, enabled.toString());
  if (enabled) {
    await scheduleReminder();
  } else {
    await cancelReminder();
  }
}

/**
 * Get reminder time (HH:mm format, 24-hour)
 */
export async function getReminderTime(): Promise<string> {
  try {
    const time = await SecureStore.getItemAsync(REMINDER_TIME_KEY);
    return time || "20:00"; // Default to 8 PM
  } catch {
    return "20:00";
  }
}

/**
 * Set reminder time (HH:mm format, 24-hour)
 */
export async function setReminderTime(time: string): Promise<void> {
  await SecureStore.setItemAsync(REMINDER_TIME_KEY, time);
  const enabled = await isReminderEnabled();
  if (enabled) {
    await scheduleReminder();
  }
}

/**
 * Schedule daily reminder notification
 */
export async function scheduleReminder(): Promise<void> {
  await cancelReminder(); // Cancel existing first

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    throw new Error("Notification permissions not granted");
  }

  const time = await getReminderTime();
  const [hours, minutes] = time.split(":").map(Number);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Proof",
      body: "Don't forget to log today's proof!",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hours,
      minute: minutes,
    },
  });
}

/**
 * Cancel reminder notification
 */
export async function cancelReminder(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Initialize notifications (call on app start)
 */
export async function initializeNotifications(): Promise<void> {
  const enabled = await isReminderEnabled();
  if (enabled) {
    await scheduleReminder();
  }
}
