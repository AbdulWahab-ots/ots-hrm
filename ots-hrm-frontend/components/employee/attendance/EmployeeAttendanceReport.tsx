"use client";

import React, { useMemo, useState } from "react";
import Button from "@/components/common/Button";
import CustomDropdown from "@/components/common/form/DropDown";
import CalendarTable from "./Calendar";
import {
  MdOutlineArrowBackIos,
  MdOutlineArrowForwardIos,
} from "react-icons/md";

export interface EmployeeRecord {
  id: string;
  selected?: boolean;
  employeeName: string;
  type: "Check In" | "Check Out" | "Both";
  checkIn: string | null;
  checkOut: string | null;
  status: "Present" | "Holiday" | "Leave" | "Absent" | "Pending";
  date: string;
  reason: string | null;
  presentStatus?: string | null;
  lockWorkingHours?: number | null;
}

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

interface EmployeeAttendanceReportProps {
  localData: EmployeeRecord[];
  currentMonth: number;
  currentYear: number;
  setCurrentMonth: React.Dispatch<React.SetStateAction<number>>;
  setCurrentYear: React.Dispatch<React.SetStateAction<number>>;
  canNavigateNext: () => boolean;
}

const EmployeeAttendanceReport = ({
  localData,
  currentMonth,
  currentYear,
  setCurrentMonth,
  setCurrentYear,
  canNavigateNext,
}: EmployeeAttendanceReportProps) => {
  const [selectedStatus, setSelectedStatus] = useState("");

  const monthName = new Date(currentYear, currentMonth, 1).toLocaleString(
    "default",
    { month: "long" }
  );

  const statusOptions = useMemo(
    () => [
      { value: "", label: "All" },
      { value: "Present", label: "Present" },
      { value: "Holiday", label: "Holiday" },
      { value: "Leave", label: "Leave" },
      { value: "Absent", label: "Absent" },
      { value: "Pending", label: "Pending" },
    ],
    []
  );

  const handlePrevMonth = () => {
    let newMonth = currentMonth - 1;
    let newYear = currentYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const handleNextMonth = () => {
    if (!canNavigateNext()) return;
    let newMonth = currentMonth + 1;
    let newYear = currentYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const calculateHours = (
    checkIn: string | null,
    checkOut: string | null
  ): string => {
    if (checkIn && checkOut) {
      const parseTime = (t: string): number => {
        const [time, ampm] = t.split(" ");
        let [h, m] = time.split(":").map(Number);
        if (ampm === "PM" && h !== 12) h += 12;
        if (ampm === "AM" && h === 12) h = 0;
        return h * 60 + m;
      };

      const minIn = parseTime(checkIn);
      const minOut = parseTime(checkOut);
      const diff = minOut - minIn;
      if (diff <= 0) return "0 Hours";
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      if (mins === 0) return `${hours} Hours`;
      return `${hours}h ${mins}m`;
    }
    return "0 Hours";
  };

  const getCalendarWeeks = (year: number, month: number): DayCell[][] => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const weeks: DayCell[][] = [];
    let currentWeek: DayCell[] = [];
    const weekday = firstDay.getDay();
    const firstWeekday = (weekday + 6) % 7;

    const prevMonthLastDay = new Date(year, month, 0);
    const prevMonthDays = prevMonthLastDay.getDate();
    // Fill the leading cells with the trailing days of the previous month in
    // ascending order (push), so they read e.g. 29, 30, 31 left-to-right.
    for (let i = firstWeekday; i > 0; i--) {
      currentWeek.push({
        date: prevMonthDays - i + 1,
        isCurrentMonth: false,
      });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      currentWeek.push({ date: d, isCurrentMonth: true });
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      let nextDate = 1;
      while (currentWeek.length < 7) {
        currentWeek.push({
          date: nextDate++,
          isCurrentMonth: false,
        });
      }
      weeks.push(currentWeek);
    }

    return weeks;
  };

  const weeks: DayCell[][] = useMemo(() => {
    const calendarWeeks = getCalendarWeeks(currentYear, currentMonth);

    const recordMap: { [key: string]: EmployeeRecord } = {};
    (localData || []).forEach((record) => {
      recordMap[record.date] = record;
    });

    return calendarWeeks.map((week) =>
      week.map((day) => {
        if (day.date) {
          let dateStr: string;
          let record: EmployeeRecord | undefined;
          if (day.isCurrentMonth) {
            dateStr = `${currentYear}-${(currentMonth + 1)
              .toString()
              .padStart(2, "0")}-${day.date.toString().padStart(2, "0")}`;
            record = recordMap[dateStr];
          } else if (day.date > 15) {
            const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            dateStr = `${prevYear}-${(prevMonth + 1)
              .toString()
              .padStart(2, "0")}-${day.date.toString().padStart(2, "0")}`;
            record = recordMap[dateStr];
          } else {
            const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
            const nextYear =
              currentMonth === 11 ? currentYear + 1 : currentYear;
            dateStr = `${nextYear}-${(nextMonth + 1)
              .toString()
              .padStart(2, "0")}-${day.date.toString().padStart(2, "0")}`;
            record = recordMap[dateStr];
          }

          if (record) {
            let newDay = { ...day };
            const isToday = dateStr === new Date().toISOString().split("T")[0];
            if (record.status === "Absent") {
              newDay.status = "absent";
            } else if (record.status === "Pending") {
              newDay.status = "pending";
            } else if (record.status === "Present") {
              if (
                isToday &&
                record.presentStatus === "CHECK_IN" &&
                record.lockWorkingHours === null
              ) {
                newDay.status = "active";
                newDay.value = "0 Hours"; // Set to 0 Hours for active status
              } else {
                newDay.status = "hours";
                if (record.lockWorkingHours !== null) {
                  const hours = record.lockWorkingHours;
                  newDay.value = `${hours} Hours`;
                } else {
                  newDay.value = "0 Hours";
                }
              }
            } else if (
              record.status === "Holiday" ||
              record.status === "Leave"
            ) {
              newDay.status = record.status.toLowerCase() as StatusType;
            }
            return newDay;
          }
        }
        return day;
      })
    );
  }, [localData, currentYear, currentMonth]);

  return (
    <div className="border-[1px] bg-g-background-100 pt-6 border-g-gray-alpha-400 rounded-[var(--g-radius-lg)] shadow-geist-card mx-auto">
      <div className="flex justify-between items-center px-6 mb-6">
        <div className="flex items-center gap-6">
          <h3 className="text-heading-16 text-nowrap text-g-gray-1000">
            {monthName}
          </h3>
          <div className="flex gap-3">
            <Button
              variant="outline"
              icon={MdOutlineArrowBackIos}
              onClick={handlePrevMonth}
            />
            <Button
              variant="outline"
              onClick={handleNextMonth}
              icon={MdOutlineArrowForwardIos}
              disabled={!canNavigateNext()}
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* <CustomDropdown
            id="status-filter"
            name="status"
            options={statusOptions}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            placeholder="Status"
          /> */}
        </div>
      </div>
      <CalendarTable month={monthName} year={currentYear} weeks={weeks} />
    </div>
  );
};

export default EmployeeAttendanceReport;
