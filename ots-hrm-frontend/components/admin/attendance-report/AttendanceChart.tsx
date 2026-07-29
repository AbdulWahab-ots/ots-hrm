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

  // Define data for different filters
  const filterData = {
    daily: {
      Present: 60,
      Late: 20,
      Absent: 10,
      Leave: 10,
    },
    weekly: {
      Present: 65,
      Late: 15,
      Absent: 15,
      Leave: 5,
    },
    monthly: {
      Present: 70,
      Late: 10,
      Absent: 12,
      Leave: 8,
    },
    yearly: {
      Present: 75,
      Late: 8,
      Absent: 10,
      Leave: 7,
    },
  };

  const data: ChartData<"bar"> = {
    labels: [""],
    datasets: [
      {
        label: "Present",
        data: [filterData[activeFilter].Present],
        backgroundColor: "#597BE8BF",
      },
      {
        label: "Late",
        data: [filterData[activeFilter].Late],
        backgroundColor: "#1C202FB2",
      },
      {
        label: "Absent",
        data: [filterData[activeFilter].Absent],
        backgroundColor: "#FEC84B",
      },
      {
        label: "Leave",
        data: [filterData[activeFilter].Leave],
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
        <h1 className="text-g-gray-1000 text-[48px] font-semibold">65%</h1>
        <div className="flex justify-between">
          <span className="text-(--genrel-text-light) text-base font-medium">
            Attendance Rate
          </span>
          <span className="text-(--genrel-text-light) text-base font-medium">
            40 Hours completed out of 44
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
            color: "#597BE8BF",
            value: filterData[activeFilter].Present,
          },
          {
            label: "Late",
            color: "#1C202FB2",
            value: filterData[activeFilter].Late,
          },
          {
            label: "Absent",
            color: "#FEC84B",
            value: filterData[activeFilter].Absent,
          },
          {
            label: "Leave",
            color: "#F97066",
            value: filterData[activeFilter].Leave,
          },
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
