"use client";
import React, { useRef, useState } from "react";
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
import HeaderWithTooltip from "@/components/common/Typography/HeaderWithTooltip";
import SegmentedTabs from "@/components/common/SegmentedTabs";

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

  // Sample data for different time filters
  const filterData = {
    day: {
      labels: [
        "IT",
        "Human Resources",
        "Design",
        "Marketing",
        "Finance",
        "Customer Support",
        "Clinics",
      ],
      data: [60, 80, 55, 70, 40, 90, 50],
    },
    week: {
      labels: [
        "IT",
        "Human Resources",
        "Design",
        "Marketing",
        "Finance",
        "Customer Support",
        "Clinics",
      ],
      data: [55, 75, 65, 85, 30, 70, 60],
    },
    year: {
      labels: [
        "IT",
        "Human Resources",
        "Design",
        "Marketing",
        "Finance",
        "Customer Support",
        "Clinics",
      ],
      data: [50, 75, 90, 50, 25, 60, 75],
    },
    month: {
      labels: [
        "IT",
        "Human Resources",
        "Design",
        "Marketing",
        "Finance",
        "Customer Support",
        "Clinics",
      ],
      data: [30, 60, 80, 40, 20, 90, 50],
    },
  };

  const handleFilterChange = (filter: "day" | "week" | "year" | "month") => {
    setActiveFilter(filter);
  };

  const data: ChartData<"bar"> = {
    labels: filterData[activeFilter].labels,
    datasets: [
      {
        data: filterData[activeFilter].data,
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
          title="Company Creation Timeline"
          tooltipContent="This shows the timeline of company department creation"
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
