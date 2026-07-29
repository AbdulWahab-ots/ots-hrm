"use client";
import React from "react";

const AttendanceDuration: React.FC = () => {
  const days = [
    { name: "Monday", present: 90, total: 155, percentage: null },
    { name: "Tuesday", present: 80, total: 177, percentage: null },
    { name: "Wednesday", present: 112, total: 160, percentage: "40%" },
    { name: "Thursday", present: 168, total: 170, percentage: null },
    { name: "Friday", present: 130, total: 160, percentage: null },
  ];

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
                  {day.present}/{day.total}
                </span>
              </div>
            </div>

            <div className="flex-1">
              <div className="relative h-[20px] bg-g-gray-200 rounded-[var(--g-radius-sm)]">
                <div
                  className="absolute top-0 left-0 h-full bg-g-blue-700 rounded-[var(--g-radius-sm)]"
                  style={{
                    width: `${(day.present / day.total) * 100}%`,
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
