"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FaFingerprint } from "react-icons/fa";
import Button from "@/components/common/Button";
import {
  checkIn,
  checkOut,
  fetchAttendanceStatus,
} from "@/services/employeeService";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { ProfileResponse } from "@/utils/types";
import EmployeeIcon from "../../../public/Employee-icon.svg";
import { nowBusiness } from "@/utils/timezone";
interface EmployeeCardProps {
  profileData: ProfileResponse | null;
  onPunchUpdate?: () => void;
  className?: string;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({
  profileData,
  onPunchUpdate,
  className,
}) => {
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [punchInTime, setPunchInTime] = useState<Date | null>(null);
  const [punchOutTime, setPunchOutTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>("00:00:00");
  const [workingHours, setWorkingHours] = useState<string>("00:00:00");
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(
    null
  );
  const [employeeStatus, setEmployeeStatus] = useState<any>(null);
  const dispatch = useDispatch<AppDispatch>();
  const isFetchedStats = useRef(false);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const calculateTimeDifference = (
    startTime: Date,
    endTime: Date = nowBusiness()
  ) => {
    const diff = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  };

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
    const now = nowBusiness();
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

  // Extract profile data safely
  const id = profileData?.result?.employee?.employeeCode || "000";
  const firstName = profileData?.result?.firstName || "Guest";
  const imageUrl = profileData?.result?.pictureUrl || EmployeeIcon;

  useEffect(() => {
    if (!isFetchedStats.current) {
      fetchAttendanceStatus(dispatch).then((response) => {
        const data = response.result;
        setEmployeeStatus(data);

        if (data?.checkInTime && !data?.checkOutTime) {
          const checkInDateTime = new Date(`${data.date}T${data.checkInTime}`);
          setIsPunchedIn(true);
          setPunchInTime(checkInDateTime);
          setWorkingHours(calculateTimeDifference(checkInDateTime));
        } else if (data?.checkInTime && data?.checkOutTime) {
          const checkInDateTime = new Date(`${data.date}T${data.checkInTime}`);
          const checkOutDateTime = new Date(
            `${data.date}T${data.checkOutTime}`
          );
          setIsPunchedIn(false);
          setPunchInTime(checkInDateTime);
          setPunchOutTime(checkOutDateTime);
          setWorkingHours(
            calculateTimeDifference(checkInDateTime, checkOutDateTime)
          );
        } else {
          setWorkingHours("00:00:00");
        }

        isFetchedStats.current = true;
      });
    }
  }, [dispatch]);

  useEffect(() => {
    if (isPunchedIn && punchInTime) {
      const interval = setInterval(() => {
        const now = nowBusiness();
        const timeDiff = calculateTimeDifference(punchInTime, now);

        setElapsedTime(timeDiff);
        setWorkingHours(timeDiff);
      }, 1000);

      setTimerInterval(interval);

      return () => clearInterval(interval);
    } else {
      if (timerInterval) clearInterval(timerInterval);
    }
  }, [isPunchedIn, punchInTime]);

  const handleClick = async () => {
    const now = nowBusiness();
    const today = nowBusiness();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const currentDate = `${year}-${month}-${day}`;
    const currentTime = now.toTimeString().split(" ")[0];

    if (isPunchedIn) {
      const response = await checkOut(dispatch, {
        date: currentDate,
        checkOutTime: currentTime,
      });

      if (response?.success) {
        setIsPunchedIn(false);
        setPunchOutTime(now);
        if (timerInterval) clearInterval(timerInterval);

        if (punchInTime) {
          const finalWorkingHours = calculateTimeDifference(punchInTime, now);
          setWorkingHours(finalWorkingHours);
        }

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
        setWorkingHours("00:00:00");
        onPunchUpdate?.();
      }
    }
  };

  // Show loading state if profileData or employeeStatus is not available
  if (!profileData?.result || !employeeStatus) {
    return (
      <div
        className={`${className} grid sm:grid-cols-7 rounded-[var(--g-radius-lg)] border-g-gray-alpha-400 items-center border-[1px] bg-g-background-100 shadow-geist-card animate-pulse`}
      >
        <div className="relative col-span-3">
          <div className="rounded-[var(--g-radius-lg)] w-[331px] h-[336px] bg-gray-200"></div>
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

  return (
    <div
      className={`${className} grid grid-cols-1 sm:grid-cols-7 rounded-[var(--g-radius-lg)] border-g-gray-alpha-400 items-center border-[1px] bg-g-background-100 shadow-geist-card`}
    >
      <div className="relative sm:col-span-3 max-w-[340px] w-full max-h-[376px] h-full">
        <Image
          src={imageUrl}
          alt="Profile"
          width={331}
          height={336}
          className="rounded-[var(--g-radius-lg)] w-full h-full object-cover"
        />
        <span className="absolute top-5 left-2 rounded-full bg-g-gray-200 px-3 py-1 text-label-14 shadow-geist-menu">
          {id}
        </span>
      </div>
      <div className="flex w-full col-span-4 p-6 flex-col gap-8">
        <div>
          <h2 className="text-heading-24 text-g-gray-1000">
            Welcome back, {firstName}!
          </h2>
          <p className="text-g-gray-800 text-copy-14">{formatDate()}</p>
        </div>
        <div className="flex gap-6">
          <div>
            <p className="text-g-gray-800 text-copy-16">Punch In</p>
            <h1 className="text-g-gray-1000 text-heading-20 mt-2">
              {punchInTime ? formatTime(punchInTime) : "--.--"}
            </h1>
          </div>
          <div>
            <p className="text-g-gray-800 text-copy-16">Punch Out</p>
            <h1 className="text-g-gray-1000 text-heading-20 mt-2">
              {punchOutTime ? formatTime(punchOutTime) : "--.--"}
            </h1>
          </div>
        </div>
        <Button
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
                ? "bg-red-500 border-red-500 hover:bg-red-600 hover:border-red-600"
                : ""
            }`}
          onClick={
            employeeStatus?.checkOutTime || punchOutTime
              ? undefined
              : handleClick
          }
        />
      </div>
    </div>
  );
};

export default EmployeeCard;
