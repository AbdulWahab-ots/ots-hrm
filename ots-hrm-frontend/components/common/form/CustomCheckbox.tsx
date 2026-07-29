"use client";

import React from "react";

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id: string;
  disabled?: boolean;
  indeterminate?: boolean; // Add indeterminate prop
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  checked,
  onChange,
  id,
  disabled = false,
  indeterminate = false,
}) => {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`h-4 w-4 rounded-[var(--g-radius-sm)] border flex items-center justify-center transition-colors duration-200 focus:outline-none focus-ring-geist
        ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
        ${
          checked || indeterminate
            ? "bg-g-blue-100 border-g-blue-700"
            : "bg-g-background-100 border-g-gray-300"
        }
        ${!disabled && !checked && !indeterminate && "hover:border-g-blue-700"}
      `}
    >
      {checked && !indeterminate ? (
        <svg
          width="10"
          height="8"
          viewBox="0 0 10 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1 4L3.66667 7L9 1"
            stroke="var(--g-blue-700)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : indeterminate ? (
        <svg
          width="10"
          height="2"
          viewBox="0 0 10 2"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1 1H9"
            stroke="var(--g-blue-700)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ) : null}
    </button>
  );
};

export default CustomCheckbox;
