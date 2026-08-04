"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import SegmentedTabs from "@/components/common/SegmentedTabs";
import { fetchAttendanceRecordsForRange } from "@/services/adminServices";
import { AppDispatch } from "@/store/store";
import { nowBusiness } from "@/utils/timezone";

type StatItem = {
  label: string;
  value: number;
  color: string; // hex code
};

const PERIOD_OPTIONS: { value: "monthly" | "yearly"; label: string }[] = [
  { value: "monthly", label: "M" },
  { value: "yearly", label: "Y" },
];

// Same fixed company-shift standard used by the biometric integration — used here
// only to estimate "expected hours" for days that have an attendance row but no
// per-record totalWorkingHours (e.g. rows never touched by the shift-aware check-in
// flow).
const DEFAULT_SHIFT_HOURS = 8.5;

// Local calendar date (not UTC) so month/year boundaries aren't shifted by
// toISOString()'s UTC conversion.
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const AttendanceOverview: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<StatItem[]>([
    { label: "Present", value: 0, color: "var(--g-green-700)" },
    { label: "Late", value: 0, color: "var(--g-gray-900)" },
    { label: "Absent", value: 0, color: "var(--g-amber-700)" },
    { label: "Leave", value: 0, color: "var(--g-red-700)" },
  ]);
  const [hoursLabel, setHoursLabel] = useState("0 Hours completed out of 0");

  const dispatch = useDispatch<AppDispatch>();

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const now = nowBusiness();
      const periodStart =
        activeFilter === "monthly"
          ? new Date(now.getFullYear(), now.getMonth(), 1)
          : new Date(now.getFullYear(), 0, 1);

      const response = await fetchAttendanceRecordsForRange(
        dispatch,
        formatLocalDate(periodStart),
        formatLocalDate(now)
      );
      const records: any[] = response?.result?.data || [];

      let present = 0;
      let late = 0;
      let absent = 0;
      let leave = 0;
      let workedHours = 0;
      let expectedHours = 0;

      for (const record of records) {
        if (record.status === "PRESENT") present += 1;
        else if (record.status === "LATE") late += 1;
        else if (record.status === "ON_LEAVE") leave += 1;
        else if (record.status === "HOLIDAY" || record.status === "DAY_OFF") {
          // Not a working day — doesn't count toward present/late/absent.
        } else absent += 1; // DEFAULT / ABSENT

        if (
          record.status === "PRESENT" ||
          record.status === "LATE" ||
          record.status === "DEFAULT" ||
          record.status === "ABSENT"
        ) {
          workedHours += Number(record.lockWorkingHours) || 0;
          expectedHours += Number(record.totalWorkingHours) || DEFAULT_SHIFT_HOURS;
        }
      }

      setStats([
        { label: "Present", value: present, color: "var(--g-green-700)" },
        { label: "Late", value: late, color: "var(--g-gray-900)" },
        { label: "Absent", value: absent, color: "var(--g-amber-700)" },
        { label: "Leave", value: leave, color: "var(--g-red-700)" },
      ]);
      setHoursLabel(
        `${Math.round(workedHours)} Hours completed out of ${Math.round(expectedHours)}`
      );
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const total = stats.reduce((acc, s) => acc + s.value, 0);
  // Present + Late both count as "attended" — matches how the Attendance Records
  // table itself classifies a late check-in as still having shown up.
  const attendanceRate =
    total > 0
      ? Math.round(((stats[0].value + stats[1].value) / total) * 100)
      : 0;

  const handleFilterChange = (filter: "monthly" | "yearly") => {
    setActiveFilter(filter);
  };

  return (
    <div className="lg:col-span-4 rounded-[var(--g-radius-md)] border-[1px] border-g-gray-alpha-400 p-6 bg-g-background-100 shadow-geist-card flex flex-col justify-between ">
      {/* Header */}
      <div className="flex  justify-between">
        <h2 className="text-heading-20 text-g-gray-900">
          Attendance Overview
        </h2>

        <SegmentedTabs
          options={PERIOD_OPTIONS}
          value={activeFilter}
          onChange={handleFilterChange}
        />
      </div>

      {/* Attendance Rate */}
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-g-gray-1000 font-medium text-[48px]">
            {isLoading ? "—" : `${attendanceRate}%`}
          </p>
          <p className="text-copy-16 text-g-gray-900 font-medium">
            Attendance Rate
          </p>
        </div>
        <p className="text-copy-16 text-g-gray-900 font-medium">
          {isLoading ? "" : hoursLabel}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mt-6 flex h-[48px] w-full gap-[2px]">
        {total === 0 ? (
          <div className="h-full w-full rounded-[20px] bg-g-gray-200" />
        ) : (
          stats.map((s, idx) => (
            <div
              key={idx}
              className="h-full rounded-[20px]"
              style={{
                width: `${(s.value / total) * 100}%`,
                backgroundColor: s.color,
              }}
            ></div>
          ))
        )}
      </div>

      {/* Legends */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        {stats.map((s, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            <span
              className="h-4 w-2 rounded-full"
              style={{ backgroundColor: s.color }}
            ></span>
            <span className="font-bold text-copy-16 text-g-gray-900">
              {s.value}
            </span>
            <span className="text-copy-16 text-g-gray-900 font-medium">
              : {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttendanceOverview;
