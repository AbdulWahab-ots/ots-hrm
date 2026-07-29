"use client";
import { CircleAlert } from "lucide-react";
import React, { useState } from "react";

type Accent = "green" | "red" | "blue" | "gray";

interface StatsCardProps {
  title: string;
  value: number | string;
  /** small caption under the value, e.g. "38% of workforce" */
  sublabel?: string;
  icon?: React.ReactNode;
  accent?: Accent;
  tooltip?: string;
}

/* Accent maps to a soft icon chip + caption color, all from Geist tokens so
   both light and dark themes stay correct (no hardcoded rainbow). */
const ACCENTS: Record<Accent, { chipBg: string; chipFg: string; caption: string }> = {
  green: {
    chipBg: "bg-g-green-100",
    chipFg: "text-g-green-700",
    caption: "text-g-green-700",
  },
  red: {
    chipBg: "bg-g-red-100",
    chipFg: "text-g-red-700",
    caption: "text-g-red-700",
  },
  blue: {
    chipBg: "bg-g-blue-100",
    chipFg: "text-g-blue-700",
    caption: "text-g-blue-700",
  },
  gray: {
    chipBg: "bg-g-gray-alpha-200",
    chipFg: "text-g-gray-900",
    caption: "text-g-gray-700",
  },
};

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  sublabel,
  icon,
  accent = "gray",
  tooltip,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const a = ACCENTS[accent];

  return (
    <div className="bg-g-background-100 p-5 rounded-[var(--g-radius-md)] shadow-geist-card border border-g-gray-alpha-400 relative transition-shadow hover:shadow-geist-menu">
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          {icon && (
            <span
              className={`flex items-center justify-center w-9 h-9 rounded-[var(--g-radius-sm)] ${a.chipBg} ${a.chipFg}`}
            >
              {icon}
            </span>
          )}
          <h3 className="text-label-14 font-medium text-g-gray-900">{title}</h3>
        </div>
        {tooltip && (
          <div className="relative shrink-0">
            <CircleAlert
              className="w-4 h-4 text-g-gray-700 cursor-pointer"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            />
            {showTooltip && (
              <div className="absolute z-10 right-0 bottom-full mb-2">
                <div className="bg-g-gray-1000 rounded-[var(--g-radius-sm)] shadow-geist-menu px-3 py-2">
                  <p className="text-g-background-100 text-label-12 font-medium whitespace-nowrap">
                    {tooltip}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-g-gray-1000 font-semibold text-3xl lg:text-[40px] leading-none">
          {value}
        </span>
        {sublabel && (
          <span className={`text-label-13 font-medium ${a.caption}`}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
};
