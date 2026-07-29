import React from "react";
import DepartmentClassification from "./DepartmentClassification";
import DepartmentClassificationChart from "./DepartmentClassification";
import DepartmentTable from "./DepartmentTable";
import { StatsCard } from "@/components/superAdmin/components/Overviews/StatsCard";

const Departments = () => {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-6 pb-6 lg:gap-6 gap-4">
        <DepartmentClassificationChart />
        <div className="flex flex-col lg:col-span-2 gap-4 lg:gap-8">
          <StatsCard title="Total Departments" value={12} change={"+9.01%"} />
          <StatsCard
            title="Average Working days"
            value={44}
            change={"+9.01%"}
          />
        </div>
      </div>
      <DepartmentTable />
    </>
  );
};

export default Departments;
