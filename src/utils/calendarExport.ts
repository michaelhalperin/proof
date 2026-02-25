import * as FileSystem from "expo-file-system/legacy";
import { Record } from "../db/database";

const CRLF = "\r\n";

/**
 * Escape text for iCal (commas, semicolons, backslashes).
 */
function escapeIcalText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

/**
 * Format dateKey (YYYY-MM-DD) as iCal DATE value (YYYYMMDD).
 */
function toIcalDate(dateKey: string): string | null {
  const m = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return `${m[1]}${m[2]}${m[3]}`;
}

/**
 * Next day in YYYY-MM-DD for DTEND (all-day events use exclusive end).
 */
function nextDay(dateKey: string): string | null {
  const d = new Date(dateKey + "T12:00:00Z");
  if (isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() + 1);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Generate iCal (RFC 5545) content for proof records.
 * One all-day event per dateKey; optional note in DESCRIPTION.
 */
export function generateIcalFromRecords(records: Record[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Proof//Proof Records//EN",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:Proof records",
  ];

  const now = new Date();
  const dtstamp =
    now.getUTCFullYear() +
    String(now.getUTCMonth() + 1).padStart(2, "0") +
    String(now.getUTCDate()).padStart(2, "0") +
    "T" +
    String(now.getUTCHours()).padStart(2, "0") +
    String(now.getUTCMinutes()).padStart(2, "0") +
    String(now.getUTCSeconds()).padStart(2, "0") +
    "Z";

  for (const record of records) {
    const startDate = toIcalDate(record.dateKey);
    const endDate = record.dateKey ? nextDay(record.dateKey) : null;
    if (!startDate || !endDate) continue;

    const uid = `proof-${record.dateKey}@proof`;
    const summary = "Proof logged";
    const desc = record.note?.trim()
      ? escapeIcalText(record.note.slice(0, 500))
      : "Daily proof recorded in Proof app";

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART;VALUE=DATE:${startDate}`);
    lines.push(`DTEND;VALUE=DATE:${toIcalDate(endDate)!}`);
    lines.push(`SUMMARY:${escapeIcalText(summary)}`);
    lines.push(`DESCRIPTION:${desc}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join(CRLF);
}

/**
 * Write iCal content to a temp file and return its file URI for sharing.
 */
export async function writeIcalToFile(icalContent: string): Promise<string> {
  const fileName = `proof-calendar-${new Date().toISOString().slice(0, 10)}.ics`;
  const dir = FileSystem.cacheDirectory?.replace(/\/?$/, "/") ?? "";
  const path = `${dir}${fileName}`;
  await FileSystem.writeAsStringAsync(path, icalContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return path.startsWith("file://") ? path : `file://${path}`;
}
