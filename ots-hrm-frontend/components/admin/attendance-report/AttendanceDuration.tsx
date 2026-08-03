"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { fetchAttendanceRecordsForRange } from "@/services/adminServices";
import { AppDispatch } from "@/store/store";

type DayStat = { name: string; present: number; total: number };

const WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Monday..Friday of the current (local) week, as local-date strings.
const getCurrentWeekdays = (): { name: string; date: string }[] => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun..6=Sat
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);

  return WEEKDAY_NAMES.map((name, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    return { name, date: formatLocalDate(d) };
  });
};

const AttendanceDuration: React.FC = () => {
  const [days, setDays] = useState<DayStat[]>(
    WEEKDAY_NAMES.map((name) => ({ name, present: 0, total: 0 }))
  );
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch<AppDispatch>();

  const loadWeek = useCallback(async () => {
    setIsLoading(true);
    try {
      const weekdays = getCurrentWeekdays();
      const response = await fetchAttendanceRecordsForRange(
        dispatch,
        weekdays[0].date,
        weekdays[weekdays.length - 1].date
      );
      const records: any[] = response?.result?.data || [];

      const byDate = new Map<string, { present: number; total: number }>();
      for (const record of records) {
        // A scheduled day off or company holiday isn't a working day at all, so it
        // shouldn't count toward either side of the present/total ratio — including
        // it in the denominator would understate attendance for a day nobody was
        // expected to show up.
        if (record.status === "DAY_OFF" || record.status === "HOLIDAY") continue;

        const dateKey = String(record.date).slice(0, 10);
        const bucket = byDate.get(dateKey) || { present: 0, total: 0 };
        bucket.total += 1;
        if (record.status === "PRESENT" || record.status === "LATE") {
          bucket.present += 1;
        }
        byDate.set(dateKey, bucket);
      }

      setDays(
        weekdays.map(({ name, date }) => {
          const bucket = byDate.get(date) || { present: 0, total: 0 };
          return { name, present: bucket.present, total: bucket.total };
        })
      );
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    loadWeek();
  }, [loadWeek]);

  return (
    <div className="lg:col-span-2 bg-g-background-100 rounded-[var(--g-radius-md)] shadow-geist-card overflow-hidden p-4 lg:p-6 border-[1px] border-(--genrel-light-stroke)">
      <h2 className="text-(--genrel-text-light) text-heading-16">
        Weekly Attendance
      </h2>

      <div className="space-y-4">
        {days.map((day, index) => (
          <div key={index} className="">
            <div className="flex justify-between pt-2 pb-4">
              <span className=" text-(--genrel-text-light) text-label-12 font-semibold">
                {day.name}
              </span>

              <div className="flex items-center ">
                <span className="text-(--genrel-text-light) text-label-14 font-semibold">
                  {isLoading ? "—" : `${day.present}/${day.total}`}
                </span>
              </div>
            </div>

            <div className="flex-1">
              <div className="relative h-[20px] bg-g-gray-200 rounded-[var(--g-radius-sm)]">
                <div
                  className="absolute top-0 left-0 h-full bg-g-blue-700 rounded-[var(--g-radius-sm)]"
                  style={{
                    width:
                      day.total > 0
                        ? `${(day.present / day.total) * 100}%`
                        : "0%",
                    maxWidth: "100%",
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttendanceDuration;
