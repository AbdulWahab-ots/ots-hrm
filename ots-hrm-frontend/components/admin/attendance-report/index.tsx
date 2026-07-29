"use client";
import React, { useState } from "react";
import ClockStatusCard from "./ClockStatusCard";
import AttendanceChart from "./AttendanceChart";
import AttendanceDuration from "./AttendanceDuration";
import AttendanceTable from "./AttendanceTable";
import DepartmentAttendence from "./DepartmentAttendence";
import AttendanceOverview from "@/components/employee/dashboard/components/AttendanceOverview";

const AttendanceManagement = () => {
  const [viewMode, setViewMode] = useState("reports"); // default view

  return (
    <div>
      <h1 className="lg:text-[30px] text-3xl text-(--primary-gray-900) font-semibold">
        Attendance Management
      </h1>
      <p className="text-g-gray-800 text-base font-medium">
        Monitor and manage employee attendance
      </p>
      <div className="grid lg:grid-cols-6 mt-6 lg:gap-6 gap-4 mb-[27px]">
        {/* <ClockStatusCard /> */}
        {/* <AttendanceChart /> */}
        <AttendanceOverview />
        <AttendanceDuration />
      </div>

      {/* Toggle buttons */}
      {/* <h2 className="flex gap-4 font-semibold my-6">
        <button
          onClick={() => setViewMode("reports")}
          className={`px-3 py-3 text-base rounded-[16px] ${viewMode === "reports"
            ? "bg-[#FFFFFF] text-[#1C202F] border-[1px] border-[#597BE84D]"
            : "text-(--general-extra-light)"
            }`}
        >
          Reports
        </button>
        <button
          onClick={() => setViewMode("overviews")}
          className={`px-3 py-3 text-base rounded-[16px] ${viewMode === "overviews"
            ? "bg-[#FFFFFF] text-[#1C202F] border-[1px] border-[#597BE84D]"
            : "text-(--general-extra-light)"
            }`}
        >
          Overviews
        </button>
      </h2> */}

      {/* Conditional rendering */}
      {viewMode === "reports" && <AttendanceTable />}
      {viewMode === "overviews" && (
        <div className="grid grid-cols-1 lg:grid-cols-7 lg:gap-6 gap-4">
          <DepartmentAttendence />
          <AttendanceDuration />
        </div>
      )}
    </div>
  );
};

export default AttendanceManagement;
