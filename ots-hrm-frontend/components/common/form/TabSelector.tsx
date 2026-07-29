import React from "react";

interface TabSelectorProps {
  value: string | number;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: "xs" | "sm" | "base" | "large";
  className?: string;
}

const TabSelector: React.FC<TabSelectorProps> = ({
  value,
  label,
  checked,
  onChange,
  size = "base",
  className = "",
}) => {
  const sizeClasses = {
    xs: "h-6 w-6 text-xs rounded-[var(--g-radius-sm)]",
    sm: "h-8 w-8 text-sm  rounded-[var(--g-radius-sm)]",
    base: "h-10 w-10 text-base rounded-[var(--g-radius-sm)]",
    large:
      "lg:h-[70px] lg:w-[70px] sm:h-[45px] sm:w-[45px] h-[35px] w-[35px] lg:text-[44px] text-3xl rounded-[var(--g-radius-md)]",
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="checkbox"
        id={`tab-${value}`}
        value={value}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="absolute font-medium opacity-0 h-0 w-0"
      />
      <label
        htmlFor={`tab-${value}`}
        className={`flex items-center justify-center  border cursor-pointer transition-all duration-200 focus-ring-geist ${
          sizeClasses[size]
        } ${
          checked
            ? "border-g-blue-200 text-(--primary-navy-blue)"
            : "border-g-gray-alpha-400 text-g-gray-700"
        } hover:border-g-blue-700 hover:text-g-blue-800 bg-g-background-100`}
        style={{ borderWidth: "0.81px" }}
      >
        {label}
      </label>
    </div>
  );
};

export default TabSelector;
