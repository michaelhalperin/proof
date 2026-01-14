import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useNavigation,
  useFocusEffect,
  CompositeNavigationProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { Calendar, DateData } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList, TabParamList } from "../types/navigation";
import {
  getTodayDateKey,
  getLastNDays,
  formatDateKey,
} from "../utils/dateUtils";
import { getAllRecords, getRecord, getPhotos, Record, Photo } from "../db/database";
import { getFontFamily } from "../config/theme";
import { Image } from "expo-image";

type HistoryScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "History">,
  NativeStackNavigationProp<RootStackParamList>
>;

interface DayStatus {
  dateKey: string;
  isLogged: boolean;
  record?: Record;
  photoCount: number;
  photos?: Photo[];
  hasNote: boolean;
  pinned?: boolean;
}

type ViewMode = "timeline" | "calendar";

export default function HistoryScreen() {
  const navigation = useNavigation<HistoryScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const todayDateKey = getTodayDateKey();
  const [days, setDays] = useState<DayStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [markedDates, setMarkedDates] = useState<{ [key: string]: any }>({});
  const [loggedDateKeysSet, setLoggedDateKeysSet] = useState<Set<string>>(
    new Set()
  );
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  // Reload history when screen comes into focus (e.g., after deleting a proof)
  useFocusEffect(
    useCallback(() => {
      // Scroll to top when screen comes into focus
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    try {
      const records = await getAllRecords();
      const recordsMap = new Map<string, Record>();
      records.forEach((r) => recordsMap.set(r.dateKey, r));
      
      const loggedDateKeys = new Set(records.map((r) => r.dateKey));
      setLoggedDateKeysSet(loggedDateKeys);
      const last30Days = getLastNDays(30);

      // Load photo counts for logged days
      const dayStatuses: DayStatus[] = await Promise.all(
        last30Days.map(async (dateKey) => {
          const isLogged = loggedDateKeys.has(dateKey);
          let photoCount = 0;
          let hasNote = false;
          let record: Record | undefined;
          let pinned = false;

          if (isLogged) {
            record = recordsMap.get(dateKey);
            pinned = record?.pinned === true || record?.pinned === 1;
            hasNote = !!(record?.note && record.note.trim().length > 0);
            const photos = await getPhotos(dateKey);
            photoCount = photos.length;
            
            return {
              dateKey,
              isLogged,
              record,
              photoCount,
              photos: photos.slice(0, 3), // Store first 3 photos for thumbnails
              hasNote,
              pinned,
            };
          }

          return {
            dateKey,
            isLogged,
            record,
            photoCount,
            photos: [],
            hasNote,
            pinned,
          };
        })
      );

      // Reverse to show today first (newest first)
      setDays(dayStatuses.reverse());

      // Build marked dates object for calendar - mark ALL logged dates (not just last 30)
      const marked: { [key: string]: any } = {};

      // Mark all logged dates from all records
      loggedDateKeys.forEach((dateKey) => {
        marked[dateKey] = {
          marked: true,
          dotColor: "#000",
          selectedColor: "#000",
        };
      });

      // Mark today
      if (marked[todayDateKey]) {
        marked[todayDateKey].selected = true;
        marked[todayDateKey].selectedColor = "#000";
      } else {
        marked[todayDateKey] = {
          selected: true,
          selectedColor: "#e0e0e0",
        };
      }

      setMarkedDates(marked);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDayPress = (dateKey: string, isLogged: boolean) => {
    if (isLogged) {
      navigation.navigate("DayDetail", { dateKey });
    }
  };

  const handleCalendarDayPress = (day: DateData) => {
    const dateKey = day.dateString;
    const isLogged = loggedDateKeysSet.has(dateKey);

    if (isLogged) {
      // Navigate to view the proof record
      navigation.navigate("DayDetail", { dateKey });
    } else {
      // Show "Missing" message for dates without logs
      const formattedDate = formatDateKey(dateKey);
      Alert.alert("Missing", `No proof logged for ${formattedDate}`);
    }
  };

  const handleLogToday = () => {
    navigation.navigate("LogToday", {});
  };

  const renderDay = ({ item }: { item: DayStatus }) => {
    const isToday = item.dateKey === todayDateKey;
    const isClickable = item.isLogged;

    // Calculate activity density (more photos/notes = more visual)
    const densityScore = (item.photoCount > 0 ? 1 : 0) + (item.hasNote ? 1 : 0) + (item.photoCount > 2 ? 1 : 0);
    const isHighActivity = densityScore >= 2;

    return (
      <TouchableOpacity
        style={[
          styles.dayCard,
          !isClickable && styles.dayCardDisabled,
          isToday && styles.dayCardToday,
          isHighActivity && styles.dayCardHighActivity,
          item.pinned && styles.dayCardPinned,
        ]}
        onPress={() => handleDayPress(item.dateKey, item.isLogged)}
        disabled={!isClickable}
        activeOpacity={0.7}
      >
        <View style={styles.dayCardHeader}>
          <View style={styles.dayCardLeft}>
            <Text style={[styles.dateText, isToday && styles.dateTextToday]}>
              {formatDateKey(item.dateKey)}
              {isToday && " (Today)"}
            </Text>
            <View style={styles.dayCardMeta}>
              {item.isLogged ? (
                <>
                  {item.pinned && (
                    <Ionicons name="star" size={14} color="#FFD700" style={styles.pinIcon} />
                  )}
                  {item.photoCount > 0 && (
                    <View style={styles.metaBadge}>
                      <Ionicons name="images" size={12} color="#666" />
                      <Text style={styles.metaText}>{item.photoCount}</Text>
                    </View>
                  )}
                  {item.hasNote && (
                    <View style={styles.metaBadge}>
                      <Ionicons name="document-text" size={12} color="#666" />
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.statusText}>○ Missing</Text>
              )}
            </View>
          </View>
          {item.isLogged && (
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, isHighActivity && styles.statusDotActive]} />
            </View>
          )}
        </View>

        {/* Photo Thumbnails */}
        {item.isLogged && item.photoCount > 0 && item.photos && (
          <View style={styles.photoThumbnails}>
            {item.photos.slice(0, 3).map((photo, index) => {
              const imageUri = photo.fileUri.startsWith("file://") 
                ? photo.fileUri 
                : `file://${photo.fileUri}`;
              return (
                <Image
                  key={photo.id}
                  source={{ uri: imageUri }}
                  style={styles.photoThumbnail}
                  contentFit="cover"
                />
              );
            })}
            {item.photoCount > 3 && (
              <View style={styles.photoThumbnailMore}>
                <Text style={styles.photoThumbnailMoreText}>+{item.photoCount - 3}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const todayStatus = days.find((d) => d.dateKey === todayDateKey);
  const showLogTodayButton = todayStatus && !todayStatus.isLogged;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* View Toggle */}
      <View style={styles.viewToggleContainer}>
        <TouchableOpacity
          style={[
            styles.viewToggleButton,
            viewMode === "timeline" && styles.viewToggleButtonActive,
          ]}
          onPress={() => setViewMode("timeline")}
        >
          <Ionicons
            name="list-outline"
            size={20}
            color={viewMode === "timeline" ? "#fff" : "#666"}
          />
          <Text
            style={[
              styles.viewToggleText,
              viewMode === "timeline" && styles.viewToggleTextActive,
            ]}
          >
            Timeline
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.viewToggleButton,
            viewMode === "calendar" && styles.viewToggleButtonActive,
          ]}
          onPress={() => setViewMode("calendar")}
        >
          <Ionicons
            name="calendar-outline"
            size={20}
            color={viewMode === "calendar" ? "#fff" : "#666"}
          />
          <Text
            style={[
              styles.viewToggleText,
              viewMode === "calendar" && styles.viewToggleTextActive,
            ]}
          >
            Calendar
          </Text>
        </TouchableOpacity>
      </View>

      {showLogTodayButton && (
        <View style={styles.logTodayContainer}>
          <TouchableOpacity
            style={styles.logTodayButton}
            onPress={handleLogToday}
          >
            <Text style={styles.logTodayButtonText}>Log Today</Text>
          </TouchableOpacity>
        </View>
      )}

      {viewMode === "timeline" ? (
        <FlatList
          ref={flatListRef}
          data={days}
          renderItem={renderDay}
          keyExtractor={(item) => item.dateKey}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>No Records Yet</Text>
              <Text style={styles.emptyText}>
                Start creating your daily proof records to see them here.
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('LogToday', {})}
              >
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.emptyButtonText}>Create First Record</Text>
              </TouchableOpacity>
            </View>
          }
        />
      ) : (
        <View style={styles.calendarWrapper}>
          <Calendar
            onDayPress={handleCalendarDayPress}
            markedDates={markedDates}
            markingType="dot"
            theme={{
              backgroundColor: "#f0f2f5",
              calendarBackground: "#f0f2f5",
              textSectionTitleColor: "#666",
              selectedDayBackgroundColor: "#000",
              selectedDayTextColor: "#ffffff",
              todayTextColor: "#000",
              dayTextColor: "#000",
              textDisabledColor: "#d9d9d9",
              dotColor: "#000",
              selectedDotColor: "#ffffff",
              arrowColor: "#000",
              monthTextColor: "#000",
              indicatorColor: "#000",
              textDayFontFamily: "System",
              textMonthFontFamily: "System",
              textDayHeaderFontFamily: "System",
              textDayFontWeight: "400",
              textMonthFontWeight: "600",
              textDayHeaderFontWeight: "600",
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 13,
            }}
            style={styles.calendar}
            hideExtraDays={true}
            enableSwipeMonths={true}
            allowSelectionOutOfRange={false}
          />
          <View style={styles.calendarLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#000" }]} />
              <Text style={styles.legendText}>Logged</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  viewToggleContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    gap: 8,
  },
  viewToggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    gap: 6,
  },
  viewToggleButtonActive: {
    backgroundColor: "#000",
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
    color: "#666",
  },
  viewToggleTextActive: {
    color: "#fff",
  },
  logTodayContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  logTodayButton: {
    backgroundColor: "#000",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  logTodayButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  dayCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dayCardDisabled: {
    opacity: 0.5,
  },
  dayCardToday: {
    borderWidth: 2,
    borderColor: "#000",
    backgroundColor: "#fafafa",
  },
  dayCardHighActivity: {
    borderWidth: 2,
    borderColor: "#000",
    backgroundColor: "#f9f9f9",
  },
  dayCardPinned: {
    borderColor: "#FFD700",
    borderWidth: 2,
  },
  dayCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  dayCardLeft: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontFamily: getFontFamily("regular"),
    color: "#000",
    marginBottom: 6,
  },
  dateTextToday: {
    fontWeight: "700",
    fontFamily: getFontFamily("bold"),
  },
  dayCardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  pinIcon: {
    marginRight: 4,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
  },
  metaText: {
    fontSize: 12,
    color: "#666",
    fontFamily: getFontFamily("regular"),
  },
  statusText: {
    fontSize: 14,
    color: "#999",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
  },
  statusDotActive: {
    backgroundColor: "#000",
  },
  photoThumbnails: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  photoThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
  },
  photoThumbnailMore: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  photoThumbnailMoreText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#666",
    marginTop: 24,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
    maxWidth: 300,
  },
  emptyButton: {
    flexDirection: "row",
    backgroundColor: "#000",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    gap: 8,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  calendarWrapper: {
    flex: 1,
  },
  calendar: {
    borderWidth: 0,
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  calendarLegend: {
    padding: 20,
    alignItems: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 14,
    color: "#666",
  },
});
