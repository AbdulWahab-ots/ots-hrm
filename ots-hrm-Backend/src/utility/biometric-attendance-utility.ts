import axios from "axios";
import { AppError } from "./app-error";

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

// Calls the DevOps biometric-device middleware. The API currently matches by employee
// name (not the internal zkDeviceUserId we store) — see Employee.zkDeviceUserId for why
// that field exists regardless. BIOMETRIC_API_URL is env-configured since it's currently
// an ngrok tunnel that changes on restart.
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

    try {
        const response = await axios.post<IBiometricAttendanceApiResponse>(
            `${baseUrl.replace(/\/$/, "")}/api/attendance`,
            { employee: employeeName, ...(date ? { date } : {}) },
            { timeout: 10_000 }
        );
        return response.data;
    } catch (error) {
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
