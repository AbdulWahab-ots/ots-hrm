"use client";
import React, { useState, useRef, useEffect } from "react";
import { DropdownProps } from "@/utils/types";
import { Check } from "lucide-react";

const CustomDropdown: React.FC<DropdownProps> = ({
  id,
  name,
  label,
  options,
  className = "",
  value,
  onChange = () => { },
  placeholder = "Select",

}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(placeholder);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [openUpwards, setOpenUpwards] = useState(false);

  useEffect(() => {
    if (value) {
      const selectedOption = options.find((option) => option.value === value);
      setSelectedLabel(selectedOption?.label || placeholder);
    } else {
      setSelectedLabel(placeholder);
    }
  }, [value, options, placeholder]);

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
    onChange?.({
      target: {
        value,
        name: name || "",
      },
    } as React.ChangeEvent<HTMLSelectElement>);
    setIsOpen(false);
  };

  const handleToggleOpen = () => {
    const willOpen = !isOpen;
    setIsOpen(willOpen);
    if (willOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // If less than 240px space below, open upwards
      setOpenUpwards(spaceBelow < 240);
    }
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
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label
          htmlFor={id}
          className="block text-label-14 font-medium text-g-gray-900 mb-1.5"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          className={`w-full h-10 px-3 text-left bg-g-background-100 border border-g-gray-alpha-400 rounded-[var(--g-radius-sm)] focus:outline-none focus-ring-geist flex items-center justify-between
                     ${isOpen
              ? "text-g-gray-800"
              : "text-g-gray-800"
            }`}
          onClick={handleToggleOpen}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className={`truncate ${!value ? "text-g-gray-700" : ""}`}>
            {selectedLabel}
          </span>
          <svg
            className={`h-5 w-5 text-g-gray-700 transform transition-transform ${isOpen ? "rotate-180" : ""
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
            className={`absolute w-full ${openUpwards ? "bottom-full mb-1" : "top-full mt-1"
              } ${className} z-50 border border-g-gray-alpha-400 bg-g-background-100 shadow-geist-menu rounded-[var(--g-radius-md)] py-1 text-base focus:outline-none sm:text-sm`}
            role="listbox"
            aria-labelledby={id}
            // Add max height and overflow for scrollable options
            style={{
              maxHeight: options.length >= 9 ? "240px" : "none",
              overflowY: options.length >= 9 ? "auto" : "visible",
            }}
          >
            {options.map((option) => {
              const isSelected = value === option.value;
              return (
                <li
                  key={option.value}
                  className={`px-4 py-2 w-full cursor-pointer hover:bg-g-gray-alpha-100 ${isSelected
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
      </div>

      <select
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange?.(e)}
        className="hidden"
        aria-hidden="true"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CustomDropdown;
