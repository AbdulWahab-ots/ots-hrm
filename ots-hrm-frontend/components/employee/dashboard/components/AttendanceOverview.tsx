"use client";
import React, { useState } from "react";
import SegmentedTabs from "@/components/common/SegmentedTabs";

type StatItem = {
  label: string;
  value: number;
  color: string; // hex code
};

const PERIOD_OPTIONS: { value: "monthly" | "yearly"; label: string }[] = [
  { value: "monthly", label: "M" },
  { value: "yearly", label: "Y" },
];

const AttendanceOverview: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<"monthly" | "yearly">(
    "monthly"
  );

  const monthlyStats: StatItem[] = [
    { label: "Present", value: 18, color: "var(--g-green-700)" },
    { label: "Late", value: 1, color: "var(--g-gray-900)" },
    { label: "Absent", value: 2, color: "var(--g-amber-700)" },
    { label: "Leave", value: 1, color: "var(--g-red-700)" },
  ];

  const yearlyStats: StatItem[] = [
    { label: "Present", value: 150, color: "var(--g-green-700)" },
    { label: "Late", value: 12, color: "var(--g-gray-900)" },
    { label: "Absent", value: 17, color: "var(--g-amber-700)" },
    { label: "Leave", value: 14, color: "var(--g-red-700)" },
  ];

  const stats = activeFilter === "monthly" ? monthlyStats : yearlyStats;
  const total = stats.reduce((acc, s) => acc + s.value, 0);

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
            {((stats[0].value / total) * 100).toFixed(0)}%
          </p>
          <p className="text-copy-16 text-g-gray-900 font-medium">
            Attendance Rate
          </p>
        </div>
        <p className="text-copy-16 text-g-gray-900 font-medium">
          {activeFilter === "monthly"
            ? "40 Hours completed out of 44"
            : "450 Hours completed out of 520"}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mt-6 flex h-[48px] w-full gap-[2px]">
        {stats.map((s, idx) => (
          <div
            key={idx}
            className="h-full rounded-[20px]"
            style={{
              width: `${(s.value / total) * 100}%`,
              backgroundColor: s.color,
            }}
          ></div>
        ))}
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
