"use client";

import React from "react";
import Image from "next/image";
import Tblecell from "../../../public/Table cell (1).png";
import { CiFaceSmile } from "react-icons/ci";
import { IoIosCheckmarkCircleOutline } from "react-icons/io";
import { PiFootball } from "react-icons/pi";
import { LiaTimesCircle } from "react-icons/lia";
import { AiOutlineExclamationCircle } from "react-icons/ai";
import { FaRegCircle } from "react-icons/fa"; // Import FaRegCircle

type StatusType =
  | "hours"
  | "leave"
  | "absent"
  | "holiday"
  | "active"
  | "pending";

interface DayCell {
  date: number | null;
  status?: StatusType;
  value?: string;
  isCurrentMonth: boolean;
}

interface CalendarTableProps {
  month: string;
  year: number;
  weeks: DayCell[][];
  isLoading?: boolean;
  emptyText?: string;
}

const statusColors: Record<
  StatusType,
  { bg: string; text: string; border: string }
> = {
  hours: { bg: "var(--g-green-100)", text: "var(--g-green-800)", border: "var(--g-green-100)" }, // Present
  leave: { bg: "var(--g-blue-100)", text: "var(--g-blue-800)", border: "var(--g-blue-200)" }, // Leave
  absent: { bg: "var(--g-red-100)", text: "var(--g-red-800)", border: "var(--g-red-200)" }, // Absent
  holiday: { bg: "var(--g-gray-100)", text: "var(--g-gray-900)", border: "var(--g-gray-100)" }, // Holiday
  active: { bg: "var(--g-green-100)", text: "var(--g-green-800)", border: "var(--g-green-100)" }, // Active
  pending: { bg: "var(--g-amber-100)", text: "var(--g-amber-800)", border: "var(--g-amber-200)" }, // Pending
};

const statusIcons: Record<
  StatusType,
  React.ComponentType<{ className?: string }>
> = {
  hours: IoIosCheckmarkCircleOutline,
  holiday: CiFaceSmile,
  leave: PiFootball,
  absent: LiaTimesCircle,
  active: FaRegCircle, // Updated to use FaRegCircle for active status
  pending: AiOutlineExclamationCircle,
};

export default function CalendarTable({
  month,
  year,
  weeks,
  isLoading = false,
  emptyText = "No calendar data",
}: CalendarTableProps) {
  const SkeletonCell = ({ index }: { index: number }) => (
    <td
      className={`py-6 px-4 border-t border-b border-l border-r border-g-gray-alpha-400 h-[114px] ${
        index === 0 ? "border-l-0" : ""
      } ${index === 6 ? "border-r-0" : ""}`}
    >
      <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse mb-2" />
      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
    </td>
  );

  return (
    <div className="overflow-x-auto rounded-b-3xl">
      <div className="inline-block min-w-full align-middle">
        <table className="min-w-full border-collapse">
          {/* Header */}
          <thead className="bg-g-background-200 border-t border-g-gray-alpha-400">
            <tr>
              {[
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ].map((day, index) => (
                <th
                  key={day}
                  className="py-[15px] px-4 text-left text-sm font-medium text-gray-600 tracking-wide border-g-gray-alpha-400 border-b w-[14.28%]"
                  style={{ width: "14.28%" }}
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="bg-g-background-100">
            {isLoading ? (
              <tr>
                {Array.from({ length: 7 }).map((_, i) => (
                  <SkeletonCell key={i} index={i} />
                ))}
              </tr>
            ) : weeks.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="p-6 text-center text-sm text-gray-500 h-[114px] border-t border-b border-l border-r border-g-gray-alpha-400"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              weeks.map((week, wi) => (
                <tr key={wi}>
                  {week.map((day, di) => {
                    const statusConfig = day.status
                      ? statusColors[day.status]
                      : null;
                    const StatusIcon = day.status
                      ? statusIcons[day.status]
                      : null;

                    // Check if this day has no record
                    const hasNoRecord = day.isCurrentMonth && !day.status;

                    return (
                      <td
                        key={di}
                        className={`py-4 px-4 border-t border-b border-l border-r border-g-gray-alpha-400 align-top relative h-[114px] bg-g-background-100 hover:bg-gray-50 transition-colors ${
                          di === 0 ? "border-l-0" : ""
                        } ${di === 6 ? "border-r-0" : ""}`}
                        style={{ width: "14.28%" }}
                      >
                        {day.date && (
                          <div
                            className={`text-gray-700 font-medium mb-1 z-10 relative ${
                              !day.isCurrentMonth ? "text-gray-400" : ""
                            }`}
                          >
                            {day.date}
                          </div>
                        )}
                        {day.date && day.status && statusConfig ? (
                          <span
                            className="text-xs px-2 py-1 mt-6 rounded-md inline-flex items-center"
                            style={{
                              backgroundColor: statusConfig.bg,
                              color: statusConfig.text,
                              border: `1px solid ${statusConfig.border}`,
                              fontWeight: 500,
                              fontSize: "14px",
                              padding: "2px 8px",
                              borderRadius: "8px",
                            }}
                          >
                            {StatusIcon && (
                              <StatusIcon className="inline-block mr-1 text-lg" />
                            )}
                            {day.status === "active"
                              ? "Active" // Show "Active" for active status
                              : day.value ||
                                day.status.charAt(0).toUpperCase() +
                                  day.status.slice(1)}
                          </span>
                        ) : day.date && (!day.isCurrentMonth || hasNoRecord) ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Image
                              src={Tblecell}
                              alt="No record"
                              fill
                              className="z-0 object-cover opacity-50"
                            />
                          </div>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
