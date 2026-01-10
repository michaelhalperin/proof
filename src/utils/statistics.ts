import { Record, Photo } from "../db/database";
import dayjs from "dayjs";
import { parseLocation } from "./location";

export interface Statistics {
  totalRecords: number;
  recordsWithPhotos: number;
  recordsWithLocation: number;
  recordsWithTags: number;
  mostUsedTags: { tag: string; count: number }[];
  activityByMonth: { month: string; count: number }[];
  activityByWeek: { week: string; count: number }[];
  longestStreak: number;
  currentStreak: number;
}

export interface CalendarHeatmapData {
  [dateKey: string]: { count: number };
}

/**
 * Calculate statistics from records
 */
export function calculateStatistics(
  records: Record[],
  allPhotos: Photo[] = []
): Statistics {
  const totalRecords = records.length;

  // Count records with photos
  const recordDateKeys = new Set(records.map((r) => r.dateKey));
  const photosDateKeys = new Set(allPhotos.map((p) => p.dateKey));
  const recordsWithPhotos = Array.from(photosDateKeys).filter((key) =>
    recordDateKeys.has(key)
  ).length;

  // Count records with location
  const recordsWithLocation = records.filter((r) => r.location).length;

  // Count records with tags
  const recordsWithTags = records.filter((r) => {
    if (!r.tags) return false;
    try {
      const tags = JSON.parse(r.tags);
      return Array.isArray(tags) && tags.length > 0;
    } catch {
      return false;
    }
  }).length;

  // Calculate most used tags
  const tagCounts: { [tag: string]: number } = {};
  records.forEach((record) => {
    if (record.tags) {
      try {
        const tags = JSON.parse(record.tags);
        if (Array.isArray(tags)) {
          tags.forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      } catch {
        // Ignore invalid tags
      }
    }
  });

  const mostUsedTags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Calculate activity by month
  const monthCounts: { [month: string]: number } = {};
  records.forEach((record) => {
    const date = dayjs(record.dateKey);
    const monthKey = date.format("YYYY-MM");
    monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
  });

  const activityByMonth = Object.entries(monthCounts)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12); // Last 12 months

  // Calculate activity by week (last 12 weeks)
  const weekCounts: { [week: string]: number } = {};
  records.forEach((record) => {
    const date = dayjs(record.dateKey);
    const weekKey = date.format("YYYY-[W]WW");
    weekCounts[weekKey] = (weekCounts[weekKey] || 0) + 1;
  });

  const activityByWeek = Object.entries(weekCounts)
    .map(([week, count]) => ({ week, count }))
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-12); // Last 12 weeks

  // Calculate streaks
  const sortedDates = records
    .map((r) => dayjs(r.dateKey))
    .sort((a, b) => a.diff(b))
    .map((d) => d.format("YYYY-MM-DD"));

  let longestStreak = 0;
  let currentStreak = 0;
  let tempStreak = 1;

  const today = dayjs().format("YYYY-MM-DD");
  let isInCurrentStreak = false;

  for (let i = 1; i < sortedDates.length; i++) {
    const prev = dayjs(sortedDates[i - 1]);
    const curr = dayjs(sortedDates[i]);

    if (curr.diff(prev, "day") === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // Calculate current streak (consecutive days from today backwards)
  let checkDate = dayjs();
  let streakCount = 0;
  while (true) {
    const dateKey = checkDate.format("YYYY-MM-DD");
    if (sortedDates.includes(dateKey)) {
      streakCount++;
      checkDate = checkDate.subtract(1, "day");
    } else {
      break;
    }
  }
  currentStreak = streakCount;

  return {
    totalRecords,
    recordsWithPhotos,
    recordsWithLocation,
    recordsWithTags,
    mostUsedTags,
    activityByMonth,
    activityByWeek,
    longestStreak,
    currentStreak,
  };
}

/**
 * Generate calendar heatmap data
 */
export function generateCalendarHeatmap(
  records: Record[]
): CalendarHeatmapData {
  const heatmap: CalendarHeatmapData = {};

  records.forEach((record) => {
    const dateKey = record.dateKey;
    heatmap[dateKey] = {
      count: (heatmap[dateKey]?.count || 0) + 1,
    };
  });

  return heatmap;
}
