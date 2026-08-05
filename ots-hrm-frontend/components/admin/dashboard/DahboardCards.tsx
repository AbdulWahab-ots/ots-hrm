"use client";

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import employee from "../../../public/employee.svg";
import errowIcon from "../../../public/errowIcon.svg";
import leave from "../../../public/leave.svg";
import absent from "../../../public/absent.svg";
import Image from "next/image";
import { StaticImageData } from "next/image";
import { CircleAlert } from "lucide-react";
import { AppDispatch } from "@/store/store";
import {
  fetchAttendanceStatsForRange,
  fetchEmployeeStats,
} from "@/services/adminServices";
import { todayBusinessISO } from "@/utils/timezone";

interface CardData {
  name: string;
  tooltip: string;
  icon: StaticImageData;
  value: number;
}

const DashboardCards: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [counts, setCounts] = useState({
    totalPresent: 0,
    totalOnLeave: 0,
    totalAbsent: 0,
    totalEmployees: 0,
  });

  useEffect(() => {
    const fetchCounts = async () => {
      const today = todayBusinessISO();
      try {
        const [attendanceStats, employeeStats] = await Promise.all([
          fetchAttendanceStatsForRange(dispatch, today, today),
          fetchEmployeeStats(dispatch),
        ]);

        setCounts({
          totalPresent: attendanceStats?.result?.totalPresent ?? 0,
          totalOnLeave: attendanceStats?.result?.totalOnLeave ?? 0,
          totalAbsent: attendanceStats?.result?.totalAbsent ?? 0,
          totalEmployees: employeeStats?.result?.totalEmployees ?? 0,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard summary counts:", error);
      }
    };
    fetchCounts();
  }, [dispatch]);

  const data: CardData[] = [
    {
      name: "Total Present",
      tooltip: "Total employees present today",
      icon: errowIcon,
      value: counts.totalPresent,
    },
    {
      name: "Total Leave",
      tooltip: "Employees currently on leave",
      icon: leave,
      value: counts.totalOnLeave,
    },
    {
      name: "Total Absent",
      tooltip: "Employees absent today",
      icon: absent,
      value: counts.totalAbsent,
    },
    {
      name: "Total Employee",
      tooltip: "Total employees in the company",
      icon: employee,
      value: counts.totalEmployees,
    },
  ];

  return (
    <div className="lg:col-span-3 grid sm:grid-cols-2  gap-4 ">
      {data.map((card, index) => (
        <div
          key={index}
          className={`rounded-[var(--g-radius-md)]  border-[1px] border-transparent p-4  xl:p-6 text-white flex justify-between shadow-geist-card ${card.name === "Total Present"
            ? "bg-g-blue-700"
            : card.name === "Total Leave"
              ? "bg-g-amber-700"
              : card.name === "Total Absent"
                ? "bg-g-red-700"
                : "bg-g-pink-700"
            }`}
        >
          <div>
            <h3 className="text-base font-medium text-white flex items-center gap-2 relative xl:text-nowrap flex-wrap-reverse">
              {card.name}
              <div
                className="relative"
                onMouseEnter={() => setHoveredCard(card.name)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <CircleAlert className="w-4 h-4 cursor-pointer" />
                {hoveredCard === card.name && (
                  <div className="absolute z-10  left-1/2 transform -translate-x-1/2 bottom-full mb-2">
                    <div className="bg-g-gray-1000 rounded-[var(--g-radius-sm)] px-3 py-2 shadow-geist-menu">
                      <p className="text-white text-xs font-medium whitespace-nowrap">
                        {card.tooltip}
                      </p>
                    </div>
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-g-gray-1000"></div>
                  </div>
                )}
              </div>
            </h3>
            <p className="lg:text-[48px] sm:text-[32px] text-3xl pt-6 text-white font-semibold">
              {card.value}
            </p>
          </div>

          <div className="w-[40px] h-[40px] 2xl:w-[44px] 2xl:h-[44px] bg-white/25 rounded-full flex justify-center items-center">
            <Image src={card.icon} alt={card.name} className="w-[20px] h-[20px] xl:w-[27px] xl:h-[27px]" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardCards;
