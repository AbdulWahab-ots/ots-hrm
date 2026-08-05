"use client";
import React, { useMemo, useRef, useState } from "react";
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
import { Department } from "@/utils/types";

const PERIOD_OPTIONS: { value: "year" | "month"; label: string }[] = [
  { value: "year", label: "Y" },
  { value: "month", label: "M" },
];

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DepartmentPercentageChartProps {
  departments: Department[];
}

const DepartmentPercentageChart: React.FC<DepartmentPercentageChartProps> = ({
  departments,
}) => {
  const chartRef = useRef<Chart<"bar">>(null);
  const [activeFilter, setActiveFilter] = useState<"year" | "month">("year");

  const handleFilterChange = (filter: "year" | "month") => {
    setActiveFilter(filter);
  };

  // Real timeline of department creation: count of departments created per
  // month (year view) or per week of the current month (month view).
  const { labels, counts } = useMemo(() => {
    const now = new Date();

    if (activeFilter === "year") {
      const buckets = new Array(12).fill(0);
      departments.forEach((dept) => {
        const created = new Date(dept.createdAt);
        if (created.getFullYear() === now.getFullYear()) {
          buckets[created.getMonth()] += 1;
        }
      });
      return { labels: MONTH_LABELS, counts: buckets };
    }

    const weekLabels = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];
    const buckets = new Array(5).fill(0);
    departments.forEach((dept) => {
      const created = new Date(dept.createdAt);
      if (
        created.getFullYear() === now.getFullYear() &&
        created.getMonth() === now.getMonth()
      ) {
        const weekIndex = Math.min(Math.floor((created.getDate() - 1) / 7), 4);
        buckets[weekIndex] += 1;
      }
    });
    return { labels: weekLabels, counts: buckets };
  }, [departments, activeFilter]);

  const data: ChartData<"bar"> = {
    labels,
    datasets: [
      {
        data: counts,
        backgroundColor: "#32D583",
        borderColor: "#fff",
        borderWidth: 1,
        barPercentage: 0.5,
        categoryPercentage: 1.0,
      },
    ],
  };

  const maxCount = Math.max(1, ...counts);

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context) =>
            `${context.parsed.y} department${context.parsed.y === 1 ? "" : "s"}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: maxCount,
        ticks: {
          color: "#7782AE",
          precision: 0,
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
