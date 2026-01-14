import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useNavigation,
  useFocusEffect,
  CompositeNavigationProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList, TabParamList } from "../types/navigation";
import { getTodayDateKey, formatDateKey } from "../utils/dateUtils";
import {
  recordExists,
  getAllRecords,
  getRecord,
  getPhotos,
  getPinnedRecords,
} from "../db/database";
import { Record } from "../db/database";
import { getFontFamily } from "../config/theme";

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Home">,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const [todayDateKey] = useState(getTodayDateKey());
  const [isLogged, setIsLogged] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayRecord, setTodayRecord] = useState<Record | null>(null);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [photoCount, setPhotoCount] = useState<number>(0);
  const [pinnedRecords, setPinnedRecords] = useState<Record[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  const loadData = async () => {
    try {
      const exists = await recordExists(todayDateKey);
      setIsLogged(exists);

      if (exists) {
        const record = await getRecord(todayDateKey);
        const photos = await getPhotos(todayDateKey);
        setTodayRecord(record);
        setPhotoCount(photos.length);
      }

      const allRecords = await getAllRecords();
      setTotalRecords(allRecords.length);
      
      // Load pinned records
      const pinned = await getPinnedRecords();
      setPinnedRecords(pinned.slice(0, 3)); // Show max 3 pinned
    } catch (error) {
      // Log error but don't show alert - empty state is acceptable
      setIsLogged(false);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      // Scroll to top when screen comes into focus
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      loadData();
    }, [todayDateKey])
  );

  const handlePrimaryAction = () => {
    if (isLogged) {
      navigation.navigate("DayDetail", { dateKey: todayDateKey });
    } else {
      navigation.navigate("LogToday", {});
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <ActivityIndicator size="large" color="#000" style={styles.loader} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      style={[styles.container, { paddingTop: insets.top + 20 }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Today</Text>
          <Text style={styles.dateText}>{formatDateKey(todayDateKey)}</Text>
        </View>

        {/* Today's Status Card */}
        <View style={styles.card}>
          <View style={styles.statusHeader}>
            <Ionicons
              name={isLogged ? "checkmark-circle" : "ellipse-outline"}
              size={24}
              color={isLogged ? "#34C759" : "#999"}
              style={styles.statusIcon}
            />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>
                {isLogged ? "Proof Logged" : "No Proof Yet"}
              </Text>
              <Text style={styles.statusSubtitle}>
                {isLogged
                  ? `Created at ${
                      todayRecord
                        ? new Date(todayRecord.createdAt).toLocaleTimeString(
                            "en-US",
                            { hour: "2-digit", minute: "2-digit" }
                          )
                        : ""
                    }`
                  : "Create your proof for today"}
              </Text>
            </View>
          </View>

          {isLogged && todayRecord && (
            <View style={styles.recordPreview}>
              <View style={styles.recordPreviewRow}>
                <Ionicons name="document-text-outline" size={18} color="#666" />
                <Text style={styles.recordPreviewText} numberOfLines={1}>
                  {todayRecord.note || "No note"}
                </Text>
              </View>
              {photoCount > 0 && (
                <View style={styles.recordPreviewRow}>
                  <Ionicons name="images-outline" size={18} color="#666" />
                  <Text style={styles.recordPreviewText}>
                    {photoCount} {photoCount === 1 ? "photo" : "photos"}
                  </Text>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.primaryButton,
              isLogged && styles.primaryButtonLogged,
            ]}
            onPress={handlePrimaryAction}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isLogged ? "eye-outline" : "add-circle-outline"}
              size={20}
              color="#fff"
              style={styles.buttonIcon}
            />
            <Text style={styles.primaryButtonText}>
              {isLogged ? "View Today's Proof" : "Log Today"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="calendar-outline" size={24} color="#000" />
            <Text style={styles.statValue}>{totalRecords}</Text>
            <Text style={styles.statLabel}>Total Records</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-done-outline" size={24} color="#000" />
            <Text style={styles.statValue}>{isLogged ? 1 : 0}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
        </View>

        {/* Starred Records */}
        {pinnedRecords.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={20} color="#FFD700" />
              <Text style={styles.sectionTitle}>Starred Records</Text>
            </View>
            <View style={styles.starredContainer}>
              {pinnedRecords.map((record) => (
                <TouchableOpacity
                  key={record.dateKey}
                  style={styles.starredCard}
                  onPress={() =>
                    navigation.navigate("DayDetail", { dateKey: record.dateKey })
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.starredCardHeader}>
                    <Text style={styles.starredDate}>
                      {formatDateKey(record.dateKey)}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color="#999" />
                  </View>
                  {record.note && record.note.trim() && (
                    <Text style={styles.starredNote} numberOfLines={2}>
                      {record.note}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            {pinnedRecords.length > 0 && (
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => navigation.navigate("History")}
                activeOpacity={0.7}
              >
                <Text style={styles.viewAllText}>View All in History</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 20,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    fontFamily: getFontFamily("regular"),
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 32,
    fontWeight: "700",
    fontFamily: getFontFamily("bold"),
    color: "#000",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "400",
    fontFamily: getFontFamily("regular"),
    color: "#666",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  statusIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
    color: "#000",
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: "#666",
    fontWeight: "400",
    fontFamily: getFontFamily("regular"),
  },
  recordPreview: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  recordPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  recordPreviewText: {
    fontSize: 14,
    color: "#666",
    fontFamily: getFontFamily("regular"),
    flex: 1,
  },
  primaryButton: {
    backgroundColor: "#000",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  primaryButtonLogged: {
    backgroundColor: "#333",
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: getFontFamily("bold"),
    color: "#000",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    fontFamily: getFontFamily("medium"),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  section: {
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
    color: "#000",
  },
  starredContainer: {
    gap: 12,
  },
  starredCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  starredCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  starredDate: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
    color: "#000",
  },
  starredNote: {
    fontSize: 14,
    fontFamily: getFontFamily("regular"),
    color: "#666",
    lineHeight: 20,
  },
  viewAllButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: getFontFamily("medium"),
    color: "#666",
    textDecorationLine: "underline",
  },
});
