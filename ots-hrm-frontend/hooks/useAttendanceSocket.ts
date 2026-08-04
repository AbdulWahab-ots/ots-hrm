"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

// Shape pushed by the backend's automatic biometric sync job (see
// schedule-jobs/attendance-sync-cron.ts / socket/socket-io.ts's emitAttendanceUpdate).
// Mirrors IBiometricSyncResponse plus the ids needed to match it to a row/employee.
export interface AttendanceUpdateEvent {
  employeeId: string;
  userId: string;
  employeeName: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  stillCheckedIn: boolean;
  hasRecord: boolean;
  attendanceStatus: string;
  statusMessage: string;
  changed?: boolean;
}

// Subscribes to the backend's live attendance push (Socket.IO) for as long as the
// calling component is mounted. The server decides what this connection actually
// receives (see socket/socket-io.ts): an admin's socket also joins the company-wide
// admin room, every socket joins its own user room - so an employee only ever gets
// their own updates, and an admin gets every employee's. No manual filtering needed
// here beyond what the caller wants to do with the payload.
export function useAttendanceSocket(onUpdate: (event: AttendanceUpdateEvent) => void) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (!userString) return;

    let token: string | undefined;
    try {
      token = JSON.parse(userString)?.access_token;
    } catch {
      return;
    }
    if (!token) return;

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    const origin = (() => {
      try {
        return new URL(apiBase).origin;
      } catch {
        return apiBase;
      }
    })();

    // Default transport order (polling first, then upgrade to websocket) - forcing
    // websocket first raced the upgrade handshake and logged a harmless but noisy
    // "WebSocket is closed before the connection is established" warning.
    const socket: Socket = io(origin, {
      auth: { token },
    });

    socket.on("attendance:update", (event: AttendanceUpdateEvent) => {
      onUpdateRef.current(event);
    });

    return () => {
      socket.disconnect();
    };
    // Connect once per mount - the token is re-read fresh each mount, which covers
    // login/logout between visits to a page using this hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
