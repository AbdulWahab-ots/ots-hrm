"use client";
import { CircleAlert } from "lucide-react";
import React, { useState } from "react";

interface StatsCardProps {
  title: string;
  value: number;
  change?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getTooltipContent = () => {
    switch (title) {
      case "Total Companies":
        return "Total number of companies in your profile";
      case "Active":
        return "Total number of active companies";
      case "Inactive":
        return "How many companies are inactive";
      case "Total Departments":
        return "Total number of department in your profile";
      case "Average Working days":
        return "Total number of Working days in your profile";

      default:
        return "";
    }
  };

  return (
    <div className="bg-g-background-100 p-6 rounded-[var(--g-radius-md)] border-[1px] border-g-gray-alpha-400 shadow-geist-card relative">
      <div className="flex items-center gap-2 mb-6 lg:mb-10">
        <h3 className="text-label-14 text-(--genrel-text-light) ">
          {title}
        </h3>
        <div className="relative">
          <CircleAlert
            className="w-[13.333333015441895px] h-[13.333333015441895px] text-g-gray-800 cursor-pointer focus-ring-geist"
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
      <div className="flex justify-between items-end">
        <span className="text-g-gray-1000 font-semibold text-3xl lg:text-[48px]">
          {value}
        </span>
        {change && (
          <span className="ml-2 text-g-green-700 text-label-14">
            {change}
          </span>
        )}
      </div>
    </div>
  );
};
