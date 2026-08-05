"use client";

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import DepartmentClassificationChart from "./DepartmentClassification";
import DepartmentTable from "./DepartmentTable";
import { StatsCard } from "@/components/superAdmin/components/Overviews/StatsCard";
import { AppDispatch } from "@/store/store";
import { getAllDepartmentAPI } from "@/services/adminServices";
import { Department, GetDepartmentsPayload } from "@/utils/types";

const Departments = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    const fetchAllDepartments = async () => {
      const payload: GetDepartmentsPayload = {
        pagedListRequest: { pageNo: 1, pageSize: 1000, getAllRecords: true },
        queryOptionsRequest: {
          filtersRequest: [],
          sortRequest: [],
          includes: ["workingDays"],
        },
      };
      try {
        const response = await getAllDepartmentAPI(dispatch, payload);
        if (response?.result) {
          setDepartments(response.result.data);
        }
      } catch (error) {
        console.error("Failed to fetch departments:", error);
      }
    };
    fetchAllDepartments();
  }, [dispatch]);

  const totalDepartments = departments.length;
  const averageWorkingDays =
    departments.length > 0
      ? Math.round(
          (departments.reduce(
            (sum, department) =>
              sum +
              (department.workingDays?.filter((wd) => wd.isWorkingDay)
                .length || 0),
            0
          ) /
            departments.length) *
            10
        ) / 10
      : 0;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-6 pb-6 lg:gap-6 gap-4">
        <DepartmentClassificationChart departments={departments} />
        <div className="flex flex-col lg:col-span-2 gap-4 lg:gap-8">
          <StatsCard title="Total Departments" value={totalDepartments} />
          <StatsCard
            title="Average Working days"
            value={averageWorkingDays}
          />
        </div>
      </div>
      <DepartmentTable />
    </>
  );
};

export default Departments;
