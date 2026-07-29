import React, { useState } from "react";
import { CircleAlert } from "lucide-react";

interface HeaderWithTooltipProps {
  title: string;
  tooltipContent: string | React.ReactNode;
  className?: string;
  iconSize?: number;
  textClassName?: string;
  whiteText?: boolean; // ✅ new prop
}

const HeaderWithTooltip: React.FC<HeaderWithTooltipProps> = ({
  title,
  tooltipContent,
  className = "",
  iconSize = 12,
  textClassName = "text-lg sm:text-base font-medium text-(--genrel-text-light)",
  whiteText = false, // ✅ default false (same behavior as before)
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className={`flex items-center ${className}`}>
      <h2 className={`${textClassName} ${whiteText ? "text-white" : ""}`}>
        {title}
      </h2>
      <div className="relative ml-2">
        <CircleAlert
          className={`h-[13px] w-[13px] cursor-pointer ${
            whiteText ? "text-white" : "text-(--genrel-text-light)"
          }`}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        />
        {showTooltip && (
          <div className="absolute z-10 left-1/2 transform -translate-x-1/2 bottom-full mb-2">
            <div className="bg-(--surface-secondary) rounded-[var(--g-radius-sm)] px-3 py-2 shadow-geist-menu">
              <p className="text-white text-label-12 font-semibold whitespace-nowrap">
                {tooltipContent}
              </p>
            </div>
            <div className="absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-g-gray-1000"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeaderWithTooltip;
