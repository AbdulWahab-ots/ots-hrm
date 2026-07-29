"use client";

import React, { useState, useEffect, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  format,
  startOfToday,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
} from "date-fns";
import { Check } from "lucide-react";

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface DateRangeFieldProps {
  name: string;
  label?: string;
  id?: string;
  className?: string;
  placeholder?: string;
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  onCustomSelect?: () => void;
}

const rangeOptions = [
  { value: "Today", label: "Today" },
  { value: "Yesterday", label: "Yesterday" },
  { value: "Last 7 Days", label: "Last 7 Days" },
  { value: "This Month", label: "This Month" },
  { value: "Last Month", label: "Last Month" },
  { value: "Custom Range", label: "Custom Range" },
];

export default function DateRangeField({
  name,
  label,
  id = "dateRange",
  className = "",
  placeholder = "Select Date Range",
  value,
  onChange,
  onCustomSelect,
}: DateRangeFieldProps) {
  const [selectedRange, setSelectedRange] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(
    value?.startDate || null
  );
  const [endDate, setEndDate] = useState<Date | null>(value?.endDate || null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    // Sync startDate and endDate with value prop
    setStartDate(value?.startDate || null);
    setEndDate(value?.endDate || null);
  }, [value]);

  const handleRangeSelect = (option: string) => {
    const today = new Date(); // Use current date
    let start: Date | null = null;
    let end: Date | null = null;

    switch (option) {
      case "Today":
        start = new Date(today);
        end = new Date(today);
        break;
      case "Yesterday":
        start = subDays(today, 1);
        end = subDays(today, 1);
        break;
      case "Last 7 Days":
        start = subDays(today, 7);
        end = new Date(today);
        break;
      case "This Month":
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case "Last Month":
        const lastMonth = subMonths(today, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      case "Custom Range":
        if (onCustomSelect) {
          onCustomSelect();
          setSelectedRange("Custom Range");
          setIsOpen(true); // Keep dropdown open to show updated custom range
        }
        return;
      default:
        return;
    }

    setSelectedRange(option);
    setStartDate(start);
    setEndDate(end);
    if (onChange) {
      onChange({ startDate: start, endDate: end });
    }
    setIsOpen(false);
  };

  const handleOptionClick = (value: string) => {
    handleRangeSelect(value);
  };

  const renderOption = (
    option: { value: string; label: string },
    isSelected: boolean
  ) => (
    <div className="flex items-center justify-between">
      <span>
        {option.value === "Custom Range" &&
        startDate &&
        endDate &&
        selectedRange === "Custom Range"
          ? `${format(startDate, "dd/MM/yyyy")} to ${format(
              endDate,
              "dd/MM/yyyy"
            )}`
          : option.label}
      </span>
      {isSelected && <Check className="h-4 w-4 text-g-blue-700" />}
    </div>
  );

  const selectedLabel = selectedRange
    ? selectedRange === "Custom Range" && startDate && endDate
      ? `${format(startDate, "dd/MM/yyyy")} to ${format(endDate, "dd/MM/yyyy")}`
      : rangeOptions.find((option) => option.value === selectedRange)?.label
    : placeholder;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label
          htmlFor={id}
          className="block text-label-14 font-medium text-g-gray-900 mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          className={`w-full h-10 px-3 text-left bg-g-background-100 border border-g-gray-alpha-400 rounded-[var(--g-radius-sm)] focus:outline-none focus-ring-geist flex items-center justify-between
                     ${
                       isOpen
                         ? "text-g-gray-800"
                         : "text-g-gray-800"
                     }`}
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className={`truncate ${!selectedRange ? "text-g-gray-700" : ""}`}>
            {selectedLabel}
          </span>
          <svg
            className={`h-5 w-5 text-g-gray-700 transform transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        {isOpen && (
          <ul
            className="absolute z-10 mt-1 min-w-40 border border-g-gray-alpha-400 bg-g-background-100 shadow-geist-menu max-h-60 rounded-[var(--g-radius-md)] py-1 text-base overflow-auto focus:outline-none sm:text-sm"
            role="listbox"
            aria-labelledby={id}
          >
            {rangeOptions.map((option) => {
              const isSelected = selectedRange === option.value;
              return (
                <li
                  key={option.value}
                  className={`px-4 py-2 cursor-pointer hover:bg-g-gray-alpha-100 ${
                    isSelected
                      ? "bg-g-blue-100 text-g-blue-700"
                      : "text-g-gray-900"
                  }`}
                  onClick={() => handleOptionClick(option.value)}
                  role="option"
                  aria-selected={isSelected}
                >
                  {renderOption(option, isSelected)}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
