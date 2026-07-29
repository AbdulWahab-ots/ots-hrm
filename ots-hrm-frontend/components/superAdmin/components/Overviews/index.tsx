"use client";
import React, { useState } from "react";
import { StatsCard } from "./StatsCard";
import SegmentedTabs from "@/components/common/SegmentedTabs";

const PERIOD_OPTIONS: { value: "daily" | "weekly" | "monthly" | "yearly"; label: string }[] = [
  { value: "daily", label: "D" },
  { value: "weekly", label: "W" },
  { value: "monthly", label: "M" },
  { value: "yearly", label: "Y" },
];

// Mock data for different time periods
const dashboardData = {
  daily: {
    totalCompanies: 105,
    active: 25,
    inactive: 80,
    change: "+5.01%",
  },
  weekly: {
    totalCompanies: 98,
    active: 22,
    inactive: 76,
    change: "+3.21%",
  },
  monthly: {
    totalCompanies: 92,
    active: 20,
    inactive: 72,
    change: "+2.15%",
  },
  yearly: {
    totalCompanies: 100,
    active: 20,
    inactive: 80,
    change: "+9.01%",
  },
};

const Overviews = () => {
  const [activeFilter, setActiveFilter] = useState<
    "daily" | "weekly" | "monthly" | "yearly"
  >("daily");

  // Get data based on active filter
  const currentData = dashboardData[activeFilter];

  const handleFilterChange = (
    filter: "daily" | "weekly" | "monthly" | "yearly"
  ) => {
    setActiveFilter(filter);
  };

  return (
    <div>
      <div className="pb-6">
        <SegmentedTabs
          options={PERIOD_OPTIONS}
          value={activeFilter}
          onChange={handleFilterChange}
        />
      </div>
      <div className="grid grid-cols-1  md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Total Companies"
          value={currentData.totalCompanies}
          change={currentData.change}
        />
        <StatsCard
          title="Active"
          value={currentData.active}
          change={currentData.change}
        />
        <StatsCard
          title="Inactive"
          value={currentData.inactive}
          change={currentData.change}
        />
      </div>
    </div>
  );
};

export default Overviews;
