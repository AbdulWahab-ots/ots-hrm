"use client";
import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  ChartData,
  ChartOptions,
} from "chart.js";
import { useColorMode } from "@/components/theme/ColorModeProvider";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface PayrollOverviewProps {
  totalNet: number;
  departmentLabels: string[];
  departmentTotals: number[];
}

const PayrollOverview: React.FC<PayrollOverviewProps> = ({
  totalNet,
  departmentLabels,
  departmentTotals,
}) => {
  const { theme } = useColorMode();
  const isDark = theme === "dark";
  const hasData = departmentLabels.length > 0;

  const data: ChartData<"bar"> = {
    labels: hasData ? departmentLabels : ["—"],
    datasets: [
      {
        data: hasData ? departmentTotals : [0],
        backgroundColor: "#006bff",
        borderColor: isDark ? "#000000" : "#ffffff",
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
        backgroundColor: isDark ? "#1f1f1f" : "#ffffff",
        titleColor: isDark ? "#ededed" : "#171717",
        bodyColor: isDark ? "#ededed" : "#171717",
        borderColor: isDark ? "#2e2e2e" : "#eaeaea",
        borderWidth: 1,
        callbacks: {
          label: (context) =>
            `PKR ${Number(context.parsed.y).toLocaleString()}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: isDark ? "#a0a0a0" : "#4d4d4d" },
        border: { display: false },
        grid: { color: isDark ? "#ffffff17" : "#0000000d" },
      },
      x: {
        ticks: { color: isDark ? "#ededed" : "#171717" },
        grid: { display: false },
      },
    },
    elements: {
      bar: { borderRadius: 8 },
    },
    datasets: {
      bar: { barThickness: 21 },
    },
  };

  return (
    <div className="w-full lg:col-span-4 p-4 lg:p-6 bg-g-background-100 border border-g-gray-alpha-400 shadow-geist-card rounded-3xl lg:rounded-[32px]">
      <div className="flex flex-col sm:flex-row justify-between items-start pb-4">
        <div>
          <p className="text-sm text-g-gray-900 font-medium">Total Payroll</p>
          <h2 className="lg:text-[36px] text-3xl text-g-gray-1000 font-semibold">
            PKR {totalNet.toLocaleString()}
          </h2>
        </div>
      </div>
      <div className="flex justify-between font-normal pb-2">
        <p className="text-g-gray-800 text-xs">
          Net salary distribution by department
        </p>
      </div>
      <div className="h-[250px]">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

export default PayrollOverview;
