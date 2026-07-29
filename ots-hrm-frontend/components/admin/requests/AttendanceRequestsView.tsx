"use client";
import React, { useState } from "react";
import { StatsCard } from "./StatCard";
import SegmentedTabs from "@/components/common/SegmentedTabs";

const dashboardData = {
  daily: { totalCompanies: 105, active: 65, inactive: 30 },
  weekly: { totalCompanies: 98, active: 42, inactive: 56 },
  monthly: { totalCompanies: 92, active: 30, inactive: 56 },
  yearly: { totalCompanies: 100, active: 60, inactive: 40 },
};

const PERIOD_OPTIONS: {
  value: "daily" | "weekly" | "monthly" | "yearly";
  label: string;
}[] = [
  { value: "daily", label: "D" },
  { value: "weekly", label: "W" },
  { value: "monthly", label: "M" },
  { value: "yearly", label: "Y" },
];

const AttendanceRequestsView = () => {
  const [activeFilter, setActiveFilter] = useState<
    "daily" | "weekly" | "monthly" | "yearly"
  >("daily");

  const currentData = dashboardData[activeFilter];

  return (
    <div>
      <div className="pb-6 flex justify-between items-center">
        <p className="text-copy-14 text-(--genrel-text-light)">
          Total Requests
        </p>
        <SegmentedTabs
          options={PERIOD_OPTIONS}
          value={activeFilter}
          onChange={setActiveFilter}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Decline"
          value={currentData.totalCompanies}
          activeValue={currentData.active}
          inactiveValue={currentData.inactive}
        />
        <StatsCard
          title="Approved"
          value={currentData.active}
          activeValue={currentData.active}
          inactiveValue={currentData.inactive}
        />
        <StatsCard
          title="Pending"
          value={currentData.inactive}
          activeValue={currentData.active}
          inactiveValue={currentData.inactive}
        />
      </div>
    </div>
  );
};

export default AttendanceRequestsView;
