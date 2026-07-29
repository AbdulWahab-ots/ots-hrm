"use client";
import React, { useRef, useState } from "react";
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
import HeaderWithTooltip from "@/components/common/Typography/HeaderWithTooltip";

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

const ATTENDANCE_DATA = {
  year: {
    present: [38, 40, 42, 37, 39, 35, 30], // Present employees (non-zero for Sunday)
    absent: [12, 10, 8, 13, 11, 15, 0], // Absent employees (0 for Sunday to test absent=0 case)
  },
  month: {
    present: [36, 39, 41, 35, 38, 34, 29],
    absent: [14, 11, 9, 15, 12, 16, 21],
  },
  week: {
    present: [37, 38, 40, 36, 37, 33, 28],
    absent: [13, 12, 10, 14, 13, 17, 22],
  },
  day: {
    present: [35, 37, 39, 34, 36, 32, 27],
    absent: [15, 13, 11, 16, 14, 18, 23],
  },
};

type FilterType = "year" | "month" | "week" | "day";

const EmployeeByDepartment: React.FC = () => {
  const chartRef = useRef<Chart<"bar">>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("year");

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
  };

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

  const data: ChartData<"bar"> = {
    labels: DAYS,
    datasets: [
      {
        label: "Present",
        data: ATTENDANCE_DATA[activeFilter].present,
        backgroundColor: "#006bff",
        borderColor: "#fff",
        borderWidth: 1,
        barPercentage: 0.45,
        categoryPercentage: 0.95,
        borderRadius: (context) => {
          const index = context.dataIndex;
          const absentValue = ATTENDANCE_DATA[activeFilter].absent[index];
          return getBorderRadius(absentValue).present;
        },
        borderSkipped: false, // Ensure all corners can be rounded
      },
      {
        label: "Absent",
        data: ATTENDANCE_DATA[activeFilter].absent,
        backgroundColor: "#fc0035",
        borderColor: "#fff",
        borderWidth: 1,
        barPercentage: 0.45,
        categoryPercentage: 0.95,
        borderRadius: (context) => {
          const index = context.dataIndex;
          const absentValue = ATTENDANCE_DATA[activeFilter].absent[index];
          return getBorderRadius(absentValue).absent;
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
        max: 60,
        ticks: {
          color: "#8f8f8f",
          stepSize: 10,
          callback: (value) => `${value}`,
        },
        border: { display: false },
        grid: {
          // Corrected from grid25 to grid
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
