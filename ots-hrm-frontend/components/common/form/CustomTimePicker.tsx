import React, { useState } from "react";
import { useField } from "formik";
import type { TimePickerProps } from "antd";
import { TimePicker } from "antd";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { InputFieldProps } from "@/utils/types";
import { Clock } from "lucide-react";

dayjs.extend(customParseFormat);

const CustomTimePicker: React.FC<InputFieldProps> = ({
  label,
  name,
  placeholder,
  className,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  hideLabel = false,
}) => {
  const [field, meta, helpers] = useField(name);
  const [isFocused, setIsFocused] = useState(false);
  const hasError = meta.touched && meta.error;

  const handleChange: TimePickerProps["onChange"] = (time, timeString) => {
    if (time) {
      const time24Hour = dayjs(time).format("HH:mm:ss");
      helpers.setValue(time24Hour);
    } else {
      helpers.setValue("");
    }
  };

  // Handle immediate selection to avoid Ant Design's first-click issue
  const handleSelect: TimePickerProps["onCalendarChange"] = (time) => {
    if (time) {
      // 'time' can be Dayjs or Dayjs[]
      const selectedTime = Array.isArray(time) ? time[0] : time;
      if (selectedTime) {
        const time24Hour = dayjs(selectedTime).format("HH:mm:ss");
        helpers.setValue(time24Hour);
      }
    }
  };

  const getDisplayValue = () => {
    if (!field.value) return null;

    // Handle HH:mm:ss format
    if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(field.value)) {
      return dayjs(field.value, "HH:mm:ss");
    }

    // Handle HH:mm format
    if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(field.value)) {
      return dayjs(`${field.value}:00`, "HH:mm:ss");
    }

    // Handle h:mm A format (backward compatibility)
    if (/^(1[0-2]|0?[1-9]):[0-5][0-9] (AM|PM)$/i.test(field.value)) {
      return dayjs(field.value, "h:mm A");
    }

    return null;
  };

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
        {LeftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
            <LeftIcon className="h-4 w-4 text-g-gray-800" />
          </div>
        )}

        <TimePicker
          id={name}
          name={name}
          use12Hours
          format="h:mm A"
          className={`
            block w-full h-10 px-3 text-label-14
            bg-g-background-100 border border-g-gray-alpha-400 rounded-[var(--g-radius-sm)]
            focus:outline-none focus-ring-geist transition-all duration-200
            ${LeftIcon ? "pl-10" : ""}
            ${RightIcon ? "pr-10" : ""}
            ${hasError ? "border-g-red-700" : ""}
          `}
          placeholder={placeholder}
          value={getDisplayValue()}
          onChange={handleChange}
          onCalendarChange={handleSelect}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            helpers.setTouched(true);
          }}
          suffixIcon={null}
        />

        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <Clock className="h-5 w-5 text-g-gray-800" />
        </div>
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

export default CustomTimePicker;
