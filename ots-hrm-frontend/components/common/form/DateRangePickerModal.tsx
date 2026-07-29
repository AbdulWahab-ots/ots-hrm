"use client";

import React, { useState, useEffect, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "../Button";

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface DateRangePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (range: DateRange) => void;
  initialRange?: DateRange;
  singleDateMode?: boolean;
  incrementDates?: boolean; // New prop to control date increment
}

export default function DateRangePickerModal({
  isOpen,
  onClose,
  onSave,
  initialRange,
  singleDateMode = false,
  incrementDates = false, // Default to true for backward compatibility
}: DateRangePickerModalProps) {
  const [step, setStep] = useState(1);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: initialRange?.startDate || null,
    endDate: initialRange?.endDate || null,
  });
  const [yearOffset, setYearOffset] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const reference = initialRange?.startDate ?? new Date();
    const referenceYear = reference.getFullYear();
    setSelectedYear(referenceYear);
    setSelectedMonth(reference.getMonth());
    setYearOffset(Math.round((referenceYear - new Date().getFullYear()) / 10));
    setStep(1);
  }, [isOpen, initialRange]);

  const months = [
    "January", "February", "March", "April",
    "May", "June", "July", "August",
    "September", "October", "November", "December"
  ];


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const startYear = new Date().getFullYear() + yearOffset * 10;
  const years = Array.from({ length: 15 }, (_, i) => startYear - i);

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    setStep(2); // now goes to month grid
  };

  const handleDateChange = (date: Date | null | [Date | null, Date | null]) => {
    if (singleDateMode) {
      if (!Array.isArray(date)) {
        setDateRange({ startDate: date, endDate: null });
      }
    } else {
      if (Array.isArray(date)) {
        const [start, end] = date;
        setDateRange({ startDate: start, endDate: end });
      }
    }
  };

  const handleSave = () => {
    if (singleDateMode) {
      if (!dateRange.startDate) return;
      const adjustedStart = new Date(dateRange.startDate);
      if (incrementDates) {
        adjustedStart.setDate(adjustedStart.getDate() + 1);
      }
      onSave({ startDate: adjustedStart, endDate: null });
    } else {
      if (!dateRange.startDate || !dateRange.endDate) return;
      const adjustedStart = new Date(dateRange.startDate);
      const adjustedEnd = new Date(dateRange.endDate);
      if (incrementDates) {
        adjustedStart.setDate(adjustedStart.getDate() + 1);
        adjustedEnd.setDate(adjustedEnd.getDate() + 1);
      }
      onSave({ startDate: adjustedStart, endDate: adjustedEnd });
    }
    onClose();
  };

  const handlePrevYears = () => {
    setYearOffset((prev) => prev - 1);
  };

  const handleNextYears = () => {
    setYearOffset((prev) => prev + 1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[var(--g-overlay)] flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-g-background-100 rounded-[var(--g-radius-md)] p-8 max-w-[100vw] shadow-geist-modal"
      >
        {step === 1 && (
          // === YEAR SELECTION ===
          <div className="min-w-[318px] 2xl:min-w-[350px] 2xl:min-h-[450px]">
            <div className="flex justify-between items-center mb-6">
              <button
                className="p-2 rounded-[var(--g-radius-sm)] border-g-gray-alpha-400 border hover:bg-g-gray-alpha-200 transition-colors focus-ring-geist"
                onClick={handlePrevYears}
              >
                <ChevronLeft className="h-6 w-6 text-g-gray-800" />
              </button>
              <h2 className="text-heading-20 text-g-gray-900">
                {`${startYear - 14} - ${startYear}`}
              </h2>
              <button
                className="p-2 rounded-[var(--g-radius-sm)] border-g-gray-alpha-400 border hover:bg-g-gray-alpha-200 transition-colors focus-ring-geist"
                onClick={handleNextYears}
              >
                <ChevronRight className="h-6 w-6 text-g-gray-800" />
              </button>
            </div>

            {/* Year Grid */}
            <div className="grid grid-cols-3 gap-3">
              {years.map((year) => (
                <button
                  key={year}
                  className={`p-4 rounded-[var(--g-radius-sm)] text-center text-lg font-medium transition-colors focus-ring-geist ${selectedYear === year
                    ? "bg-g-blue-700 text-white"
                    : "text-g-gray-900 hover:bg-g-gray-alpha-200"
                    }`}
                  onClick={() => handleYearSelect(year)}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && selectedYear && (
          // === MONTH SELECTION ===
          <div className="min-w-[318px] 2xl:min-w-[350px]">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => setStep(1)}
                className="p-2 rounded-[var(--g-radius-sm)] border-g-gray-alpha-400 border hover:bg-g-gray-alpha-200 transition-colors focus-ring-geist"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <h2 className="text-heading-20 text-g-gray-900">{selectedYear}</h2>
              <div className="w-6" /> {/* spacer */}
            </div>

            {/* Month Grid (3 columns, 4 rows) */}
            <div className="grid grid-cols-3 gap-3">
              {months.map((month, index) => (
                <button
                  key={month}
                  className={`p-3 rounded-[var(--g-radius-sm)] text-center font-medium transition-colors focus-ring-geist ${selectedMonth === index
                    ? "bg-g-blue-700 text-white"
                    : "text-g-gray-900 hover:bg-g-gray-alpha-200"
                    }`}
                  onClick={() => {
                    setSelectedMonth(index);
                    setStep(3);
                  }}
                >
                  {month.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && selectedYear !== null && selectedMonth !== null && (
          // === DATE SELECTION ===
          <div className="min-w-[318px] 2xl:min-w-[350px] ">
            <div className="relative flex">
              <DatePicker
                {...({
                  inline: true,
                  monthsShown: 2,
                  ...(!singleDateMode ? { selectsRange: true } : {}),
                  selected: singleDateMode ? dateRange.startDate : undefined,
                  startDate: dateRange.startDate,
                  endDate: dateRange.endDate,
                  onChange: (update: Date | [Date | null, Date | null] | null) => {
                    if (singleDateMode) {
                      setDateRange({ startDate: update as Date, endDate: null });
                    } else {
                      const [start, end] = update as [Date | null, Date | null];
                      setDateRange({ startDate: start, endDate: end });
                    }
                  },
                  openToDate: new Date(selectedYear, selectedMonth),
                } as any)}
              />
              {/* Vertical Divider */}
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-g-gray-alpha-400 my-auto h-[210px] hidden sm:block" />

            </div>
            {/* Buttons */}
            <div className="flex items-center justify-end mt-6">
              <div className="flex gap-4">
                <Button
                  onClick={() => setStep(2)}
                  label="Back"
                  variant="outline"
                  className="px-6 py-2 text-g-gray-800 border-g-gray-300 hover:bg-g-gray-alpha-100"
                />
                <Button
                  onClick={handleSave}
                  disabled={
                    singleDateMode
                      ? !dateRange.startDate
                      : !dateRange.startDate || !dateRange.endDate
                  }
                  label="Set Date"
                  variant="filled"
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
