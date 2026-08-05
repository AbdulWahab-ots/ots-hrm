import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

// Single source of truth for the business timezone every date/time filter, heatmap,
// dashboard, and calculation across the app should use — regardless of the
// browser's own timezone (an employee/admin could be physically anywhere).
export const BUSINESS_TIMEZONE = "America/New_York";

// A Date whose LOCAL getters (getFullYear/getMonth/getDate/getHours/getMinutes/...)
// report BUSINESS_TIMEZONE wall-clock values, no matter what timezone the browser
// itself is in. Existing "today" logic across the app already reads `new Date()`
// exclusively through those local getters (setHours(0,0,0,0), getMonth(), etc.), so
// swapping `new Date()` for `nowBusiness()` at each call site is a minimal, low-risk
// fix — the surrounding date-math logic doesn't need to change at all.
export const nowBusiness = (): Date =>
  new Date(dayjs().tz(BUSINESS_TIMEZONE).format("YYYY-MM-DDTHH:mm:ss.SSS"));

export const todayBusinessISO = (): string =>
  dayjs().tz(BUSINESS_TIMEZONE).format("YYYY-MM-DD");

// Absolute-instant (real UTC, unambiguous) ISO strings for the start/end of the
// calendar day `date` falls on, as that day is understood in BUSINESS_TIMEZONE.
//
// These exist specifically for filtering true `timestamp` columns (e.g.
// Vacation.createdAt) via a Between range sent to the backend. Sending a bare
// zone-less string like "2026-08-04T00:00:00.000" is NOT safe for that purpose —
// the backend parses it using the server process's OWN OS timezone (which may not
// be BUSINESS_TIMEZONE, or even UTC), silently shifting the range. `date` is
// expected to be a "fake local Date" like nowBusiness() or a calendar date picked
// in the UI — only its local Y/M/D getters are read here; its own underlying
// instant/timezone is irrelevant. Filtering a `date`-typed column (no time
// component, e.g. Attendance.date) doesn't need this — a bare "yyyy-MM-dd" string
// is unambiguous there regardless of server timezone.
export const businessStartOfDayUTC = (date: Date): string =>
  dayjs
    .tz(`${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`, "YYYY-M-D", BUSINESS_TIMEZONE)
    .startOf("day")
    .toISOString();

export const businessEndOfDayUTC = (date: Date): string =>
  dayjs
    .tz(`${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`, "YYYY-M-D", BUSINESS_TIMEZONE)
    .endOf("day")
    .toISOString();
