import React, { useState, useEffect } from "react";

type ToggleButtonProps = {
  initialValue?: boolean;
  onChange?: (value: boolean) => void;
  disabled?: boolean;
  trueBgColor?: string;
  falseBgColor?: string;
  width?: string;
  height?: string;
};

const ToggleButton: React.FC<ToggleButtonProps> = ({
  initialValue = false,
  onChange,
  disabled = false,
  trueBgColor = "var(--g-blue-700)",
  falseBgColor = "var(--g-gray-200)",
  width = "44px",
  height = "24px",
}) => {
  const [isOn, setIsOn] = useState(initialValue);

  const handleToggle = () => {
    if (disabled) return;
    const newValue = !isOn;
    setIsOn(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  // Sync with initialValue when it changes (e.g., during form reset or edit)
  useEffect(() => {
    setIsOn(initialValue);
  }, [initialValue]);

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled}
      className={`relative rounded-[var(--g-radius-full)] p-0.5 transition-colors duration-200 focus:outline-none focus-ring-geist ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      }`}
      style={{
        width,
        height,
        backgroundColor: isOn ? trueBgColor : falseBgColor,
        padding: "2px",
      }}
      aria-pressed={isOn}
    >
      <span
        className={`block rounded-[var(--g-radius-full)] bg-g-background-100 shadow-geist-card transition-transform duration-200 ${
          isOn ? "translate-x-full" : "translate-x-0"
        }`}
        style={{
          width: `calc(${height} - 4px)`,
          height: `calc(${height} - 4px)`,
        }}
      />
    </button>
  );
};

export default ToggleButton;
