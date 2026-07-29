"use client";
import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { DateRangeDropdownProps } from "@/utils/types";

const DateRangeDropdown: React.FC<DateRangeDropdownProps> = ({ value, onChange }) => {
  const [showCustomRangePicker, setShowCustomRangePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const handleCustomRangeApply = () => {
    if (customStartDate && customEndDate) {
      onChange("Custom Range");
      setShowCustomRangePicker(false);
    }
  };

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === "Custom Range") {
      setShowCustomRangePicker(true);
    } else {
      onChange(e.target.value);
      setShowCustomRangePicker(false);
    }
  };

  return (
    <div className="relative w-full sm:w-56">
      <select
        id="date-range-filter"
        value={value}
        onChange={handleDropdownChange}
        className="block w-full h-10 pl-3 pr-8 border border-g-gray-alpha-400 focus:outline-none focus-ring-geist text-label-14 rounded-[var(--g-radius-sm)] appearance-none bg-g-background-100"
      >
        <option value="04/26/2025 - 05/02/2025">04/26/2025 - 05/02/2025</option>
        <option value="Today">Today</option>
        <option value="Yesterday">Yesterday</option>
        <option value="Last 7 Days">Last 7 Days</option>
        <option value="Last 30 Days">Last 30 Days</option>
        <option value="This Month">This Month</option>
        <option value="Last Month">Last Month</option>
        <option value="Custom Range">Custom Range</option>
      </select>
      <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-g-gray-700 pointer-events-none" />

      {showCustomRangePicker && (
        <div className="absolute z-10 mt-1 p-4 bg-g-background-100 border border-g-gray-alpha-400 rounded-[var(--g-radius-md)] shadow-geist-menu w-full sm:w-96">
          <div className="flex justify-between gap-4 mb-4">
            <div>
              <label className="block text-label-14 font-medium text-g-gray-900 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomStartDate(e.target.value)}
                className="block w-full h-10 pl-3 pr-3 border border-g-gray-alpha-400 rounded-[var(--g-radius-sm)] focus:outline-none focus-ring-geist"
              />
            </div>
            <div>
              <label className="block text-label-14 font-medium text-g-gray-900 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomEndDate(e.target.value)}
                className="block w-full h-10 pl-3 pr-3 border border-g-gray-alpha-400 rounded-[var(--g-radius-sm)] focus:outline-none focus-ring-geist"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowCustomRangePicker(false)}
              className="px-4 py-2 text-button-14 text-g-gray-900 hover:bg-g-gray-alpha-100 rounded-[var(--g-radius-sm)] focus-ring-geist"
            >
              Cancel
            </button>
            <button
              onClick={handleCustomRangeApply}
              className="px-4 py-2 text-button-14 bg-g-blue-700 text-white rounded-[var(--g-radius-sm)] hover:bg-g-blue-800 focus-ring-geist"
              disabled={!customStartDate || !customEndDate}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeDropdown;