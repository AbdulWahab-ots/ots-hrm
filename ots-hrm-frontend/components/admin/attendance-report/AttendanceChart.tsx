"use client";
import React, { useCallback, useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Legend,
  ChartData,
  ChartOptions,
} from "chart.js";
import { useDispatch } from "react-redux";
import { format } from "date-fns";
import SegmentedTabs from "@/components/common/SegmentedTabs";
import { AppDispatch } from "@/store/store";
import { fetchAttendanceStatsForRange } from "@/services/adminServices";
import { nowBusiness } from "@/utils/timezone";

ChartJS.register(CategoryScale, LinearScale, BarElement, Legend);

const PERIOD_OPTIONS: {
  value: "daily" | "weekly" | "monthly" | "yearly";
  label: string;
}[] = [
  { value: "daily", label: "D" },
  { value: "weekly", label: "W" },
  { value: "monthly", label: "M" },
  { value: "yearly", label: "Y" },
];

const AttendanceChart: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<
    "daily" | "weekly" | "monthly" | "yearly"
  >("daily");
  const [stats, setStats] = useState({
    totalPresent: 0,
    totalLate: 0,
    totalAbsent: 0,
    totalOnLeave: 0,
    totalRecords: 0,
    attendancePercentage: 0,
  });
  const dispatch = useDispatch<AppDispatch>();

  const fetchStats = useCallback(async () => {
    const today = nowBusiness();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);

    switch (activeFilter) {
      case "weekly":
        startDate.setDate(today.getDate() - 6);
        break;
      case "monthly":
        startDate.setMonth(today.getMonth() - 1);
        break;
      case "yearly":
        startDate.setFullYear(today.getFullYear() - 1);
        break;
    }

    try {
      const response = await fetchAttendanceStatsForRange(
        dispatch,
        format(startDate, "yyyy-MM-dd"),
        format(today, "yyyy-MM-dd")
      );
      const result = response?.result;
      if (result) {
        setStats({
          totalPresent: result.totalPresent ?? 0,
          totalLate: result.totalLate ?? 0,
          totalAbsent: result.totalAbsent ?? 0,
          totalOnLeave: result.totalOnLeave ?? 0,
          totalRecords: result.totalRecords ?? 0,
          attendancePercentage: result.attendancePercentage ?? 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch attendance overview stats:", error);
    }
  }, [dispatch, activeFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const toPercent = (count: number) =>
    stats.totalRecords > 0 ? Math.round((count / stats.totalRecords) * 100) : 0;

  const presentPct = toPercent(stats.totalPresent);
  const latePct = toPercent(stats.totalLate);
  const absentPct = toPercent(stats.totalAbsent);
  const leavePct = toPercent(stats.totalOnLeave);

  const data: ChartData<"bar"> = {
    labels: [""],
    datasets: [
      {
        label: "Present",
        data: [presentPct],
        backgroundColor: "#597BE8BF",
      },
      {
        label: "Late",
        data: [latePct],
        backgroundColor: "#1C202FB2",
      },
      {
        label: "Absent",
        data: [absentPct],
        backgroundColor: "#FEC84B",
      },
      {
        label: "Leave",
        data: [leavePct],
        backgroundColor: "#F97066",
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    indexAxis: "y",
    scales: {
      x: {
        stacked: true,
        display: false,
        max: 100,
      },
      y: {
        stacked: true,
        display: false,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
    elements: {
      bar: {
        borderRadius: {
          topLeft: 8,
          topRight: 8,
          bottomLeft: 8,
          bottomRight: 8,
        },
        borderWidth: 0,
        borderSkipped: false,
      },
    },
    maintainAspectRatio: false,
  };

  const handleFilterChange = (
    filter: "daily" | "weekly" | "monthly" | "yearly"
  ) => {
    setActiveFilter(filter);
  };

  return (
    <div className="lg:col-span-4 bg-g-background-100 rounded-[var(--g-radius-md)] shadow-geist-card overflow-hidden p-4 lg:p-6 border-[1px] border-(--genrel-light-stroke)">
      <div className="flex flex-col gap-2 sm:flex-row justify-between">
        <h2 className="text-(--genrel-text-light) text-heading-16">
          Attendance Overview
        </h2>
        <div className="">
          <SegmentedTabs
            options={PERIOD_OPTIONS}
            value={activeFilter}
            onChange={handleFilterChange}
          />
        </div>
      </div>
      <div className="py-[32px]">
        <h1 className="text-g-gray-1000 text-[48px] font-semibold">
          {stats.attendancePercentage}%
        </h1>
        <div className="flex justify-between">
          <span className="text-(--genrel-text-light) text-base font-medium">
            Attendance Rate
          </span>
          <span className="text-(--genrel-text-light) text-base font-medium">
            {stats.totalPresent + stats.totalLate} Present of {stats.totalRecords} Records
          </span>
        </div>
      </div>
      <div className="w-full h-4 mb-6">
        <div className="relative h-full rounded-full overflow-hidden">
          <Bar data={data} options={options} height={16} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: "Present", color: "#597BE8BF", value: presentPct },
          { label: "Late", color: "#1C202FB2", value: latePct },
          { label: "Absent", color: "#FEC84B", value: absentPct },
          { label: "Leave", color: "#F97066", value: leavePct },
        ].map((item) => (
          <div key={item.label} className="flex items-center">
            <span
              className="w-2 h-[18px] rounded-full mr-1.5"
              style={{ backgroundColor: item.color }}
            ></span>
            <span className="font-bold text-(--genrel-text-light) mr-1  text-base">
              {item.value}
            </span>
            <span className="mr-1 pb-0.5">:</span>
            <span className="text-(--genrel-text-light) text-base font-medium mt-.5">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttendanceChart;
