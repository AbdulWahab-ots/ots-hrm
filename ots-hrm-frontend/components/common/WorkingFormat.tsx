"use client";

import React, { useEffect, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from "chart.js";
import { useDispatch } from "react-redux";
import HeaderWithTooltip from "@/components/common/Typography/HeaderWithTooltip";
import { GoDotFill } from "react-icons/go";
import { AppDispatch } from "@/store/store";
import { getAllVacationsAPI } from "@/services/employeeService";
import { GetVacationsPayload, Vocation } from "@/utils/company";
import { fetchEmployeeStats } from "@/services/adminServices";
import { todayBusinessISO } from "@/utils/timezone";

ChartJS.register(ArcElement, Tooltip, Legend);

interface WorkingFormatChartProps {
  role?: string; // 'employee' or 'admin'
}

const WorkingFormatChart: React.FC<WorkingFormatChartProps> = ({ role }) => {
  const isEmployee = role === "employee";
  const dispatch = useDispatch<AppDispatch>();
  // Employee-dashboard usage of this gauge (this employee's own onsite/remote
  // status) is out of scope here - only the admin (company-wide) usage below
  // is wired to real data, so the employee view keeps its prior placeholder.
  const [remotePercentage, setRemotePercentage] = useState(isEmployee ? 40 : 0);

  // Admin view: company-wide % of employees on an approved remote-work
  // request covering today, vs everyone else (onsite).
  useEffect(() => {
    if (isEmployee) return;

    const fetchRemoteWorkSplit = async () => {
      const today = todayBusinessISO();
      const payload: GetVacationsPayload = {
        pagedListRequest: { pageNo: 1, pageSize: 1000, getAllRecords: true },
        queryOptionsRequest: {
          filtersRequest: [
            { field: "requestType", operator: 1, matchMode: 1, value: "REMOTE_WORK" },
            { field: "status", operator: 1, matchMode: 1, value: "APPROVED" },
          ],
          sortRequest: [],
          includes: [],
        },
      };

      try {
        const [vacationResponse, employeeStats] = await Promise.all([
          getAllVacationsAPI(dispatch, payload),
          fetchEmployeeStats(dispatch),
        ]);

        const remoteToday = (vacationResponse?.result?.data ?? []).filter(
          (vacation: Vocation) =>
            vacation.fromDate &&
            vacation.toDate &&
            vacation.fromDate <= today &&
            vacation.toDate >= today
        ).length;

        const totalEmployees = employeeStats?.result?.totalEmployees ?? 0;
        setRemotePercentage(
          totalEmployees > 0
            ? Math.round((remoteToday / totalEmployees) * 100)
            : 0
        );
      } catch (error) {
        console.error("Failed to fetch working format split:", error);
      }
    };

    fetchRemoteWorkSplit();
  }, [isEmployee, dispatch]);

  const onsitePercentage = 100 - remotePercentage;

  // Background circle
  const backgroundData: ChartData<"doughnut"> = {
    labels: ["Background"],
    datasets: [
      {
        data: [100],
        backgroundColor: [
          isEmployee ? "var(--g-gray-300)" : "rgba(255, 255, 255, 0.3)",
        ],
        borderWidth: 0,
        borderRadius: 0,
        spacing: 0,
      },
    ],
  };

  // Foreground donut
  const foregroundData: ChartData<"doughnut"> = {
    labels: [isEmployee ? "Onsite" : "Remote", "Hidden"],
    datasets: [
      {
        data: [remotePercentage, onsitePercentage],
        backgroundColor: [
          isEmployee ? "var(--g-blue-700)" : "#FFFFFF", // Blue for employee, white for admin
          isEmployee ? "var(--g-gray-300)" : "rgba(0,0,0,0)", // Gray for employee, transparent for admin
        ],
        borderWidth: 0,
        borderRadius: 50,
        spacing: 0,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    cutout: "75%",
    rotation: -20,
    circumference: 360,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    maintainAspectRatio: false,
  };
  return (
    <div
      className={`w-full xl:col-span-2 p-4  rounded-[var(--g-radius-lg)] border border-[var(--border-light)] shadow-geist-card flex flex-col items-center gap-16 overflow-hidden ${
        isEmployee ? "bg-g-background-100 text-g-gray-1000" : "text-white"
      }`}
      style={
        isEmployee
          ? {}
          : { background: "linear-gradient(135deg, var(--g-blue-700) 0%, var(--g-teal-700) 100%)" }
      }
    >
      {/* Header */}
      <HeaderWithTooltip
        title="Working format"
        tooltipContent="Daily Working format"
        whiteText={!isEmployee}
      />

      {/* Donut + labels grouped vertically */}
      <div className="flex flex-col items-center justify-center gap-20 w-full mt-4">
        {/* Donut Chart */}
        <div className="relative w-38 h-38">
          {/* Background ring */}
          <div className="absolute inset-0">
            <Doughnut data={backgroundData} options={options} />
          </div>

          {/* Foreground donut */}
          <div className="absolute inset-0">
            <Doughnut data={foregroundData} options={options} />
          </div>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span
              className={`text-label-14 font-medium ${
                isEmployee ? "text-[--text-light]" : "text-[var(--General-Surface-Primary)]"
              }`}
            >
              {isEmployee ? "" : "Remote"}
            </span>
            <span className="lg:text-[33.75px] font-semibold">{remotePercentage}%</span>
          </div>
        </div>

        {/* Onsite / Remote labels */}
        {isEmployee &&(
          <div className="flex justify-center gap-8 mt-6">
          <div className="flex items-center justify-center gap-1">
            <GoDotFill size={15} className="text-g-blue-200"/>
          <span className="text-label-14 font-medium ">Remote</span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <GoDotFill size={15} className="text-[var(--primary-blue-400)]"/>
          <span className="text-label-14 font-medium text-[var(--text-light)]">Onsite</span>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default WorkingFormatChart;
