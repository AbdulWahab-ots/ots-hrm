"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import CrossIcon from "../../public/Cross-icon.svg";
import { RefreshCw, AlertCircle, Info } from "lucide-react";
import { convert24To12HourFormat } from "@/utils/helper";

export interface BiometricSyncResult {
  employeeId: string;
  employeeName: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  stillCheckedIn: boolean;
  hasRecord: boolean;
  workedMinutes?: number;
  workedHoursLabel?: string;
  standardShiftMinutes: number;
  attendanceStatus:
    | "OVERTIME"
    | "UNDERTIME"
    | "ON_TIME"
    | "IN_PROGRESS"
    | "NO_RECORD"
    | "NOT_ENROLLED";
  statusMessage: string;
  zkDeviceIdWarning?: string;
}

interface RefreshAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeLabel?: string;
  // The date to fetch, defaulting to today if not supplied. Re-fetches whenever this
  // changes while open (e.g. the admin picks a different historical date).
  initialDate?: string;
  // Returns the raw API result for the given date on success, or null on failure
  // (matches this app's apiHandler convention — errors already surface via toast, this
  // just needs to know whether to show its own inline error state too).
  onFetch: (date: string) => Promise<BiometricSyncResult | null>;
}

const STATUS_STYLES: Record<BiometricSyncResult["attendanceStatus"], string> = {
  OVERTIME: "text-g-amber-900 bg-g-amber-100",
  UNDERTIME: "text-g-red-800 bg-g-red-100",
  ON_TIME: "text-g-green-800 bg-g-green-100",
  IN_PROGRESS: "text-g-blue-800 bg-g-blue-100",
  NO_RECORD: "text-g-gray-900 bg-g-gray-100",
  NOT_ENROLLED: "text-g-gray-900 bg-g-gray-100",
};

const todayIso = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const RefreshAttendanceModal: React.FC<RefreshAttendanceModalProps> = ({
  isOpen,
  onClose,
  employeeLabel,
  initialDate,
  onFetch,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BiometricSyncResult | null>(null);
  const [selectedDate, setSelectedDate] = useState(initialDate || todayIso());

  const runFetch = async (date: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await onFetch(date);
      if (!data) {
        setError("Unable to reach the attendance system. Please try again.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Unable to reach the attendance system. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const date = initialDate || todayIso();
      setSelectedDate(date);
      runFetch(date);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const isNotEnrolled = result?.attendanceStatus === "NOT_ENROLLED";

  return (
    <div className="fixed bg-[var(--g-overlay)] inset-0 flex items-center justify-center z-100">
      <div className="bg-g-background-100 rounded-[var(--g-radius-md)] overflow-hidden w-[375px] sm:w-[420px] relative shadow-geist-modal">
        <div
          className="absolute top-[0px] right-0 cursor-pointer focus-ring-geist rounded-[var(--g-radius-sm)]"
          onClick={onClose}
        >
          <Image src={CrossIcon} alt="close icon" />
        </div>
        <div className="p-6">
          <h2 className="text-heading-20 text-g-gray-1000">
            Attendance {employeeLabel ? `— ${employeeLabel}` : ""}
          </h2>

          <div className="mt-4">
            <label className="block text-label-14 font-medium text-g-gray-900 mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              max={todayIso()}
              onChange={(e) => {
                const date = e.target.value;
                setSelectedDate(date);
                runFetch(date);
              }}
              disabled={isLoading}
              className="block w-full h-10 px-3 border border-g-gray-alpha-400 rounded-[var(--g-radius-sm)] focus:outline-none focus-ring-geist bg-g-background-100 text-g-gray-1000 disabled:opacity-60"
            />
          </div>

          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-10">
              <RefreshCw size={24} className="text-g-blue-700 animate-spin" />
              <p className="text-copy-14 text-g-gray-800">
                Fetching latest attendance…
              </p>
            </div>
          )}

          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <AlertCircle size={24} className="text-g-red-700" />
              <p className="text-copy-14 text-g-red-800">{error}</p>
              <button
                onClick={() => runFetch(selectedDate)}
                className="text-button-14 text-g-blue-700 hover:text-g-blue-800 cursor-pointer"
              >
                Try again
              </button>
            </div>
          )}

          {!isLoading && !error && result && isNotEnrolled && (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <Info size={24} className="text-g-gray-700" />
              <p className="text-copy-14 text-g-gray-900">
                {result.statusMessage}
              </p>
            </div>
          )}

          {!isLoading && !error && result && !isNotEnrolled && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-g-gray-900 text-label-14 font-medium">
                    Check-In
                  </h3>
                  <p className="text-g-gray-1000 text-[16px] font-semibold">
                    {convert24To12HourFormat(result.checkInTime, "checkin")}
                  </p>
                </div>
                <div>
                  <h3 className="text-g-gray-900 text-label-14 font-medium">
                    Check-Out
                  </h3>
                  <p className="text-g-gray-1000 text-[16px] font-semibold">
                    {result.stillCheckedIn
                      ? "Still checked in"
                      : convert24To12HourFormat(result.checkOutTime, "checkout")}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-g-gray-900 text-label-14 font-medium">
                  Total Hours Worked
                </h3>
                <p className="text-g-gray-1000 text-[16px] font-semibold">
                  {result.workedHoursLabel ?? "—"}
                </p>
              </div>

              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${STATUS_STYLES[result.attendanceStatus]}`}
              >
                {result.statusMessage}
              </span>

              {result.zkDeviceIdWarning && (
                <div className="flex items-start gap-2 rounded-[var(--g-radius-sm)] bg-g-amber-100 px-3 py-2">
                  <AlertCircle size={16} className="text-g-amber-900 shrink-0 mt-0.5" />
                  <p className="text-copy-14 text-g-amber-900">
                    {result.zkDeviceIdWarning}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-6 p-6 pt-0">
          <button
            onClick={onClose}
            className="text-g-gray-800 text-button-14 cursor-pointer hover:text-g-gray-1000 focus-ring-geist rounded-[var(--g-radius-sm)] px-2 py-1"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RefreshAttendanceModal;
