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
