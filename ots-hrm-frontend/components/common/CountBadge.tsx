import React from "react";
import { twMerge } from "tailwind-merge";

interface CountBadgeProps {
  count: number;
  className?: string;
}

const CountBadge: React.FC<CountBadgeProps> = ({ count, className }) => {
  return (
    <span
      className={twMerge(
        "py-0.5 px-3 h-6 text-g-blue-700 text-xs font-medium flex items-center bg-g-blue-100 rounded-[var(--g-radius-full)] border-[1px] border-g-blue-200",
        className
      )}
    >
      {count}
    </span>
  );
};

export default CountBadge;
