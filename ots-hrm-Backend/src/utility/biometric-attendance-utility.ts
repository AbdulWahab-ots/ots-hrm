import axios from "axios";
import { AppError } from "./app-error";

// A distinguishable AppError.message marker for "the device has no employee matching
// this name" (its API responds 404 with a message like "No employee found matching
// 'X'") — as opposed to any other failure (auth, network, timeout). Callers check for
// this exact message to show a friendly "not enrolled yet" state instead of a generic
// connectivity error.
export const BIOMETRIC_EMPLOYEE_NOT_ENROLLED = "BIOMETRIC_EMPLOYEE_NOT_ENROLLED";

export interface IBiometricAttendanceRecord {
    check_in: string;  // e.g. "05:39:13 PM", or absent if no check-in
    check_out: string; // e.g. "04:22:16 AM", or "N/A" if not yet checked out
    date: string;       // YYYY-MM-DD
}

export interface IBiometricAttendanceApiResponse {
    employee_id: string;
    filter: { date: string; defaulted_to_today: boolean; month: string | null };
    name: string;
    records: IBiometricAttendanceRecord[];
}

// The external API matches by literal name equality, so any hidden whitespace survives
// straight through to a failed lookup — e.g. a tab character copy-pasted from a
// spreadsheet into firstName/lastName. `.trim()` alone only strips the outer edges of
// the combined string; it does nothing for a tab sitting between the first and last
// name. Collapse every whitespace run (spaces, tabs, newlines) to a single space and
// trim the ends, so the name we send is always exactly what a human would expect to see.
export function sanitizeEmployeeNameForBiometricApi(name: string): string {
    return name.replace(/\s+/g, " ").trim();
}

// Calls the DevOps biometric-device middleware. The API currently matches by employee
// name (not the internal zkDeviceUserId we store) — see Employee.zkDeviceUserId for why
// that field exists regardless. BIOMETRIC_API_URL is env-configured since it's currently
// an ngrok tunnel that changes on restart. The API also requires an x-api-key header,
// sourced from ATTENDANCE_API_KEY — fail closed (never send the request unauthenticated)
// if it's missing.
export async function fetchBiometricAttendance(
    employeeName: string,
    date?: string
): Promise<IBiometricAttendanceApiResponse> {
    const baseUrl = process.env.BIOMETRIC_API_URL;
    if (!baseUrl) {
        throw new AppError(
            "Biometric attendance integration is not configured (BIOMETRIC_API_URL is missing).",
            "500"
        );
    }

    const apiKey = process.env.ATTENDANCE_API_KEY;
    if (!apiKey) {
        throw new AppError(
            "Biometric attendance integration is not configured (ATTENDANCE_API_KEY is missing).",
            "500"
        );
    }

    // BIOMETRIC_API_URL is documented as the tunnel's base origin, but tolerate it
    // already including the /api/attendance path too (easy to paste either way) —
    // normalize instead of risking a doubled-up path like ".../api/attendance/api/attendance".
    const normalizedBase = baseUrl.replace(/\/$/, "").replace(/\/api\/attendance$/, "");

    const sanitizedName = sanitizeEmployeeNameForBiometricApi(employeeName);

    try {
        const response = await axios.post<IBiometricAttendanceApiResponse>(
            `${normalizedBase}/api/attendance`,
            { employee: sanitizedName, ...(date ? { date } : {}) },
            {
                timeout: 15_000,
                headers: {
                    "x-api-key": apiKey,
                    // Free-tier ngrok tunnels can serve an HTML interstitial warning page
                    // instead of proxying the request when the caller doesn't look like a
                    // browser (no browser-typical Accept/User-Agent) — this header bypasses
                    // that page. Harmless no-op against a non-ngrok or paid endpoint.
                    "ngrok-skip-browser-warning": "true",
                },
            }
        );
        return response.data;
    } catch (error) {
        // The previous version of this catch swallowed the real cause entirely — every
        // failure surfaced as the same generic message with nothing in the server logs
        // to diagnose from. Log the concrete underlying error so a future failure (bad
        // key, tunnel down, timeout, unexpected response shape) is actually traceable.
        if (axios.isAxiosError(error)) {
            console.error(
                "[biometric-attendance] request failed:",
                {
                    message: error.message,
                    code: error.code,
                    status: error.response?.status,
                    responseData: error.response?.data,
                    url: `${normalizedBase}/api/attendance`,
                }
            );

            // The device API's own "not found" response — the employee genuinely isn't
            // enrolled there, which is a normal, expected state, not a connectivity
            // failure. Callers should show a friendly message, not the generic one below.
            if (error.response?.status === 404) {
                throw new AppError(BIOMETRIC_EMPLOYEE_NOT_ENROLLED, "404");
            }
        } else {
            console.error("[biometric-attendance] unexpected error:", error);
        }
        throw new AppError(
            "Unable to reach the attendance system. Please try again.",
            "502"
        );
    }
}

// "05:39:13 PM" -> "17:39:13". Returns null for "N/A" / unparseable input.
export function parse12HourTimeTo24Hour(time: string | undefined | null): string | null {
    if (!time) return null;
    const match = time.trim().match(/^(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return null;

    const [, hourStr, minute, second, meridiem] = match;
    let hour = parseInt(hourStr, 10);
    const isPM = meridiem.toUpperCase() === "PM";
    if (isPM && hour !== 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;

    return `${String(hour).padStart(2, "0")}:${minute}:${second}`;
}

// Minutes between two 24-hour HH:mm:ss times, wrapping past midnight (overnight shifts).
export function diffMinutesAcrossMidnight(checkIn24: string, checkOut24: string): number {
    const toMinutes = (t: string) => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
    };
    let diff = toMinutes(checkOut24) - toMinutes(checkIn24);
    if (diff < 0) diff += 24 * 60;
    return diff;
}

export function formatMinutesAsHoursAndMinutes(totalMinutes: number): string {
    const rounded = Math.round(totalMinutes);
    const hours = Math.floor(rounded / 60);
    const minutes = rounded % 60;
    if (hours <= 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
}
