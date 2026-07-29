"use client";
import { CircleAlert } from "lucide-react";
import React, { useState } from "react";

interface StatsCardProps {
  title: string;
  value: number;
  change?: string;
  activeValue?: number;
  inactiveValue?: number;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  activeValue = 0,
  inactiveValue = 0,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getTooltipContent = () => {
    switch (title) {
      case "Decline":
        return "Total declined requests";
      case "Approved":
        return "Total approved requests";
      case "Pending":
        return "Total pending requests";
      default:
        return "";
    }
  };

  // Color based on title
  const getActiveColor = () => {
    switch (title) {
      case "Decline":
        return "var(--g-red-700)";
      case "Approved":
        return "var(--g-green-700)";
      case "Pending":
        return "var(--g-amber-700)";
      default:
        return "var(--g-red-700)";
    }
  };

  // Calculate percentages for progress bar
  const total = activeValue + inactiveValue;
  const activePercent = total > 0 ? (activeValue / total) * 100 : 0;
  const inactivePercent = total > 0 ? (inactiveValue / total) * 100 : 0;

  return (
    <div className="bg-g-background-100 pt-6 p-4 rounded-[var(--g-radius-md)] border border-(--genrel-light-stroke) shadow-geist-card relative">
      {/* Title + Tooltip */}
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-label-14 text-(--genrel-text-light)">
          {title}
        </h3>
        <div className="relative">
          <CircleAlert
            className="w-[13px] h-[13px] text-(--general-extra-light) cursor-pointer"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          />
          {showTooltip && (
            <div className="absolute z-10 left-1/2 transform -translate-x-1/2 bottom-full mb-2">
              <div className="bg-(--surface-secondary) rounded-[var(--g-radius-sm)] px-[12px] py-[8px] shadow-geist-menu">
                <p className="text-white text-label-12 whitespace-nowrap">
                  {getTooltipContent()}
                </p>
              </div>
              <div className="absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-(--surface-secondary)"></div>
            </div>
          )}
        </div>
      </div>

      {/* Value */}
      <div className="flex justify-between items-end mb-6 lg:mb-10">
        <span className="text-g-gray-1000 font-semibold text-3xl lg:text-[48px]">
          {value}
        </span>
      </div>

      {/* Progress Bar */}
      {total > 0 && (
        <div className="w-full h-[64px]  gap-2  flex overflow-hidden">
          <div
            className="h-full rounded-[var(--g-radius-sm)]"
            style={{
              width: `${activePercent}%`,
              backgroundColor: getActiveColor(),
            }}
          />
          <div
            className="bg-(--secondary-alpha-10) flex justify-center items-center text-(--genrel-text-light) text-2xl font-normal h-full rounded-[var(--g-radius-sm)]"
            style={{ width: `${inactivePercent}%` }}
          >
            {inactiveValue}+
          </div>
        </div>
      )}
    </div>
  );
};
