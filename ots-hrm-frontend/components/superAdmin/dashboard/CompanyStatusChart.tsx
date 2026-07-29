"use client";
import React from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const CompanyStatusChart: React.FC = () => {
  const data: ChartData<"doughnut"> = {
    labels: ["Active", "Inactive", "Pending"],
    datasets: [
      {
        data: [70, 20, 10],
        backgroundColor: [
          "#ffae00", // Active (amber-700)
          "#17171780", // Inactive (gray-1000 @ 50%)
          "#82eb8d", // Pending (green-500)
        ],
        borderWidth: 0,
        borderRadius: 10, // Equal rounded corners for all segments
        spacing: 4, // Increased spacing between segments
        weight: 1, // Equal weight for all segments
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    cutout: "70%",
    rotation: -90, // Start from top
    circumference: 360,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || "";
            const value = context.raw as number;
            return `${label}: ${value}%`;
          },
        },
      },
    },
    // Equal spacing between segments
    elements: {
      arc: {
        borderJoinStyle: "round",
      },
    },
  };

  return (
    <div className="w-full col-span-1  md:col-span-2 p-4 bg-g-background-100 lg:p-6 rounded-[var(--g-radius-md)] border-[1px] border-g-gray-alpha-400 shadow-geist-card">
      <h2 className="text-heading-24 mb-6 text-g-gray-1000">
        Company Status
      </h2>
      <div className="flex flex-col items-center space-y-6">
        <div className="w-2/3 max-w-[200px]">
          <Doughnut data={data} options={options} />
        </div>
        <div className="w-full">
          <ul className="space-y-4">
            <li className="flex justify-between items-center px-4">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-g-amber-700 mr-3"></span>
                <span className="text-g-gray-900 text-label-14">
                  Active
                </span>
              </div>
              <span className="font-medium text-g-gray-1000 text-base">70%</span>
            </li>
            <li className="flex justify-between items-center px-4">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-g-gray-1000/50 mr-3"></span>
                <span className="text-g-gray-900 text-label-14">
                  Inactive
                </span>
              </div>
              <span className="font-medium text-g-gray-1000 text-base">20%</span>
            </li>
            <li className="flex justify-between items-center px-4">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-g-green-500 mr-3"></span>
                <span className="text-g-gray-900 text-label-14">
                  Pending
                </span>
              </div>
              <span className="font-medium text-g-gray-1000 text-base">10%</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CompanyStatusChart;
