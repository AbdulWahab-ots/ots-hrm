"use client";
import React, { useState } from "react";
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
import SegmentedTabs from "@/components/common/SegmentedTabs";

ChartJS.register(CategoryScale, LinearScale, BarElement, Legend);

const PERIOD_OPTIONS: { value: "monthly" | "yearly"; label: string }[] = [
  { value: "monthly", label: "M" },
  { value: "yearly", label: "Y" },
];

const LeavesChart: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<"monthly" | "yearly">(
    "monthly"
  );

  // Define data for different filters
  const filterData = {
    monthly: {
      Present: 70,
      // Late: 10,
      Absent: 12,
      Leave: 18,
    },
    yearly: {
      Present: 55,
      // Late: 8,
      Absent: 30,
      Leave: 15,
    },
  };

  const data: ChartData<"bar"> = {
    labels: [""],
    datasets: [
      {
        label: "Balance",
        data: [filterData[activeFilter].Present],
        backgroundColor: "#006bff",
      },

      {
        label: "Absents",
        data: [filterData[activeFilter].Absent],
        backgroundColor: "#ffae00",
      },
      {
        label: "Leaves",
        data: [filterData[activeFilter].Leave],
        backgroundColor: "#fc0035",
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
      tooltip: {
        enabled: false, // 🔥 disables hover tooltip
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

  const handleFilterChange = (filter: "monthly" | "yearly") => {
    setActiveFilter(filter);
  };

  return (
    <div className="lg:col-span-3 bg-g-background-100 rounded-[var(--g-radius-md)] overflow-hidden p-4 lg:p-6 border-[1px] border-(--genrel-light-stroke) shadow-geist-card">
      <div className="flex justify-between">
        <h2 className="text-(--genrel-text-light) font-medium text-base">
          Leaves Overview
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
        <h1 className="text-heading-48 text-g-gray-1000">65%</h1>
        <div className="flex justify-between">
          <span className="text-(--genrel-text-light) text-base font-medium">
            Leave Rate
          </span>
          <span className="text-(--genrel-text-light) text-base font-medium">
            18 of 24
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
          {
            label: "Present",
            color: "#006bff",
            value: filterData[activeFilter].Present,
          },

          {
            label: "Absent",
            color: "#ffae00",
            value: filterData[activeFilter].Absent,
          },
          {
            label: "Leave",
            color: "#fc0035",
            value: filterData[activeFilter].Leave,
          },
        ].map((item) => (
          <div key={item.label} className="flex items-center">
            <span
              className="w-2 h-[18px] rounded-full mr-1.5"
              style={{ backgroundColor: item.color }}
            ></span>
            <span className="font-bold text-(--genrel-text-light) mr-1 text-base">
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

export default LeavesChart;
