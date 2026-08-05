"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import Clock from "../../../public/Clock.svg";
import { TbExclamationCircle } from "react-icons/tb";
import { AppDispatch } from "@/store/store";
import { fetchAttendanceStatus } from "@/services/employeeService";

const formatTime = (dateStr: string, timeStr?: string) => {
  if (!timeStr) return "NA";
  return new Date(`${dateStr}T${timeStr}`).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDuration = (dateStr: string, checkInTime: string, checkOutTime?: string) => {
  const start = new Date(`${dateStr}T${checkInTime}`);
  const end = checkOutTime ? new Date(`${dateStr}T${checkOutTime}`) : new Date();
  const diffMinutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return `${hours}h ${minutes}m`;
};

const ClockStatusCard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [status, setStatus] = useState<{
    date: string;
    checkInTime?: string;
    checkOutTime?: string;
    isLate: boolean;
  } | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetchAttendanceStatus(dispatch);
        const data = response?.result;
        if (data) {
          setStatus({
            date: data.date,
            checkInTime: data.checkInTime,
            checkOutTime: data.checkOutTime,
            isLate: data.status === "LATE" || (data.lateMinutes ?? 0) > 0,
          });
        }
      } catch (error) {
        console.error("Failed to fetch today's clock status:", error);
      }
    };
    fetchStatus();
  }, [dispatch]);

  const totalHours =
    status?.checkInTime
      ? formatDuration(status.date, status.checkInTime, status.checkOutTime)
      : "0h 0m";

  return (
    <div className="lg:col-span-2 bg-g-background-100 rounded-[var(--g-radius-md)] shadow-geist-card overflow-hidden p-4 lg:p-6 border-[1px] border-(--genrel-light-stroke)">
      <div className="flex items-center gap-2">
        <h2 className="text-(--genrel-text-light) text-heading-16">
          Today's Status
        </h2>
        {status?.isLate && (
          <span className="inline-flex items-center gap-1 px-2.5 border-[1px] border-g-amber-200 py-1 rounded-full text-label-13 font-medium bg-g-amber-100 text-g-amber-800">
            <TbExclamationCircle /> Late
          </span>
        )}
      </div>
      <div className="flex justify-center my-6">
        <Image src={Clock} alt="clock image" />
      </div>
      <div className="flex justify-between gap-4">
        <div>
          <p className="lg:text-[30px] text-3xl font-semibold text-(--primary-dark-gray)">
            {status?.checkInTime ? formatTime(status.date, status.checkInTime) : "NA"}
          </p>
          <p className="text-(--genrel-text-light) text-label-14">
            Clocked In
          </p>
        </div>
        <div>
          <p className="lg:text-[30px] text-3xl font-semibold text-(--primary-dark-gray)">
            {status?.checkOutTime ? formatTime(status.date, status.checkOutTime) : "NA"}
          </p>
          <p className="text-(--genrel-text-light) text-label-14">
            Check Out
          </p>
        </div>
        <div>
          <p className="lg:text-[30px] text-3xl font-semibold text-(--primary-dark-gray)">
            {totalHours}
          </p>
          <p className="text-(--genrel-text-light) text-label-14">
            Total Hours
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClockStatusCard;
