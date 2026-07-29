"use client";

import React from "react";
import { Info, Calendar, FileText, Loader2 } from "lucide-react";
import HeaderWithTooltip from "@/components/common/Typography/HeaderWithTooltip";
import { FiLoader } from "react-icons/fi";
import { PiReceipt } from "react-icons/pi";
import { IoCalendarClearOutline } from "react-icons/io5";
import { AiOutlineCalendar } from "react-icons/ai";

interface AlertItem {
  id: number;
  title: string;
  subtitle: string;
  type: "leave" | "holiday" | "payroll";
  status?: string;
}

const alerts: AlertItem[] = [
  {
    id: 1,
    title: "Your Sick Leave from Aug 10–12",
    subtitle: "Pending Approval",
    type: "leave",
    status: "pending",
  },
  {
    id: 2,
    title: "Next Holiday: Labor Day",
    subtitle: "Monday, September 4th",
    type: "holiday",
  },
  {
    id: 3,
    title: "Next Payroll Roll",
    subtitle: "Friday, August 25th",
    type: "payroll",
  },
];

const UpcomingAlerts: React.FC = () => {
  const getStyles = (type: string) => {
    switch (type) {
      case "leave":
        return {
          bg: "bg-g-amber-100",
          sideClor: "bg-g-amber-700",
          icon: <FiLoader className="w-6.5 h-6.5 text-g-gray-900" />,
          border: "border-[1px] border-g-amber-200",
        };
      case "holiday":
        return {
          bg: "bg-g-blue-100",
          sideClor: "bg-g-blue-700",
          icon: <PiReceipt className="w-6.5 h-6.5 text-g-gray-900" />,
          border: "border-[1px] border-g-blue-200",
        };
      case "payroll":
        return {
          bg: "bg-g-green-100",
          sideClor: "bg-g-green-700",
          icon: <AiOutlineCalendar className="w-6.5 h-6.5 text-g-gray-900" />,
          border: "border-[1px] border-g-green-200",
        };
      default:
        return {
          bg: "bg-g-gray-100",
          sideClor: "bg-g-gray-400",
          icon: <Info className="w-6.5 h-6.5 text-g-gray-900" />,
          border: "border-[1px] border-g-gray-alpha-400",
        };
    }
  };

  return (
    <div className="lg:col-span-3 rounded-3xl border-[1px] border-g-gray-alpha-400 p-6 bg-g-background-100 ">
      <HeaderWithTooltip
        title="Upcoming Alerts"
        tooltipContent="This shows the daily Alert for employee."
        iconSize={12}
      />

      <div className="flex flex-col mt-4 gap-2">
        {alerts.map((alert) => {
          const style = getStyles(alert.type);
          return (
            <div
              key={alert.id}
              className={`flex  items-center gap-3 py-3 rounded-2xl ${style.border}  ${style.bg} `}
            >
              <span className={`${style.sideClor} h-10 rounded-md w-1 `}></span>
              <div className="mt-0.5">{style.icon}</div>
              <div>
                <p className="text-base font-normal text-g-gray-900">
                  {alert.title}
                </p>
                <p className={`text-base font-bold text-g-gray-1000`}>
                  {alert.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UpcomingAlerts;
