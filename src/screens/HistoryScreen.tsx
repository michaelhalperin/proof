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
import { getAllRecords } from "../db/database";

type HistoryScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "History">,
  NativeStackNavigationProp<RootStackParamList>
>;

interface DayStatus {
  dateKey: string;
  isLogged: boolean;
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
      const loggedDateKeys = new Set(records.map((r) => r.dateKey));
      setLoggedDateKeysSet(loggedDateKeys);
      const last30Days = getLastNDays(30);

      const dayStatuses: DayStatus[] = last30Days.map((dateKey) => ({
        dateKey,
        isLogged: loggedDateKeys.has(dateKey),
      }));

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

    return (
      <TouchableOpacity
        style={[
          styles.dayRow,
          !isClickable && styles.dayRowDisabled,
          isToday && styles.dayRowToday,
        ]}
        onPress={() => handleDayPress(item.dateKey, item.isLogged)}
        disabled={!isClickable}
      >
        <Text style={[styles.dateText, isToday && styles.dateTextToday]}>
          {formatDateKey(item.dateKey)}
          {isToday && " (Today)"}
        </Text>
        <Text style={styles.statusText}>
          {item.isLogged ? "✓ Logged" : "○ Missing"}
        </Text>
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
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  dayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dayRowDisabled: {
    opacity: 0.5,
  },
  dayRowToday: {
    backgroundColor: "#f9f9f9",
  },
  dateText: {
    fontSize: 16,
    color: "#000",
  },
  dateTextToday: {
    fontWeight: "600",
  },
  statusText: {
    fontSize: 16,
    color: "#666",
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
