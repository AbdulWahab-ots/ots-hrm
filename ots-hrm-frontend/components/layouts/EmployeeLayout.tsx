"use client";
import React from "react";
import Sidebar from "../common/Sidebar";
import Topbar from "../common/Topbar";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
const EmployeeLayout = ({ children }: { children: React.ReactNode }) => {
  const { isSidebarCollapsed } = useSelector(
    (state: RootState) => state.global
  );
  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <Sidebar />
      <div className="w-full">
        <Topbar isEmployee={true} />
        <div
          style={{ minHeight: "calc(100vh - 80px)" }}
          className={`p-4 md:p-6 lg:p-8 mt-20 bg-g-background-200 neo-down transition-all duration-300 ${
            isSidebarCollapsed ? "ml-0 lg:ml-20" : "ml-0 lg:ml-72"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default EmployeeLayout;
