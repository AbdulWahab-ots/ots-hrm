"use client";

import React from "react";
import { IoIosArrowBack } from "react-icons/io";

type BackButtonProps = {
  label?: string;
  onClick?: () => void;
  iconPosition?: "left" | "right";
  className?: string;
  disabled?: boolean;
};

const BackButton: React.FC<BackButtonProps> = ({
  label = "Back",
  onClick,
  iconPosition = "left",
  className = "text-heading-20",
  disabled = false,
}) => {
  return (
    <div className="flex px-4 gap-4 mb-6 items-center">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center  font-semibold text-g-gray-900 cursor-pointer hover:text-g-blue-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-ring-geist rounded-[var(--g-radius-sm)] ${className}`}
      >
        {iconPosition === "left" && <IoIosArrowBack className="w-5 h-5" />}

        {iconPosition === "right" && (
          <IoIosArrowBack className="w-5 h-5 rotate-180" />
        )}
      </button>
      <h2
        className={`flex items-center font-semibold text-g-gray-900   transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {label}
      </h2>
    </div>
  );
};

export default BackButton;
