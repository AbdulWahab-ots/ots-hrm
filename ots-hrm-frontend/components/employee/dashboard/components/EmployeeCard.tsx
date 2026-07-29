"use client";

import React, { useEffect, useRef } from "react";
import { FaFingerprint } from "react-icons/fa";
import Button from "@/components/common/Button";
import {
  checkIn,
  checkOut,
  fetchAttendanceStatus,
} from "@/services/employeeService";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { ProfileResponse } from "@/utils/types";
import EmployeeIcon from "../../../../public/Employee-icon.svg";
import Image from "next/image";
import { DragToClock } from "@/components/common/DragToClock";

interface EmployeeCardProps {
  profileData: ProfileResponse | null; // Accept profileData directly
  isPunchedIn: boolean;
  punchInTime: Date | null;
  punchOutTime: Date | null;
  className?: string;
  dashboardType?: "dashboard" | "attendance";
  setIsPunchedIn: React.Dispatch<React.SetStateAction<boolean>>;
  setPunchInTime: React.Dispatch<React.SetStateAction<Date | null>>;
  setPunchOutTime: React.Dispatch<React.SetStateAction<Date | null>>;
  onPunchUpdate?: () => void;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({
  profileData,
  isPunchedIn,
  punchInTime,
  punchOutTime,
  setIsPunchedIn,
  setPunchInTime,
  setPunchOutTime,
  className,
  dashboardType,
  onPunchUpdate,
}) => {
  const [employeeStatus, setEmployeeStatus] = React.useState<any>(null);
  const dispatch = useDispatch<AppDispatch>();
  const isFetchedStats = useRef(false);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const getOrdinalSuffix = (day: number) => {
    if (day >= 11 && day <= 13) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  const formatDate = () => {
    const now = new Date();
    const dayName = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
    }).format(now);
    const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(
      now
    );
    const dayOfMonth = now.getDate();
    const suffix = getOrdinalSuffix(dayOfMonth);
    return `Today is ${dayName}, ${month} ${dayOfMonth}${suffix}`;
  };

  useEffect(() => {
    if (!isFetchedStats.current) {
      fetchAttendanceStatus(dispatch).then((response) => {
        const data = response.result;
        setEmployeeStatus(data);
        isFetchedStats.current = true;
      });
    }
  }, [dispatch]);

  // Employee ID is admin-only information — employees should not see their own
  // employee code, so only surface the badge for admin / super admin viewers.
  const viewerRole = useSelector(
    (state: RootState) => state.auth?.user?.role?.code
  );
  const canSeeEmployeeId =
    viewerRole === "admin" || viewerRole === "superAdmin";

  // Extract profile data safely
  const id = profileData?.result?.employee?.employeeCode || "000";
  const imageUrl = profileData?.result?.pictureUrl || EmployeeIcon;
  const firstName = profileData?.result?.firstName || "Guest";
  const lastName = profileData?.result?.lastName || "";

  // Show loading state if profileData or employeeStatus is not available
  if (!profileData?.result || !employeeStatus) {
    return (
      <div
        className={`${className} grid grid-cols-7 rounded-[var(--g-radius-md)] border-g-gray-alpha-400 items-center border-[1px] bg-g-background-100 shadow-geist-card animate-pulse`}
      >
        <div className="relative col-span-3">
          <div className="rounded-3xl w-[331px] h-[336px] bg-gray-200"></div>
          <span className="absolute top-5 left-2 rounded-full bg-gray-300 px-3 py-1 w-16 h-6"></span>
        </div>
        <div className="flex w-full col-span-4 p-6 flex-col gap-8">
          <div>
            <div className="h-9 w-48 bg-gray-200 rounded"></div>
            <div className="mt-2 h-4 w-32 bg-gray-200 rounded"></div>
          </div>
          <div className="flex gap-6">
            <div>
              <div className="h-4 w-16 bg-gray-200 rounded"></div>
              <div className="mt-2 h-6 w-20 bg-gray-200 rounded"></div>
            </div>
            <div>
              <div className="h-4 w-16 bg-gray-200 rounded"></div>
              <div className="mt-2 h-6 w-20 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded-md"></div>
        </div>
      </div>
    );
  }

  const getLocalDateISO = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`; // Local calendar date, not UTC-based
  };

  const handleClick = async () => {
    const now = new Date();
    const currentDate = getLocalDateISO();
    const currentTime = now.toTimeString().split(" ")[0];

    if (isPunchedIn) {
      const response = await checkOut(dispatch, {
        date: currentDate,
        checkOutTime: currentTime,
      });

      if (response?.success) {
        setIsPunchedIn(false);
        setPunchOutTime(now);
        const updatedStatus = await fetchAttendanceStatus(dispatch);
        setEmployeeStatus(updatedStatus.result);
        onPunchUpdate?.();
      }
    } else {
      const response = await checkIn(dispatch, {
        date: currentDate,
        checkInTime: currentTime,
      });

      if (response?.success) {
        setIsPunchedIn(true);
        setPunchInTime(now);
        setPunchOutTime(null);
        onPunchUpdate?.();
      }
    }
  };

  return (
    <div
      className={`${className} grid grid-cols-1 sm:grid-cols-7 rounded-[var(--g-radius-md)] border-g-gray-alpha-400 items-center border-[1px] bg-g-background-100 shadow-geist-card`}
    >
      <div className="relative sm:col-span-3 h-[343px]">
        <Image
          src={imageUrl}
          alt="Profile"
          width={376}
          height={346}
          className="rounded-[var(--g-radius-md)] w-full h-full object-cover"
        />
        {canSeeEmployeeId && (
          <span className="absolute top-5 left-2 rounded-full bg-g-gray-200 px-3 py-1 text-sm font-medium shadow-geist-card">
            {id}
          </span>
        )}
      </div>
      <div className="flex w-full sm:col-span-4 p-5 flex-col gap-8">
        <div>
          <h2 className="text-[36px] font-semibold text-g-gray-1000">
            Hi! {firstName} <br /> {lastName} 👋
          </h2>
          <p className="text-g-gray-800 font-medium text-sm">{formatDate()}</p>
        </div>
        <div className="">
          {/* <div>
            <p className="text-[#7782AE] font-medium text-base">Punch In</p>
            <h1 className="text-[#1C202F] text-[20px] font-medium mt-2">
              {punchInTime ? formatTime(punchInTime) : "--.--"}
            </h1>
          </div>
          <div>
            <p className="text-[#7782AE] font-medium text-base">Punch Out</p>
            <h1 className="text-[#1C202F] text-[20px] font-medium mt-2">
              {punchOutTime ? formatTime(punchOutTime) : "--.--"}
            </h1>
          </div> */}
          {dashboardType === "dashboard" && (
            <div className="flex gap-6">
              <div>
                <h3 className="text-g-gray-900 text-label-14 font-medium">Department</h3>
                <p className="text-g-gray-1000 text-[18px] font-semibold">
                  {profileData.result.employee.department.name}
                </p>
              </div>
              <div>
                <h3 className="text-g-gray-900 text-label-14 font-medium">Shift</h3>
                <p className="text-g-gray-1000 text-[18px] font-semibold">
                  {profileData.result.employee.shift.name}
                </p>
              </div>{" "}
              <div>
                <h3 className="text-g-gray-900 text-label-14 font-medium">Designation</h3>
                <p className="text-g-gray-1000 text-[18px] font-semibold">
                  {profileData.result?.employee?.designation?.title}
                </p>
              </div>
            </div>
          )}
        </div>
        {/* <Button
          label={
            employeeStatus?.checkOutTime || punchOutTime
              ? "You have Checked Out"
              : isPunchedIn
                ? "Punch Out"
                : "Punch In"
          }
          icon={FaFingerprint}
          variant="filled"
          disabled={!!(employeeStatus?.checkOutTime || punchOutTime)}
          className={`${employeeStatus?.checkOutTime || punchOutTime
            ? "bg-gray-400 cursor-not-allowed text-gray-600 pointer-events-none"
            : isPunchedIn
              ? "bg-red-500 border-red-500 hover:border-red-600 hover:bg-red-600"
              : ""
            }`}
          onClick={
            employeeStatus?.checkOutTime || punchOutTime
              ? undefined
              : handleClick
          }
        /> */}
        {dashboardType === "attendance" && (
          <div className="flex gap-6">
            <div>
              <p className="text-g-gray-800 font-medium text-copy-16">Punch In</p>
              <h1 className="text-g-gray-1000 text-[20px] font-medium mt-2">
                {punchInTime ? formatTime(punchInTime) : "--.--"}
              </h1>
            </div>
            <div>
              <p className="text-g-gray-800 font-medium text-copy-16">Punch Out</p>
              <h1 className="text-g-gray-1000 text-[20px] font-medium mt-2">
                {punchOutTime ? formatTime(punchOutTime) : "--.--"}
              </h1>
            </div>
          </div>
        )}
        <DragToClock
          onClockIn={async () => await handleClick()}
          onClockOut={async () => await handleClick()}
          isPunchedIn={isPunchedIn}
          isDisabled={!!(employeeStatus?.checkOutTime || punchOutTime)}
        />
      </div>
    </div>
  );
};

export default EmployeeCard;
