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

// The backend server process's OS timezone. `createdAt`/`modifiedAt` columns are
// populated via `new Date()` in backend app code and written to `timestamp` (no time
// zone) Postgres columns - Postgres silently drops any offset on insert for that
// column type, so what actually lands in the DB is the Node process's LOCAL
// wall-clock digits (Asia/Karachi), not a true UTC instant. Confirmed directly by
// inspecting stored rows (e.g. a row created at true UTC ~17:49 read back as
// "22:32" - exactly Karachi's +5 offset from UTC).
const SERVER_OS_TIMEZONE = "Asia/Karachi";

// Start/end of the BUSINESS_TIMEZONE calendar day `date` falls on, expressed as the
// literal wall-clock string the DB would actually contain for an event at that real
// instant - i.e. re-expressed in SERVER_OS_TIMEZONE, matching how `createdAt` is
// really stored (see above). Use this whenever filtering a `timestamp` column such
// as `createdAt` via Between() - a true-UTC instant would be off by the
// NY<->Karachi offset for this specific class of columns and misclassify rows near
// day boundaries. Filtering a `date`-typed column (no time component, e.g.
// Attendance.date) doesn't need this — a bare "yyyy-MM-dd" string is unambiguous
// there regardless of server timezone.
export const businessStartOfDayAsStoredTimestamp = (date: Date): string =>
  dayjs
    .tz(`${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`, "YYYY-M-D", BUSINESS_TIMEZONE)
    .startOf("day")
    .tz(SERVER_OS_TIMEZONE)
    .format("YYYY-MM-DD HH:mm:ss.SSS");

export const businessEndOfDayAsStoredTimestamp = (date: Date): string =>
  dayjs
    .tz(`${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`, "YYYY-M-D", BUSINESS_TIMEZONE)
    .endOf("day")
    .tz(SERVER_OS_TIMEZONE)
    .format("YYYY-MM-DD HH:mm:ss.SSS");
