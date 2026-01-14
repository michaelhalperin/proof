import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { getAllRecords, getPhotos, deleteAllRecords } from "../db/database";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { sharePDF } from "../utils/shareUtils";
import {
  isReminderEnabled,
  setReminderEnabled,
  getReminderTime,
  setReminderTime,
  requestNotificationPermissions,
  initializeNotifications,
} from "../utils/notifications";
import {
  isStatisticsTabVisible,
  setStatisticsTabVisible,
  isMapTabVisible,
  setMapTabVisible,
} from "../utils/preferences";
import { getFontFamily } from "../config/theme";

type SettingsScreenNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress: () => void;
  showArrow?: boolean;
  danger?: boolean;
  isLoading?: boolean;
}

function SettingItem({
  icon,
  label,
  value,
  onPress,
  showArrow = true,
  danger = false,
  isLoading = false,
}: SettingItemProps) {
  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isLoading}
    >
      <View style={styles.settingLeft}>
        <View
          style={[styles.iconContainer, danger && styles.iconContainerDanger]}
        >
          <Ionicons name={icon} size={20} color={danger ? "#ff3b30" : "#000"} />
        </View>
        <View style={styles.settingTextContainer}>
          <Text
            style={[styles.settingLabel, danger && styles.settingLabelDanger]}
          >
            {label}
          </Text>
          {value && <Text style={styles.settingValue}>{value}</Text>}
        </View>
      </View>
      {isLoading ? (
        <ActivityIndicator size="small" color={danger ? "#ff3b30" : "#000"} />
      ) : showArrow ? (
        <Ionicons name="chevron-forward" size={20} color="#999" />
      ) : null}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { user, logout, deleteAccount, isEmailVerified } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const [totalRecords, setTotalRecords] = useState<number | null>(null);
  const [storageInfo, setStorageInfo] = useState<string>("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const [reminderEnabled, setReminderEnabledState] = useState<boolean>(false);
  const [reminderTime, setReminderTimeState] = useState<string>("20:00");
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [tempTimeInput, setTempTimeInput] = useState<string>("20:00");
  const [statisticsTabVisible, setStatisticsTabVisibleState] =
    useState<boolean>(true);
  const [mapTabVisible, setMapTabVisibleState] = useState<boolean>(true);
  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadStats();
    loadReminderSettings();
    loadPreferences();
    loadEmailVerificationStatus();
  }, []);

  const loadPreferences = async () => {
    try {
      const statsVisible = await isStatisticsTabVisible();
      const mapVisible = await isMapTabVisible();
      setStatisticsTabVisibleState(statsVisible);
      setMapTabVisibleState(mapVisible);
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  };

  const loadEmailVerificationStatus = async () => {
    try {
      const verified = await isEmailVerified();
      setEmailVerified(verified);
    } catch (error) {
      console.error("Error loading email verification status:", error);
    }
  };

  const loadReminderSettings = async () => {
    try {
      const enabled = await isReminderEnabled();
      const time = await getReminderTime();
      setReminderEnabledState(enabled);
      setReminderTimeState(time);
    } catch (error) {
      console.error("Error loading reminder settings:", error);
    }
  };

  const handleToggleReminder = async () => {
    try {
      if (!reminderEnabled) {
        // Request permissions when enabling
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) {
          Alert.alert(
            "Permission Required",
            "Proof needs notification permissions to send daily reminders. Please enable notifications in your device settings."
          );
          return;
        }
      }

      const newValue = !reminderEnabled;
      await setReminderEnabled(newValue);
      setReminderEnabledState(newValue);
    } catch (error: any) {
      console.error("Error toggling reminder:", error);
      Alert.alert(
        "Error",
        `Failed to ${reminderEnabled ? "disable" : "enable"} reminder: ${
          error.message
        }`
      );
    }
  };

  const handleToggleStatisticsTab = async () => {
    const previousValue = statisticsTabVisible;
    try {
      const newValue = !statisticsTabVisible;
      setStatisticsTabVisibleState(newValue); // Optimistic update for instant feedback
      await setStatisticsTabVisible(newValue);

      // Notify TabNavigator that preferences changed
      const { tabPreferencesListener } = await import(
        "../utils/tabPreferencesListener"
      );
      tabPreferencesListener.notify();
    } catch (error) {
      console.error("Error toggling statistics tab:", error);
      // Revert on error
      setStatisticsTabVisibleState(previousValue);
      Alert.alert("Error", "Failed to update setting.");
    }
  };

  const handleToggleMapTab = async () => {
    const previousValue = mapTabVisible;
    try {
      const newValue = !mapTabVisible;
      setMapTabVisibleState(newValue); // Optimistic update for instant feedback
      await setMapTabVisible(newValue);

      // Notify TabNavigator that preferences changed
      const { tabPreferencesListener } = await import(
        "../utils/tabPreferencesListener"
      );
      tabPreferencesListener.notify();
    } catch (error) {
      console.error("Error toggling map tab:", error);
      // Revert on error
      setMapTabVisibleState(previousValue);
      Alert.alert("Error", "Failed to update setting.");
    }
  };

  const handleSetReminderTime = () => {
    setTempTimeInput(reminderTime);
    setShowTimeModal(true);
  };

  const handleSaveReminderTime = async () => {
    // Format and validate time before saving
    const [hourStr, minuteStr] = tempTimeInput.split(":");
    const hour = parseInt(hourStr || "20", 10);
    const minute = parseInt(minuteStr || "00", 10);

    // Validate ranges
    if (isNaN(hour) || hour < 0 || hour > 23) {
      Alert.alert("Invalid Hour", "Hour must be between 00 and 23");
      return;
    }

    if (isNaN(minute) || minute < 0 || minute > 59) {
      Alert.alert("Invalid Minute", "Minute must be between 00 and 59");
      return;
    }

    // Format with proper padding
    const formattedTime = `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;

    try {
      await setReminderTime(formattedTime);
      setReminderTimeState(formattedTime);
      setShowTimeModal(false);
    } catch (error: any) {
      Alert.alert("Error", `Failed to set reminder time: ${error.message}`);
    }
  };

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadPreferences(); // Reload preferences when Settings screen is focused
      loadEmailVerificationStatus(); // Reload email verification status when Settings screen is focused
    }, [])
  );

  // Reload preferences when leaving Settings screen (to update tabs immediately)
  useEffect(() => {
    const unsubscribe = navigation.addListener("blur", () => {
      // Trigger a reload in the parent navigator by dispatching a custom event
      // The TabNavigator's useFocusEffect will pick this up
      setTimeout(() => {
        loadPreferences();
      }, 100);
    });

    return unsubscribe;
  }, [navigation]);

  const loadStats = async () => {
    try {
      const records = await getAllRecords();
      setTotalRecords(records.length);

      // Calculate approximate storage (rough estimate)
      const photosDir = FileSystem.documentDirectory + "proof_photos";
      try {
        const dirInfo = await FileSystem.getInfoAsync(photosDir);
        if (dirInfo.exists && dirInfo.isDirectory) {
          // For now, just show record count. Full storage calculation would require iterating files
          setStorageInfo(`${records.length} proof records`);
        }
      } catch (error) {
        setStorageInfo(`${records.length} proof records`);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleExportAllData = async () => {
    Alert.alert(
      "Export All Data",
      "This will generate a PDF containing all your proof records. This may take a while if you have many records. Would you like to proceed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Export",
          onPress: async () => {
            setExportingAll(true);
            try {
              const records = await getAllRecords();

              if (records.length === 0) {
                Alert.alert("No Data", "You have no proof records to export.");
                setExportingAll(false);
                return;
              }

              // Sort records by date (oldest first)
              const sortedRecords = [...records].sort((a, b) =>
                a.dateKey.localeCompare(b.dateKey)
              );

              // Build HTML for all records
              let allRecordsHtml = "";

              for (const record of sortedRecords) {
                const photos = await getPhotos(record.dateKey);
                let imagesHtml = "";

                for (const photo of photos) {
                  try {
                    const fileInfo = await FileSystem.getInfoAsync(
                      photo.fileUri
                    );
                    if (fileInfo.exists) {
                      const base64 = await FileSystem.readAsStringAsync(
                        photo.fileUri,
                        {
                          encoding: FileSystem.EncodingType.Base64,
                        }
                      );
                      const mimeType = photo.mimeType || "image/jpeg";
                      imagesHtml += `
                        <div style="margin: 10px 0; text-align: center;">
                          <img src="data:${mimeType};base64,${base64}" style="max-width: 100%; height: auto; page-break-inside: avoid;" />
                        </div>
                      `;
                    }
                  } catch (error) {
                    console.warn(
                      "Error loading photo for export:",
                      photo.fileUri,
                      error
                    );
                  }
                }

                const escapeHtml = (text: string): string => {
                  const map: { [key: string]: string } = {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#039;",
                  };
                  return text.replace(/[&<>"']/g, (m) => map[m]);
                };

                const dateStr = new Date(record.dateKey).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                );
                const timestampStr = new Date(record.createdAt).toLocaleString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                );

                allRecordsHtml += `
                  <div style="page-break-after: always; margin-bottom: 40px;">
                    <h2 style="color: #000; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px;">Proof Record - ${dateStr}</h2>
                    
                    <div style="margin: 15px 0;">
                      <div style="font-weight: 600; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Created At</div>
                      <div style="margin-top: 5px; font-size: 16px;">${timestampStr}</div>
                    </div>

                    ${
                      record.note
                        ? `
                    <div style="margin: 15px 0;">
                      <div style="font-weight: 600; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Note</div>
                      <div style="margin-top: 5px; font-size: 16px; white-space: pre-wrap; background: #f5f5f5; padding: 15px; border-radius: 4px;">${escapeHtml(
                        record.note
                      )}</div>
                    </div>
                    `
                        : ""
                    }

                    ${
                      photos.length > 0
                        ? `
                    <div style="margin: 15px 0;">
                      <div style="font-weight: 600; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Photos (${photos.length})</div>
                      ${imagesHtml}
                    </div>
                    `
                        : ""
                    }

                    <div style="margin: 15px 0;">
                      <div style="font-weight: 600; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Integrity Hash (SHA-256)</div>
                      <div style="margin-top: 5px; font-size: 12px; font-family: 'Courier New', monospace; word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px;">${
                        record.recordHash
                      }</div>
                    </div>
                  </div>
                `;
              }

              const html = `
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta charset="utf-8">
                    <style>
                      body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        max-width: 800px;
                        margin: 40px auto;
                        padding: 20px;
                        color: #333;
                      }
                      h1 {
                        color: #000;
                        border-bottom: 3px solid #000;
                        padding-bottom: 15px;
                        margin-bottom: 40px;
                      }
                      h2 {
                        color: #000;
                        border-bottom: 2px solid #000;
                        padding-bottom: 10px;
                        margin-bottom: 20px;
                      }
                    </style>
                  </head>
                  <body>
                    <h1>All Proof Records</h1>
                    <p style="color: #666; margin-bottom: 30px;">Total Records: ${
                      records.length
                    }</p>
                    ${allRecordsHtml}
                    <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center;">
                      Generated by Proof (offline, local-only) - ${new Date().toLocaleString()}
                    </div>
                  </body>
                </html>
              `;

              const { uri } = await Print.printToFileAsync({ html });

              // Copy PDF with proper filename
              const fileName = `proof-all-records-${
                new Date().toISOString().split("T")[0]
              }.pdf`;
              const newUri = FileSystem.documentDirectory + fileName;
              await FileSystem.copyAsync({
                from: uri,
                to: newUri,
              });

              await sharePDF(newUri);
              Alert.alert(
                "Success",
                `Exported ${records.length} proof records to PDF.`
              );
            } catch (error: any) {
              console.error("Error exporting all data:", error);
              Alert.alert(
                "Error",
                `Failed to export data: ${error.message || "Unknown error"}`
              );
            } finally {
              setExportingAll(false);
            }
          },
        },
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all your proof records and photos. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Are you absolutely sure?",
              "All proof records and photos will be permanently deleted. This cannot be reversed.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete Everything",
                  style: "destructive",
                  onPress: async () => {
                    setClearingAll(true);
                    try {
                      // Delete all records and get photo URIs
                      const photoUris = await deleteAllRecords();

                      // Delete all photo files
                      for (const photoUri of photoUris) {
                        try {
                          const fileInfo = await FileSystem.getInfoAsync(
                            photoUri
                          );
                          if (fileInfo.exists) {
                            await FileSystem.deleteAsync(photoUri, {
                              idempotent: true,
                            });
                          }
                        } catch (error) {
                          console.warn(
                            "Error deleting photo file:",
                            photoUri,
                            error
                          );
                        }
                      }

                      // Reload stats
                      await loadStats();

                      Alert.alert("Success", "All data has been cleared.");
                    } catch (error) {
                      console.error("Error clearing all data:", error);
                      Alert.alert(
                        "Error",
                        "Failed to clear data. Please try again."
                      );
                    } finally {
                      setClearingAll(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all your proof records. This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Are you absolutely sure?",
              "This will permanently delete:\n\n• Your account\n• All proof records\n• All photos\n\nThis cannot be reversed.",
              [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Delete Everything",
                  style: "destructive",
                  onPress: async () => {
                    setDeletingAccount(true);
                    try {
                      // Delete all proof records and get photo URIs
                      const photoUris = await deleteAllRecords();

                      // Delete all photo files
                      for (const photoUri of photoUris) {
                        try {
                          const fileInfo = await FileSystem.getInfoAsync(
                            photoUri
                          );
                          if (fileInfo.exists) {
                            await FileSystem.deleteAsync(photoUri, {
                              idempotent: true,
                            });
                          }
                        } catch (error) {
                          console.warn(
                            "Error deleting photo file:",
                            photoUri,
                            error
                          );
                        }
                      }

                      // Delete user account (this will also clear session)
                      await deleteAccount();

                      // Navigation will be handled by AuthNavigator
                    } catch (error) {
                      console.error("Error deleting account:", error);
                      Alert.alert(
                        "Error",
                        "Failed to delete account. Please try again."
                      );
                      setDeletingAccount(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <>
      <ScrollView
        ref={scrollViewRef}
        style={[styles.container, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}></View>

          {/* Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.card}>
              <View style={styles.accountHeader}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={24} color="#666" />
                </View>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>{user?.name || "User"}</Text>
                  <Text style={styles.accountEmail}>{user?.email || ""}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <Ionicons name={"mail-outline"} size={20} color={"#666"} />
                  <Text style={styles.infoLabel}>Email Status</Text>
                </View>
                <View style={styles.verificationStatus}>
                  {emailVerified ? (
                    <>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#34C759"
                      />
                      <Text style={[styles.infoValue, styles.verifiedText]}>
                        Verified
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="close-circle" size={16} color="#FF3B30" />
                      <Text style={[styles.infoValue, styles.unverifiedText]}>
                        Not Verified
                      </Text>
                    </>
                  )}
                </View>
              </View>
              <View style={styles.divider} />
              <SettingItem
                icon="lock-closed-outline"
                label="Change Password"
                onPress={() => navigation.navigate("ChangePassword")}
              />
            </View>
          </View>

          {/* Data Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data & Storage</Text>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <Ionicons
                    name="document-text-outline"
                    size={20}
                    color="#666"
                  />
                  <Text style={styles.infoLabel}>Total Records</Text>
                </View>
                <Text style={styles.infoValue}>
                  {totalRecords !== null ? totalRecords : "—"}
                </Text>
              </View>
              {storageInfo && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <View style={styles.infoLeft}>
                      <Ionicons name="folder-outline" size={20} color="#666" />
                      <Text style={styles.infoLabel}>Storage</Text>
                    </View>
                    <Text style={styles.infoValue}>{storageInfo}</Text>
                  </View>
                </>
              )}
              <View style={styles.divider} />
              <SettingItem
                icon="download-outline"
                label="Export All Data"
                onPress={handleExportAllData}
                isLoading={exportingAll}
              />
              <View style={styles.divider} />
              <SettingItem
                icon="trash-outline"
                label="Clear All Data"
                onPress={handleClearAllData}
                danger
                isLoading={clearingAll}
              />
            </View>
          </View>

          {/* Journal Prompts Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Journal Prompts</Text>
            <View style={styles.card}>
              <SettingItem
                icon="bulb-outline"
                label="Manage Prompts"
                onPress={() => navigation.navigate("PromptsSettings")}
              />
            </View>
          </View>

          {/* Reminders Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reminders</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.settingItem}
                onPress={handleToggleReminder}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name="notifications-outline"
                      size={20}
                      color="#000"
                    />
                  </View>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingLabel}>Daily Reminder</Text>
                    <Text style={styles.settingValue}>
                      {reminderEnabled ? "Enabled" : "Disabled"}
                    </Text>
                  </View>
                </View>
                <View
                  style={reminderEnabled ? styles.toggleOn : styles.toggleOff}
                >
                  <View
                    style={
                      reminderEnabled
                        ? styles.toggleThumbOn
                        : styles.toggleThumbOff
                    }
                  />
                </View>
              </TouchableOpacity>
              {reminderEnabled && (
                <>
                  <View style={styles.divider} />
                  <TouchableOpacity
                    style={styles.settingItem}
                    onPress={handleSetReminderTime}
                    activeOpacity={0.7}
                  >
                    <View style={styles.settingLeft}>
                      <View style={styles.iconContainer}>
                        <Ionicons name="time-outline" size={20} color="#000" />
                      </View>
                      <View style={styles.settingTextContainer}>
                        <Text style={styles.settingLabel}>Reminder Time</Text>
                        <Text style={styles.settingValue}>
                          {(() => {
                            const [hours, minutes] = reminderTime.split(":");
                            const hour12 = parseInt(hours) % 12 || 12;
                            const ampm = parseInt(hours) >= 12 ? "PM" : "AM";
                            return `${hour12}:${minutes} ${ampm}`;
                          })()}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          {/* this will be commented out until we have a use for it */}
          {/* Appearance Section */}
          {/* <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appearance</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.settingItem}
                onPress={handleToggleStatisticsTab}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name="stats-chart-outline"
                      size={20}
                      color="#000"
                    />
                  </View>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingLabel}>Statistics Tab</Text>
                    <Text style={styles.settingValue}>
                      {statisticsTabVisible ? "Visible" : "Hidden"}
                    </Text>
                  </View>
                </View>
                <View
                  style={
                    statisticsTabVisible ? styles.toggleOn : styles.toggleOff
                  }
                >
                  <View
                    style={
                      statisticsTabVisible
                        ? styles.toggleThumbOn
                        : styles.toggleThumbOff
                    }
                  />
                </View>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.settingItem}
                onPress={handleToggleMapTab}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="map-outline" size={20} color="#000" />
                  </View>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingLabel}>Map Tab</Text>
                    <Text style={styles.settingValue}>
                      {mapTabVisible ? "Visible" : "Hidden"}
                    </Text>
                  </View>
                </View>
                <View
                  style={mapTabVisible ? styles.toggleOn : styles.toggleOff}
                >
                  <View
                    style={
                      mapTabVisible
                        ? styles.toggleThumbOn
                        : styles.toggleThumbOff
                    }
                  />
                </View>
              </TouchableOpacity>
            </View>
          </View> */}

          {/* App Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App</Text>
            <View style={styles.card}>
              <SettingItem
                icon="help-circle-outline"
                label="Help & FAQ"
                onPress={() => navigation.navigate("Help")}
              />
              <View style={styles.divider} />
              <SettingItem
                icon="information-circle-outline"
                label="About Proof"
                onPress={() => navigation.navigate("About")}
              />
              <View style={styles.divider} />
              <SettingItem
                icon="shield-checkmark-outline"
                label="Privacy & Security"
                onPress={() => navigation.navigate("Privacy")}
              />
              <View style={styles.divider} />
              <SettingItem
                icon="document-text-outline"
                label="Terms of Service"
                onPress={() => navigation.navigate("TermsOfService")}
              />
              <View style={styles.divider} />
              <SettingItem
                icon="mail-outline"
                label="Contact & Support"
                onPress={() => navigation.navigate("Contact")}
              />
              {user?.email === "michaelhalperin2@gmail.com" && (
                <>
                  <View style={styles.divider} />
                  <SettingItem
                    icon="shield-outline"
                    label="Admin Dashboard"
                    onPress={() => navigation.navigate("AdminDashboard")}
                  />
                </>
              )}
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <View style={styles.infoLeft}>
                  <Ionicons name="cube-outline" size={20} color="#666" />
                  <Text style={styles.infoLabel}>Version</Text>
                </View>
                <Text style={styles.infoValue}>1.0.0</Text>
              </View>
            </View>
          </View>

          {/* Account Actions */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleLogout}
              activeOpacity={0.7}
              disabled={deletingAccount}
            >
              <Ionicons name="log-out-outline" size={20} color="#ff3b30" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.deleteAccountButton,
                deletingAccount && styles.buttonDisabled,
              ]}
              onPress={handleDeleteAccount}
              activeOpacity={0.7}
              disabled={deletingAccount}
            >
              {deletingAccount ? (
                <ActivityIndicator color="#ff3b30" size="small" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={20} color="#ff3b30" />
                  <Text style={styles.deleteAccountText}>Delete Account</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Spacing */}
          <View style={styles.footer} />
        </View>
      </ScrollView>

      {/* Time Input Modal */}
      <Modal
        visible={showTimeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTimeModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowTimeModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalKeyboardAvoid}
            keyboardVerticalOffset={0}
          >
            <Pressable
              style={styles.modalContent}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Set Reminder Time</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowTimeModal(false)}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.timeInputContainer}>
                <View style={styles.timeDisplay}>
                  <Text style={styles.timeDisplayText}>
                    {(() => {
                      try {
                        const [hours, minutes] = tempTimeInput
                          .split(":")
                          .map(Number);
                        if (isNaN(hours) || isNaN(minutes))
                          return tempTimeInput || "20:00";
                        const hour12 = hours % 12 || 12;
                        const ampm = hours >= 12 ? "PM" : "AM";
                        return `${hour12.toString().padStart(2, "0")}:${minutes
                          .toString()
                          .padStart(2, "0")} ${ampm}`;
                      } catch {
                        return tempTimeInput || "20:00";
                      }
                    })()}
                  </Text>
                  <Text style={styles.timeDisplaySubtext}>
                    {tempTimeInput || "20:00"} (24-hour format)
                  </Text>
                </View>

                <View style={styles.timeInputGroup}>
                  <View style={styles.timeInputField}>
                    <Text style={styles.timeInputLabel}>Hour (00-23)</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={tempTimeInput.split(":")[0] || ""}
                      onChangeText={(text) => {
                        const num = text.replace(/[^0-9]/g, "");
                        // Allow empty or valid hour (0-23)
                        if (
                          num === "" ||
                          (parseInt(num) >= 0 && parseInt(num) <= 23)
                        ) {
                          const currentMinute =
                            tempTimeInput.split(":")[1] || "00";
                          // Don't pad while typing - only store the raw number
                          setTempTimeInput(`${num}:${currentMinute}`);
                        }
                      }}
                      onBlur={() => {
                        // Format with padding only when user finishes typing
                        const [hour, minute] = tempTimeInput.split(":");
                        const formattedHour = hour
                          ? hour.padStart(2, "0")
                          : "20";
                        const formattedMinute = minute || "00";
                        setTempTimeInput(`${formattedHour}:${formattedMinute}`);
                      }}
                      placeholder="20"
                      keyboardType="number-pad"
                      maxLength={2}
                      autoFocus
                    />
                  </View>
                  <Text style={styles.timeSeparator}>:</Text>
                  <View style={styles.timeInputField}>
                    <Text style={styles.timeInputLabel}>Minute (00-59)</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={tempTimeInput.split(":")[1] || ""}
                      onChangeText={(text) => {
                        const num = text.replace(/[^0-9]/g, "");
                        // Allow empty or valid minute (0-59)
                        if (
                          num === "" ||
                          (parseInt(num) >= 0 && parseInt(num) <= 59)
                        ) {
                          const currentHour =
                            tempTimeInput.split(":")[0] || "20";
                          // Don't pad while typing - only store the raw number
                          setTempTimeInput(`${currentHour}:${num}`);
                        }
                      }}
                      onBlur={() => {
                        // Format with padding only when user finishes typing
                        const [hour, minute] = tempTimeInput.split(":");
                        const formattedHour = hour || "20";
                        const formattedMinute = minute
                          ? minute.padStart(2, "0")
                          : "00";
                        setTempTimeInput(`${formattedHour}:${formattedMinute}`);
                      }}
                      placeholder="00"
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setShowTimeModal(false)}
                >
                  <Text style={styles.modalButtonCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSave]}
                  onPress={handleSaveReminderTime}
                >
                  <Text style={styles.modalButtonSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    paddingVertical: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    overflow: "hidden",
  },
  accountHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
    color: "#000",
    marginBottom: 4,
  },
  accountEmail: {
    fontSize: 14,
    fontFamily: getFontFamily("regular"),
    color: "#666",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e5e5",
    marginLeft: 52,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconContainerDanger: {
    backgroundColor: "#ffebee",
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "400",
    fontFamily: getFontFamily("regular"),
    color: "#000",
  },
  settingLabelDanger: {
    color: "#ff3b30",
  },
  settingValue: {
    fontSize: 13,
    fontFamily: getFontFamily("regular"),
    color: "#666",
    marginTop: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  infoLabel: {
    fontSize: 15,
    color: "#666",
    marginLeft: 12,
    fontWeight: "400",
    fontFamily: getFontFamily("regular"),
  },
  infoValue: {
    fontSize: 15,
    color: "#000",
    fontWeight: "500",
    fontFamily: getFontFamily("medium"),
  },
  verificationStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  verifiedText: {
    color: "#34C759",
  },
  unverifiedText: {
    color: "#FF3B30",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ff3b30",
    backgroundColor: "#fff",
  },
  signOutText: {
    fontSize: 16,
    color: "#ff3b30",
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
    marginLeft: 8,
  },
  deleteAccountButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ff3b30",
    backgroundColor: "#fff",
    marginTop: 12,
  },
  deleteAccountText: {
    fontSize: 16,
    color: "#ff3b30",
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  footer: {
    height: 20,
  },
  toggleOn: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#34C759",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleOff: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#ccc",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleThumbOn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#fff",
    alignSelf: "flex-end",
  },
  toggleThumbOff: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#fff",
    alignSelf: "flex-start",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalKeyboardAvoid: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: getFontFamily("bold"),
    color: "#000",
  },
  modalCloseButton: {
    padding: 4,
  },
  timeInputContainer: {
    padding: 24,
    paddingBottom: 16,
  },
  timeDisplay: {
    alignItems: "center",
    marginBottom: 32,
    paddingVertical: 20,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
  },
  timeDisplayText: {
    fontSize: 48,
    fontWeight: "700",
    fontFamily: getFontFamily("bold"),
    color: "#000",
    marginBottom: 8,
    letterSpacing: 2,
  },
  timeDisplaySubtext: {
    fontSize: 14,
    color: "#666",
    fontFamily: "monospace",
  },
  timeInputGroup: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 12,
  },
  timeInputField: {
    flex: 1,
  },
  timeInputLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
    fontWeight: "500",
    fontFamily: getFontFamily("medium"),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  timeInput: {
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    textAlign: "center",
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
    color: "#000",
    backgroundColor: "#fafafa",
  },
  timeSeparator: {
    fontSize: 32,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
    color: "#666",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#f5f5f5",
  },
  modalButtonSave: {
    backgroundColor: "#000",
  },
  modalButtonCancelText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
  },
  modalButtonSaveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
  },
});
