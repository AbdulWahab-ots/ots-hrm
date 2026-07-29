"use client";

import React, { useState } from "react";
import { useField } from "formik";
import { Eye, EyeOff } from "lucide-react";
import { InputFieldProps } from "@/utils/types";

interface ExtendedInputFieldProps extends InputFieldProps {
  isPriceField?: boolean; // New prop to indicate a price field
}

const InputField: React.FC<ExtendedInputFieldProps> = ({
  label,
  name,
  type = "text",
  placeholder,
  className,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  hideLabel = false,
  isPriceField = false, // Default to false to avoid affecting other inputs
  onChange,
}) => {
  const [field, meta] = useField(name);
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const inputType =
    type === "password" ? (showPassword ? "text" : "password") : type;
  const hasError = meta.touched && meta.error;

  // Combine Formik's onChange with custom onChange if provided
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    field.onChange(e);
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div className={className}>
      {!hideLabel && label && (
        <label
          htmlFor={name}
          className="text-g-gray-900 text-label-14 font-medium block"
        >
          {label}
        </label>
      )}

      <div className="relative mt-1 flex items-center gap-4">
        <div className="relative flex-1">
          {/* Rs Prefix for price fields */}
          {isPriceField && (
            <div className="absolute inset-y-0 rounded-l-[var(--g-radius-sm)] border-r border-g-gray-alpha-400 px-3 left-0 bg-g-gray-alpha-100 pl-3 flex items-center pointer-events-none">
              <span className="text-g-gray-800 text-label-14">Rs</span>
            </div>
          )}

          {/* Left Icon for non-price fields */}
          {LeftIcon && !isPriceField && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LeftIcon className="h-4 w-4 text-g-gray-800" />
            </div>
          )}

          <input
            {...field}
            id={name}
            name={name}
            value={field.value ?? ""}
            type={inputType}
            className={`
              block w-full h-10 px-3 text-label-14
              bg-g-background-100 border border-g-gray-alpha-400 rounded-[var(--g-radius-sm)]
              focus:outline-none focus-ring-geist transition-all duration-200
              ${hasError ? "border-g-red-700" : ""}
              ${isPriceField || LeftIcon ? "pl-12" : ""}
              ${RightIcon || type === "password" ? "pr-10" : ""}
              ${type === "number"
                ? "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                : ""
              }
            `}
            placeholder={placeholder}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={(e) => {
              setIsFocused(false);
              field.onBlur(e);
            }}
          />

          {/* Right Icon or Password Toggle */}
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {RightIcon && type !== "password" && (
              <RightIcon className="h-4 w-4 text-g-gray-800" />
            )}

            {type === "password" && !RightIcon && (
              <button
                type="button"
                className="text-g-gray-800 hover:text-g-gray-900 focus:outline-none focus-ring-geist rounded-[var(--g-radius-sm)]"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
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

export default InputField;
