"use client";

import React, { useState } from "react";
import { useField } from "formik";
import { Eye, EyeOff, Mail } from "lucide-react"; // Import default icons
import { InputFieldProps } from "@/utils/types";

interface TextAreaProps extends Omit<InputFieldProps, "type"> {
  rows?: number;
}

const TextArea: React.FC<TextAreaProps> = ({
  label,
  name,
  placeholder,
  className,
  leftIcon: LeftIcon, // Capitalized for component usage
  rightIcon: RightIcon, // Capitalized for component usage
  hideLabel = false,
  rows = 3,
}) => {
  const [field, meta] = useField(name);
  const [isFocused, setIsFocused] = useState(false);
  const hasError = meta.touched && meta.error;

  return (
    <div className={className}>
      {!hideLabel && label && (
        <label
          htmlFor={name}
          className="text-g-gray-900 text-label-14 font-medium mb-3"
        >
          {label}
        </label>
      )}

      <div className="relative mt-1">
        {/* Left icon */}
        {LeftIcon && (
          <div className="absolute top-3 left-0 pl-3 flex items-center pointer-events-none">
            <LeftIcon className="h-4 w-4 text-g-gray-800" />
          </div>
        )}

        <textarea
          {...field}
          id={name}
          name={name}
          rows={rows}
          className={`
            block w-full px-3 py-[10px] text-label-14
            bg-g-background-100 border border-g-gray-alpha-400 rounded-[var(--g-radius-sm)]
            focus:outline-none focus-ring-geist transition-all duration-200
            ${hasError ? "border-g-red-700" : ""}
            ${LeftIcon ? "pl-10" : ""}
            ${RightIcon ? "pr-10" : ""}
            resize-none
          `}
          placeholder={placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            setIsFocused(false);
            field.onBlur(e);
          }}
        />

        {/* Right side elements */}
        {RightIcon && (
          <div className="absolute top-3 right-0 pr-3 flex items-center">
            <RightIcon className="h-4 w-4 text-g-gray-800" />
          </div>
        )}
      </div>

      {hasError && (
        <div className="flex items-center mt-1 text-g-red-700">
          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-copy-13">{meta.error}</span>
        </div>
      )}
    </div>
  );
};

export default TextArea;
