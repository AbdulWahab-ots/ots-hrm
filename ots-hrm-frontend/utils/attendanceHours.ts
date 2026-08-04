// Overtime/undertime classification for a completed shift, derived from fields
// already returned by /attendance/get_all (lockWorkingHours = actual hours worked,
// totalWorkingHours = the standard for that row - 8.5h for biometric-synced rows,
// see upsertBiometricAttendance in attendance-service.ts; the employee's assigned
// shift's hours otherwise). Mirrors the backend's own classification tolerance
// (ON_TIME_TOLERANCE_MINUTES = 5) in attendance-service.ts's performBiometricSync,
// so a row shows the same verdict here as it would in the Refresh Attendance modal -
// computed client-side so it works whether the row arrived via a live Socket.IO
// push, a manual refresh, or a plain page load, not just whichever one happened to
// return a fresh classification from the API.
const TOLERANCE_MINUTES = 5;

export type HoursClassification =
  | { kind: "overtime"; label: string }
  | { kind: "undertime"; label: string }
  | { kind: "on_time"; label: string }
  | { kind: "none" };

const formatHoursMinutes = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export function classifyWorkedHours(
  workedHours: number | null | undefined,
  standardHours: number | null | undefined
): HoursClassification {
  if (workedHours == null || standardHours == null) return { kind: "none" };

  const diffMinutes = Math.round((workedHours - standardHours) * 60);
  if (Math.abs(diffMinutes) <= TOLERANCE_MINUTES) {
    return { kind: "on_time", label: "On time" };
  }
  if (diffMinutes > 0) {
    return { kind: "overtime", label: `Overtime: ${formatHoursMinutes(diffMinutes)}` };
  }
  return { kind: "undertime", label: `Short by ${formatHoursMinutes(-diffMinutes)}` };
}
