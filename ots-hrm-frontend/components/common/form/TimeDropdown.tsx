import React, { useState, useRef, useEffect } from "react";
import { useField } from "formik";
import { Check, Clock } from "lucide-react"; // Added Clock icon
import { InputFieldProps } from "@/utils/types";

// Only four fixed options
const timeOptions = [
  { value: "30", label: "30" },
  { value: "60", label: "60" },
  { value: "90", label: "1:30" },
  { value: "120", label: "2" },
];

const CustomTimeField: React.FC<InputFieldProps> = ({
  label,
  name,
  placeholder = "Select Time",
  className = " placeholder:text-gray-400",
  hideLabel = false,
}) => {
  const [field, meta] = useField(name);
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(placeholder);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hasError = meta.touched && meta.error;

  useEffect(() => {
    if (field.value) {
      const selectedOption = timeOptions.find(
        (option) => option.value === field.value
      );
      setSelectedLabel(selectedOption?.label || placeholder);
    } else {
      setSelectedLabel(placeholder);
    }
  }, [field.value, placeholder]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleOptionClick = (value: string, label: string) => {
    field.onChange({
      target: {
        name: field.name,
        value,
      },
    } as React.ChangeEvent<HTMLInputElement>);
    setSelectedLabel(label);
    setIsOpen(false);
  };

  const renderOption = (
    option: { value: string; label: string },
    isSelected: boolean
  ) => (
    <div className="flex items-center justify-between">
      <span>{option.label}</span>
      {isSelected && <Check className="h-4 w-4 text-g-blue-700" />}
    </div>
  );

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

      <div className="relative mt-1" ref={dropdownRef}>
        <button
          type="button"
          className={`block w-full h-10 px-3 text-label-14
            bg-g-background-100 border border-g-gray-alpha-400 rounded-[var(--g-radius-sm)]
            focus:outline-none focus-ring-geist transition-all duration-200
            ${hasError ? "border-g-red-700" : ""}
            text-left flex items-center justify-between
          `}
          onClick={() => setIsOpen(!isOpen)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className={`truncate ${!field.value ? "text-g-gray-700" : ""}`}>
            {selectedLabel}
          </span>
          {/* Clock icon instead of dropdown arrow */}
          <Clock className="h-5 w-5 text-g-gray-700" />
        </button>

        {isOpen && (
          <ul
            className="absolute z-10 mt-1 w-full border border-g-gray-alpha-400 bg-g-background-100 shadow-geist-menu rounded-[var(--g-radius-md)] py-1 text-base overflow-auto focus:outline-none sm:text-sm max-h-60"
            role="listbox"
            aria-labelledby={name}
          >
            {timeOptions.map((option) => {
              const isSelected = field.value === option.value;
              return (
                <li
                  key={option.value}
                  className={`px-4 py-2 w-full cursor-pointer hover:bg-g-gray-alpha-100 ${
                    isSelected
                      ? "bg-g-blue-100 text-g-blue-700"
                      : "text-g-gray-900"
                  }`}
                  onClick={() => handleOptionClick(option.value, option.label)}
                  role="option"
                  aria-selected={isSelected}
                >
                  {renderOption(option, isSelected)}
                </li>
              );
            })}
          </ul>
        )}

        <input
          {...field}
          id={name}
          type="hidden"
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
        />
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

export default CustomTimeField;
