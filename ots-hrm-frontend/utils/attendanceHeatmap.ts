/* ==========================================================================
   Attendance heatmap helpers — pure, framework-free so they're trivial to test
   and tweak. The intensity mapping lives in ONE place: attendanceLevel().
   ========================================================================== */

import { nowBusiness } from "./timezone";

export interface HeatRecord {
  date: string; // "YYYY-MM-DD" (may carry a time suffix; we only read the first 10 chars)
  status?: string | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  lockWorkingHours?: number | null;
  notes?: string | null;
}

export type HeatKind = "none" | "present" | "absent" | "off" | "pending";

export interface DayInfo {
  key: string; // YYYY-MM-DD
  date: Date;
  record?: HeatRecord;
  level: 0 | 1 | 2 | 3 | 4;
  kind: HeatKind;
  inRange: boolean;
  future: boolean;
}

// ---- date utilities (local-time, no TZ drift; we treat dates as calendar days) ----

export const ymd = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const parseYmd = (s: string): Date => {
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
export const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
export const addMonths = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth() + n, 1);

const addDays = (d: Date, n: number) => {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
};

// Sunday-first week start (GitHub style).
const startOfWeekSunday = (d: Date) => addDays(d, -d.getDay());

/**
 * Map one day's attendance record to an orange intensity level (0..4) plus a
 * semantic kind used for outline/tooltip. Change the thresholds here only.
 *
 *   no record            -> level 0, kind "none"
 *   leave / holiday / off -> level 0, kind "off"      (not a working day)
 *   not yet resolved (status DEFAULT, no check-in) -> level 0, kind "pending"
 *     - e.g. today's row before check-in, or an overnight shift's "today" row
 *       while yesterday's shift is still open. Only the absent-marking cron's
 *       actual ABSENT status counts as a confirmed absence (see below) - a
 *       DEFAULT row is not yet a fact and must not be flagged as one.
 *   absent (status ABSENT) -> level 0, kind "absent" (danger outline)
 *   present, half day     -> level 1
 *   present, < 3h         -> level 1
 *   present, 3–6h         -> level 2
 *   present, 6–9h (full)  -> level 3   (brand orange territory)
 *   present, > 9h (long)  -> level 4
 *   present, hours unknown -> level 3
 */
export function attendanceLevel(record?: HeatRecord): {
  level: DayInfo["level"];
  kind: HeatKind;
} {
  if (!record) return { level: 0, kind: "none" };
  const s = (record.status || "").toUpperCase();

  if (s === "ON_LEAVE" || s === "HOLIDAY" || s === "DAY_OFF")
    return { level: 0, kind: "off" };

  const isPresent =
    s === "PRESENT" || s === "LATE" || s === "HALF_DAY" || !!record.checkInTime;

  if (isPresent) {
    if (s === "HALF_DAY") return { level: 1, kind: "present" };
    const h =
      typeof record.lockWorkingHours === "number" ? record.lockWorkingHours : null;
    if (h === null) return { level: 3, kind: "present" };
    if (h < 3) return { level: 1, kind: "present" };
    if (h < 6) return { level: 2, kind: "present" };
    if (h <= 9) return { level: 3, kind: "present" };
    return { level: 4, kind: "present" };
  }

  // A confirmed absence - the cron actually marked this row ABSENT.
  if (s === "ABSENT") return { level: 0, kind: "absent" };

  // Anything else with no check-in (DEFAULT and friends) is not yet resolved -
  // e.g. today before check-in, or an overnight shift's "today" row while
  // yesterday's shift is still open. Don't call that "absent" until the cron does.
  return { level: 0, kind: "pending" };
}

/**
 * Build the GitHub-style week columns for [from, to]. Each column is a week
 * (Sun..Sat); each cell a DayInfo. Days outside [from,to] pad the first/last
 * weeks so the grid is rectangular but are flagged inRange:false.
 */
export function buildWeeks(
  from: Date,
  to: Date,
  records: HeatRecord[],
  today: Date = nowBusiness()
): DayInfo[][] {
  const byDate = new Map<string, HeatRecord>();
  for (const r of records) byDate.set(r.date.slice(0, 10), r);

  const gridStart = startOfWeekSunday(from);
  const gridEnd = addDays(startOfWeekSunday(to), 6); // Saturday of the last week
  const todayKey = ymd(today);

  const weeks: DayInfo[][] = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    const week: DayInfo[] = [];
    for (let i = 0; i < 7; i++) {
      const key = ymd(cursor);
      const inRange = cursor >= from && cursor <= to;
      const future = key > todayKey;
      const record = inRange ? byDate.get(key) : undefined;
      const { level, kind } = attendanceLevel(record);
      week.push({ key, date: new Date(cursor), record, level, kind, inRange, future });
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export interface HeatStats {
  present: number;
  absent: number;
  rate: number; // 0..100
  streak: number; // consecutive present days ending at the most recent day
}

/** Summary stats over the in-range, non-future days. */
export function computeStats(weeks: DayInfo[][], today: Date = nowBusiness()): HeatStats {
  const days = weeks
    .flat()
    .filter((d) => d.inRange && !d.future)
    .sort((a, b) => (a.key < b.key ? -1 : 1));

  let present = 0;
  let absent = 0;
  for (const d of days) {
    if (d.kind === "present") present++;
    else if (d.kind === "absent") absent++;
  }
  const denom = present + absent;
  const rate = denom > 0 ? Math.round((present / denom) * 100) : 0;

  // Streak: walk backward from the latest day; count present, skip non-working
  // (off) days, stop at an absent or a missing working-day record.
  let streak = 0;
  const todayKey = ymd(today);
  for (let i = days.length - 1; i >= 0; i--) {
    const d = days[i];
    if (d.key > todayKey) continue;
    if (d.kind === "off") continue;
    if (d.kind === "present") {
      streak++;
      continue;
    }
    break; // absent or none => streak ends
  }

  return { present, absent, rate, streak };
}

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
