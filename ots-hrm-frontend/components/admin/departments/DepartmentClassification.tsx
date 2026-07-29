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
import { CircleAlert } from "lucide-react";
import HeaderWithTooltip from "@/components/common/Typography/HeaderWithTooltip";
import SegmentedTabs from "@/components/common/SegmentedTabs";

const PERIOD_OPTIONS: { value: "year" | "month"; label: string }[] = [
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

const DepartmentPercentageChart: React.FC = () => {
  const chartRef = useRef<Chart<"bar">>(null);
  const [activeFilter, setActiveFilter] = useState<"year" | "month">("year");

  // Sample data for different time filters
  const filterData = {
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

  const handleFilterChange = (filter: "year" | "month") => {
    setActiveFilter(filter);
  };

  // Dynamically set background color based on value
  const getBackgroundColors = (data: number[]) => {
    return data.map((value) => (value < 50 ? "#F97066" : "#32D583"));
  };

  const data: ChartData<"bar"> = {
    labels: filterData[activeFilter].labels,
    datasets: [
      {
        data: filterData[activeFilter].data,
        backgroundColor: getBackgroundColors(filterData[activeFilter].data),
        borderColor: "#fff",
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
        ticks: { color: "#3C4566" },
        grid: { display: false },
      },
    },
    elements: {
      bar: {
        borderRadius: 8, // Top radius for bars
      },
    },
    datasets: {
      bar: {
        barThickness: 21, // Fixed bar width of 21px
      },
    },
  };

  return (
    <div className="w-full lg:col-span-4 p-4 lg:p-6 bg-g-background-100 border border-g-gray-alpha-400 rounded-[var(--g-radius-lg)] shadow-geist-card">
      <div className="flex pb-4 justify-between items-start">
        <HeaderWithTooltip
          title="Department Classification"
          tooltipContent="This shows the timeline of company department creation"
          iconSize={12}
        />
        <SegmentedTabs
          options={PERIOD_OPTIONS}
          value={activeFilter}
          onChange={handleFilterChange}
        />
      </div>

      <div className="h-[250px]">
        <Bar ref={chartRef} data={data} options={options} />
      </div>
    </div>
  );
};

export default DepartmentPercentageChart;
