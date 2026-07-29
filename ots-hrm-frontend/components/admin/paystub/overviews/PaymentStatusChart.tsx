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
import { useColorMode } from "@/components/theme/ColorModeProvider";

ChartJS.register(ArcElement, Tooltip, Legend);

interface PaymentStatusChartProps {
  statusCounts: Record<string, number>;
}

// Payroll statuses (matches PayrollStatus on the backend), with display colours.
const STATUS_META: { key: string; label: string; color: string }[] = [
  { key: "PAID", label: "Paid", color: "#28a948" },
  { key: "APPROVED", label: "Approved", color: "#82eb8d" },
  { key: "PENDING", label: "Pending", color: "#ffae00" },
  { key: "DRAFT", label: "Draft", color: "#8f8f8f" },
  { key: "REJECTED", label: "Rejected", color: "#fc0035" },
  { key: "CANCELLED", label: "Cancelled", color: "#7d7d7d" },
];

const PaymentStatusChart: React.FC<PaymentStatusChartProps> = ({
  statusCounts,
}) => {
  const { theme } = useColorMode();
  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const present = STATUS_META.filter((s) => (statusCounts[s.key] || 0) > 0);
  const shown = present.length > 0 ? present : STATUS_META;

  const data: ChartData<"doughnut"> = {
    labels: shown.map((s) => s.label),
    datasets: [
      {
        data: shown.map((s) => statusCounts[s.key] || 0),
        backgroundColor: shown.map((s) => s.color),
        borderWidth: 0,
        borderRadius: 10,
        spacing: 4,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    cutout: "70%",
    rotation: -90,
    circumference: 360,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: theme === "dark" ? "#1f1f1f" : "#ffffff",
        titleColor: theme === "dark" ? "#ededed" : "#171717",
        bodyColor: theme === "dark" ? "#ededed" : "#171717",
        borderColor: theme === "dark" ? "#2e2e2e" : "#eaeaea",
        borderWidth: 1,
        callbacks: {
          label: (context) => `${context.label}: ${context.raw}`,
        },
      },
    },
    elements: {
      arc: { borderJoinStyle: "round" },
    },
  };

  return (
    <div className="w-full col-span-1 md:col-span-2 p-4 bg-g-background-100 lg:p-6 rounded-2xl border-[1px] border-g-gray-alpha-400 shadow-geist-card lg:rounded-3xl">
      <h2 className="text-base font-medium mb-6 text-g-gray-900">
        Salary Status
      </h2>
      <div className="flex flex-col items-center space-y-6">
        <div className="w-2/3 max-w-[200px]">
          {total > 0 ? (
            <Doughnut data={data} options={options} />
          ) : (
            <p className="text-center text-sm text-g-gray-800 py-10">
              No payroll yet
            </p>
          )}
        </div>
        <div className="w-full">
          <ul className="space-y-4">
            {shown.map((s) => (
              <li
                key={s.key}
                className="flex justify-between items-center px-4"
              >
                <div className="flex items-center">
                  <span
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: s.color }}
                  ></span>
                  <span className="text-g-gray-900 text-sm font-normal">
                    {s.label}
                  </span>
                </div>
                <span className="font-medium text-g-gray-1000 text-base">
                  {statusCounts[s.key] || 0}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PaymentStatusChart;
