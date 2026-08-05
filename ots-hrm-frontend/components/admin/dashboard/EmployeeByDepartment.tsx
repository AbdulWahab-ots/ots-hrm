"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  ChartData,
  ChartOptions,
  Chart,
} from "chart.js";
import { useDispatch } from "react-redux";
import HeaderWithTooltip from "@/components/common/Typography/HeaderWithTooltip";
import { AppDispatch } from "@/store/store";
import { fetchAttendanceRecordsForRange } from "@/services/adminServices";
import { nowBusiness } from "@/utils/timezone";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const EmployeeByDepartment: React.FC = () => {
  const chartRef = useRef<Chart<"bar">>(null);
  const dispatch = useDispatch<AppDispatch>();
  const [present, setPresent] = useState<number[]>(new Array(7).fill(0));
  const [absent, setAbsent] = useState<number[]>(new Array(7).fill(0));

  useEffect(() => {
    const fetchWeekAttendance = async () => {
      const today = nowBusiness();
      // ISO day-of-week: Monday = 0 ... Sunday = 6
      const isoDayIndex = (today.getDay() + 6) % 7;
      const monday = new Date(today);
      monday.setDate(today.getDate() - isoDayIndex);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      try {
        const response = await fetchAttendanceRecordsForRange(
          dispatch,
          formatLocalDate(monday),
          formatLocalDate(sunday)
        );
        const records: any[] = response?.result?.data ?? [];

        const presentCounts = new Array(7).fill(0);
        const absentCounts = new Array(7).fill(0);

        records.forEach((record) => {
          const recordDate = new Date(record.date);
          const dayIndex = (recordDate.getDay() + 6) % 7;
          if (record.status === "PRESENT" || record.status === "LATE") {
            presentCounts[dayIndex] += 1;
          } else if (record.status === "ABSENT") {
            absentCounts[dayIndex] += 1;
          }
        });

        setPresent(presentCounts);
        setAbsent(absentCounts);
      } catch (error) {
        console.error("Failed to fetch weekly attendance stats:", error);
      }
    };
    fetchWeekAttendance();
  }, [dispatch]);

  // Dynamically set borderRadius based on absent data
  const getBorderRadius = (absentValue: number) => {
    if (absentValue > 0) {
      return {
        present: {
          topLeft: 20,
          topRight: 20,
          bottomLeft: 20,
          bottomRight: 20,
        },
        absent: {
          topLeft: 20,
          topRight: 20,
          bottomLeft: 20,
          bottomRight: 20,
        },
      };
    }
    return {
      present: {
        topLeft: 20,
        topRight: 20,
        bottomLeft: 20,
        bottomRight: 20,
      },
      absent: {
        topLeft: 0,
        topRight: 0,
        bottomLeft: 0,
        bottomRight: 0,
      },
    };
  };

  const maxCount = Math.max(
    10,
    ...present.map((v, i) => v + absent[i])
  );

  const data: ChartData<"bar"> = {
    labels: DAYS,
    datasets: [
      {
        label: "Present",
        data: present,
        backgroundColor: "#006bff",
        borderColor: "#fff",
        borderWidth: 1,
        barPercentage: 0.45,
        categoryPercentage: 0.95,
        borderRadius: (context) => {
          const index = context.dataIndex;
          return getBorderRadius(absent[index]).present;
        },
        borderSkipped: false, // Ensure all corners can be rounded
      },
      {
        label: "Absent",
        data: absent,
        backgroundColor: "#fc0035",
        borderColor: "#fff",
        borderWidth: 1,
        barPercentage: 0.45,
        categoryPercentage: 0.95,
        borderRadius: (context) => {
          const index = context.dataIndex;
          return getBorderRadius(absent[index]).absent;
        },
        borderSkipped: false, // Ensure all corners can be rounded
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide the legend (Present and Absent headings)
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context) =>
            `${context.dataset.label}: ${context.parsed.y} employees`,
        },
      },
    },
    scales: {
      y: {
        stacked: true,
        beginAtZero: true,
        max: maxCount,
        ticks: {
          color: "#8f8f8f",
          precision: 0,
        },
        border: { display: false },
        grid: {
          color: "rgba(0, 0, 0, 0.02)",
        },
      },
      x: {
        stacked: true,
        ticks: { color: "#4d4d4d" },
        grid: { display: false },
      },
    },
    datasets: {
      bar: { barThickness: 20 },
    },
  };

  return (
    <div className="w-full lg:col-span-3 p-4 lg:p-6 bg-g-background-100 border-[1px] border-g-gray-alpha-400 rounded-[var(--g-radius-md)] shadow-geist-card">
      <div className="flex justify-between  items-center pb-6 flex-wrap">
        <HeaderWithTooltip
          title="Daily Attendance Statistics"
          tooltipContent="This shows the daily attendance of employees, with present and absent counts"
          iconSize={12}
        />
        <div className="flex gap-2">
          <div className="flex gap-2 items-center">
            <p className="w-2 h-2 rounded-full bg-g-red-700"></p>
            <span className="text-g-gray-900 text-sm font-medium">Absent</span>
          </div>
          <div className="flex gap-2 items-center">
            <p className="w-2 h-2 rounded-full bg-g-blue-700"></p>
            <span className="text-g-gray-900 text-sm font-medium">Present</span>
          </div>
        </div>
      </div>
      <div className="h-[280px]">
        <Bar ref={chartRef} data={data} options={options} />
      </div>
    </div>
  );
};

export default EmployeeByDepartment;
