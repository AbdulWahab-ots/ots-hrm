"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
  Chart,
} from "chart.js";
import { useDispatch } from "react-redux";
import { format } from "date-fns";
import HeaderWithTooltip from "@/components/common/Typography/HeaderWithTooltip";
import SegmentedTabs from "@/components/common/SegmentedTabs";
import { AppDispatch } from "@/store/store";
import { fetchAttendanceRecordsForRange } from "@/services/adminServices";
import { nowBusiness } from "@/utils/timezone";

const PERIOD_OPTIONS: {
  value: "day" | "week" | "year" | "month";
  label: string;
}[] = [
  { value: "day", label: "D" },
  { value: "week", label: "W" },
  { value: "year", label: "Y" },
  { value: "month", label: "M" },
];

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const DepartmentAttendence: React.FC = () => {
  const chartRef = useRef<Chart<"bar">>(null);
  const [activeFilter, setActiveFilter] = useState<
    "day" | "week" | "year" | "month"
  >("year");
  const [labels, setLabels] = useState<string[]>([]);
  const [percentages, setPercentages] = useState<number[]>([]);
  const dispatch = useDispatch<AppDispatch>();

  const fetchDepartmentAttendance = useCallback(async () => {
    const today = nowBusiness();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);

    switch (activeFilter) {
      case "week":
        startDate.setDate(today.getDate() - 6);
        break;
      case "month":
        startDate.setMonth(today.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      // "day": startDate === today already
    }

    try {
      const response = await fetchAttendanceRecordsForRange(
        dispatch,
        format(startDate, "yyyy-MM-dd"),
        format(today, "yyyy-MM-dd"),
        ["user", "user.employee", "user.employee.department"]
      );
      const records: any[] = response?.result?.data ?? [];

      const byDepartment = new Map<string, { present: number; total: number }>();
      records.forEach((record) => {
        if (record.status === "DAY_OFF" || record.status === "HOLIDAY") return;
        const deptName = record.user?.employee?.department?.name || "No Department";
        const bucket = byDepartment.get(deptName) || { present: 0, total: 0 };
        bucket.total += 1;
        if (record.status === "PRESENT" || record.status === "LATE") {
          bucket.present += 1;
        }
        byDepartment.set(deptName, bucket);
      });

      const entries = Array.from(byDepartment.entries());
      setLabels(entries.map(([name]) => name));
      setPercentages(
        entries.map(([, { present, total }]) =>
          total > 0 ? Math.round((present / total) * 100) : 0
        )
      );
    } catch (error) {
      console.error("Failed to fetch department attendance:", error);
      setLabels([]);
      setPercentages([]);
    }
  }, [dispatch, activeFilter]);

  useEffect(() => {
    fetchDepartmentAttendance();
  }, [fetchDepartmentAttendance]);

  const handleFilterChange = (filter: "day" | "week" | "year" | "month") => {
    setActiveFilter(filter);
  };

  const data: ChartData<"bar"> = {
    labels,
    datasets: [
      {
        data: percentages,
        backgroundColor: "#597BE8BF",
        borderColor: "#597BE8BF",
        borderWidth: 1,
        barPercentage: 0.5,
        categoryPercentage: 1.0,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context) => `${context.parsed.y}%`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: "#7782AE",
          stepSize: 25,
          callback: (value) => `${value}`,
        },
        border: { display: false },
        grid: { color: "rgba(0, 0, 0, 0.05)" },
      },
      x: {
        ticks: { color: "#597BE8BF" },
        grid: { display: false },
      },
    },
    elements: {
      bar: {
        borderRadius: 8,
      },
    },
    datasets: {
      bar: {
        barThickness: 21,
      },
    },
  };

  return (
    <div className="w-full  lg:col-span-5  p-4 lg:p-6 bg-g-background-100 shadow-geist-card  border-[1px] border-(--genrel-light-stroke) rounded-[var(--g-radius-md)]">
      <div className="flex flex-col sm:flex-row pb-4 justify-between gap-2 items-start">
        <HeaderWithTooltip
          title="Department Attendance"
          tooltipContent="This shows the attendance rate per department"
          iconSize={12}
        />
        <SegmentedTabs
          options={PERIOD_OPTIONS}
          value={activeFilter}
          onChange={handleFilterChange}
        />
      </div>

      <div className="h-[350px]">
        <Bar ref={chartRef} data={data} options={options} />
      </div>
    </div>
  );
};

export default DepartmentAttendence;
