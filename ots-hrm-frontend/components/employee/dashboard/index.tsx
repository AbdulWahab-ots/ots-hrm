"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { fetchAttendanceStatus } from "@/services/employeeService";
import EmployeeCard from "./components/EmployeeCard";

import AttendanceOverview from "./components/AttendanceOverview";
import UpcomingAlerts from "./components/UpcomingAlerts";
import WorkingFormatCard from "./components/WorkingFormat";
import TimeTrackingCard from "./components/TimeTracker";
import Calendar from "./components/Calendar";
import { ProfileResponse } from "@/utils/types";
import WorkingFormatChart from "@/components/common/WorkingFormat";

const EmployeeDashboard = () => {
  const [isPunchedIn, setIsPunchedIn] = useState<boolean>(false);
  const [punchInTime, setPunchInTime] = useState<Date | null>(null);
  const [punchOutTime, setPunchOutTime] = useState<Date | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const isFetchedStatus = useRef(false);
  const { profileData } = useSelector((state: RootState) => state.global) as {
    profileData: ProfileResponse | null;
  };
  const onSite = 26;
  const remote = 74;

  useEffect(() => {
    if (!isFetchedStatus.current) {
      fetchAttendanceStatus(dispatch).then((response) => {
        const data = response?.result;
        if (data) {
          if (data.checkInTime && !data.checkOutTime) {
            const checkInDateTime = new Date(
              `${data.date}T${data.checkInTime}`
            );
            setIsPunchedIn(true);
            setPunchInTime(checkInDateTime);
          } else if (data.checkInTime && data.checkOutTime) {
            const checkInDateTime = new Date(
              `${data.date}T${data.checkInTime}`
            );
            const checkOutDateTime = new Date(
              `${data.date}T${data.checkOutTime}`
            );
            setIsPunchedIn(false);
            setPunchInTime(checkInDateTime);
            setPunchOutTime(checkOutDateTime);
          }
        }
        isFetchedStatus.current = true;
      });
    }
  }, [dispatch]);

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <EmployeeCard
          profileData={profileData} // Pass profileData directly to handle loading state
          isPunchedIn={isPunchedIn}
          punchInTime={punchInTime}
          punchOutTime={punchOutTime}
          setIsPunchedIn={setIsPunchedIn}
          setPunchInTime={setPunchInTime}
          setPunchOutTime={setPunchOutTime}
          className="xl:col-span-3"
          dashboardType="dashboard"
        />
        <TimeTrackingCard
          isPunchedIn={isPunchedIn}
          punchInTime={punchInTime}
          punchOutTime={punchOutTime}
        />
      </div>
      <div className="grid mt-6 lg:grid-cols-7 gap-6">
        <AttendanceOverview />
        <UpcomingAlerts />
      </div>
      <div className="mt-6 grid xl:grid-cols-8 gap-6">
        <WorkingFormatChart role="employee" />
        <Calendar />
      </div>
    </>
  );
};

export default EmployeeDashboard;
