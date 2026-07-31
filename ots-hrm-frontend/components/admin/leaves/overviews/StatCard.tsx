"use client";
import { CircleAlert } from "lucide-react";
import React, { useState } from "react";

interface StatsCardProps {
  title: string;
  value: number;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value }) => {
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
        return "#fc0035";
      case "Approved":
        return "#28a948";
      case "Pending":
        return "#ffae00";
      default:
        return "#fc0035";
    }
  };

  return (
    <div className="bg-g-background-100 pt-6 p-4 rounded-[var(--g-radius-md)] border border-(--genrel-light-stroke) relative shadow-geist-card">
      {/* Title + Tooltip */}
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-base font-medium text-(--genrel-text-light)">
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
                <p className="text-white text-[12px] font-semibold whitespace-nowrap">
                  {getTooltipContent()}
                </p>
              </div>
              <div className="absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-g-gray-1000"></div>
            </div>
          )}
        </div>
      </div>

      {/* Value */}
      <div className="flex justify-between items-end mb-6 lg:mb-4">
        <span className="text-g-gray-1000 font-semibold text-3xl lg:text-[48px]">
          {value}
        </span>
      </div>

      {/* Status accent bar */}
      <div
        className="w-full h-1.5 rounded-[var(--g-radius-sm)]"
        style={{ backgroundColor: getActiveColor() }}
      />
    </div>
  );
};
