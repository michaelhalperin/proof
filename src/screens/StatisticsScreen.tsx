import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LineChart, BarChart } from "react-native-chart-kit";
import { getAllRecords, Photo } from "../db/database";
import * as SQLite from "expo-sqlite";
import {
  calculateStatistics,
  generateCalendarHeatmap,
  Statistics,
  CalendarHeatmapData,
} from "../utils/statistics";
import dayjs from "dayjs";
import { getFontFamily } from "../config/theme";

const screenWidth = Dimensions.get("window").width;

export default function StatisticsScreen() {
  const insets = useSafeAreaInsets();
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [heatmapData, setHeatmapData] = useState<CalendarHeatmapData>({});
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const records = await getAllRecords();

      // Get all photos for statistics
      const db = await SQLite.openDatabaseAsync("proof.db");
      const allPhotos = await db.getAllAsync<Photo>("SELECT * FROM photos");

      const stats = calculateStatistics(records, allPhotos);
      const heatmap = generateCalendarHeatmap(records);
      setStatistics(stats);
      setHeatmapData(heatmap);
    } catch (error) {
      console.error("Error loading statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      loadStatistics();
    }, [])
  );

  if (loading || !statistics) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <ActivityIndicator size="large" color="#000" style={styles.loader} />
        <Text style={styles.loadingText}>Loading statistics...</Text>
      </View>
    );
  }

  // Empty state - no records
  if (statistics.totalRecords === 0) {
    return (
      <ScrollView
        ref={scrollViewRef}
        style={[styles.container, { paddingTop: insets.top + 20 }]}
        contentContainerStyle={styles.emptyContainer}
      >
        <Ionicons name="stats-chart-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>No Statistics Available</Text>
        <Text style={styles.emptyText}>
          Create your first proof record to see statistics and insights about your activity.
        </Text>
      </ScrollView>
    );
  }

  // Prepare chart data
  const monthLabels = statistics.activityByMonth.map((m) =>
    dayjs(m.month).format("MMM")
  );
  const monthData = statistics.activityByMonth.map((m) => m.count);

  const weekLabels = statistics.activityByWeek.map((w) => {
    if (!w.week) return "W0";
    const [year, week] = w.week.split("-W");
    return `W${week || "0"}`;
  });
  const weekData = statistics.activityByWeek.map((w) => w.count);

  // Generate calendar heatmap grid (last 12 months)
  const today = dayjs();
  const monthsToShow = 12;
  const calendarDays: { date: dayjs.Dayjs; count: number }[] = [];

  for (let i = monthsToShow - 1; i >= 0; i--) {
    const monthStart = today.subtract(i, "month").startOf("month");
    const daysInMonth = monthStart.daysInMonth();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = monthStart.date(day);
      const dateKey = date.format("YYYY-MM-DD");
      calendarDays.push({
        date,
        count: heatmapData[dateKey]?.count || 0,
      });
    }
  }

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#000",
    },
  };

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
          <Text style={styles.title}>Statistics</Text>
        </View>

        {/* Overview Cards */}
        <View style={styles.overviewGrid}>
          <View style={styles.overviewCard}>
            <Ionicons name="document-text" size={24} color="#000" />
            <Text style={styles.overviewValue}>{statistics.totalRecords}</Text>
            <Text style={styles.overviewLabel}>Total Records</Text>
          </View>
          <View style={styles.overviewCard}>
            <Ionicons name="location" size={24} color="#000" />
            <Text style={styles.overviewValue}>
              {statistics.recordsWithLocation}
            </Text>
            <Text style={styles.overviewLabel}>With Location</Text>
          </View>
          <View style={styles.overviewCard}>
            <Ionicons name="pricetags" size={24} color="#000" />
            <Text style={styles.overviewValue}>
              {statistics.recordsWithTags}
            </Text>
            <Text style={styles.overviewLabel}>With Tags</Text>
          </View>
          <View style={styles.overviewCard}>
            <Ionicons name="flame" size={24} color="#000" />
            <Text style={styles.overviewValue}>{statistics.currentStreak}</Text>
            <Text style={styles.overviewLabel}>Current Streak</Text>
          </View>
        </View>

        {/* Streaks Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Streaks</Text>
          <View style={styles.streakContainer}>
            <View style={styles.streakCard}>
              <Text style={styles.streakLabel}>Longest Streak</Text>
              <Text style={styles.streakValue}>{statistics.longestStreak}</Text>
              <Text style={styles.streakUnit}>days</Text>
            </View>
            <View style={styles.streakCard}>
              <Text style={styles.streakLabel}>Current Streak</Text>
              <Text style={styles.streakValue}>{statistics.currentStreak}</Text>
              <Text style={styles.streakUnit}>days</Text>
            </View>
          </View>
        </View>

        {/* Most Used Tags */}
        {statistics.mostUsedTags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Most Used Tags</Text>
            <View style={styles.tagsContainer}>
              {statistics.mostUsedTags.slice(0, 10).map((item, index) => (
                <View key={item.tag} style={styles.tagItem}>
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagText}>#{index + 1}</Text>
                  </View>
                  <Text style={styles.tagName}>{item.tag}</Text>
                  <Text style={styles.tagCount}>{item.count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Monthly Activity Chart */}
        {statistics.activityByMonth.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity by Month</Text>
            <View style={styles.chartContainer}>
              <BarChart
                data={{
                  labels: monthLabels,
                  datasets: [
                    {
                      data: monthData,
                    },
                  ],
                }}
                width={screenWidth - 80}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={chartConfig}
                verticalLabelRotation={0}
                showValuesOnTopOfBars
                style={styles.chart}
              />
            </View>
          </View>
        )}

        {/* Weekly Activity Chart */}
        {statistics.activityByWeek.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Activity by Week (Last 12 Weeks)
            </Text>
            <View style={styles.chartContainer}>
              <LineChart
                data={{
                  labels: weekLabels,
                  datasets: [
                    {
                      data: weekData,
                      color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                      strokeWidth: 2,
                    },
                  ],
                }}
                width={screenWidth - 80}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            </View>
          </View>
        )}

        {/* Calendar Heatmap */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Heatmap</Text>
          <View style={styles.heatmapContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.heatmapGrid}>
                {calendarDays.map((day, index) => {
                  const intensity = Math.min(day.count, 5) / 5; // Normalize to 0-1
                  const backgroundColor = `rgba(0, 0, 0, ${
                    0.2 + intensity * 0.8
                  })`;

                  return (
                    <View
                      key={index}
                      style={[styles.heatmapDay, { backgroundColor }]}
                    />
                  );
                })}
              </View>
            </ScrollView>
            <View style={styles.heatmapLegend}>
              <Text style={styles.heatmapLegendText}>Less</Text>
              <View style={styles.heatmapLegendColors}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.heatmapLegendColor,
                      {
                        backgroundColor: `rgba(0, 0, 0, ${
                          0.2 + (i / 5) * 0.8
                        })`,
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.heatmapLegendText}>More</Text>
            </View>
          </View>
        </View>
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
    fontFamily: getFontFamily("regular"),
    color: "#666",
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
    color: "#666",
    marginTop: 24,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    fontFamily: getFontFamily("regular"),
    color: "#999",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 300,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    fontFamily: getFontFamily("bold"),
    color: "#000",
  },
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  overviewCard: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  overviewValue: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: getFontFamily("bold"),
    color: "#000",
    marginTop: 8,
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    fontFamily: getFontFamily("medium"),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
    color: "#000",
    marginBottom: 16,
  },
  streakContainer: {
    flexDirection: "row",
    gap: 12,
  },
  streakCard: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  streakLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    fontFamily: getFontFamily("medium"),
    marginBottom: 8,
  },
  streakValue: {
    fontSize: 36,
    fontWeight: "700",
    fontFamily: getFontFamily("bold"),
    color: "#000",
  },
  streakUnit: {
    fontSize: 14,
    fontFamily: getFontFamily("regular"),
    color: "#666",
    marginTop: 4,
  },
  tagsContainer: {
    gap: 8,
  },
  tagItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  tagBadge: {
    backgroundColor: "#000",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tagText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    fontFamily: getFontFamily("bold"),
  },
  tagName: {
    flex: 1,
    fontSize: 16,
    color: "#000",
    fontWeight: "500",
    fontFamily: getFontFamily("medium"),
  },
  tagCount: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
    fontFamily: getFontFamily("semiBold"),
  },
  chartContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  heatmapContainer: {
    marginTop: 8,
  },
  heatmapGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 700, // Fixed width for horizontal scroll
    gap: 2,
  },
  heatmapDay: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  heatmapLegend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    gap: 8,
  },
  heatmapLegendText: {
    fontSize: 12,
    fontFamily: getFontFamily("regular"),
    color: "#666",
  },
  heatmapLegendColors: {
    flexDirection: "row",
    gap: 4,
  },
  heatmapLegendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
});
