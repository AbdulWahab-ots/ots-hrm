import React from "react";
import { FaChevronLeft } from "react-icons/fa";

type ButtonProps = {
  label?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  icon?: React.ElementType;
  iconPosition?: "left" | "right" | "center";
  className?: string;
  type?: "button" | "submit" | "reset";
  isArrowButton?: boolean;
  disabled?: boolean;
  variant?: "filled" | "outline" | "secondary";
  isLoading?: boolean;
  // Defaults to true to preserve existing full-width buttons everywhere. Set to false
  // for buttons that sit in a shrink-to-fit container (e.g. a modal/form action bar) —
  // width:100% there resolves against a circularly-sized ancestor and collapses the button.
  fullWidth?: boolean;
  // Defaults to "sm" (the standard button radius used everywhere). Set to "full" for a
  // pill shape — used where the button sits inside a large-radius container (e.g.
  // FormActionBar) and should visually complement its rounding.
  rounded?: "sm" | "full";
};

const Button = ({
  label = "",
  onClick,
  icon: Icon,
  iconPosition = "left",
  className = "",
  type = "button",
  isArrowButton = false,
  disabled = false,
  variant = "filled",
  isLoading = false,
  fullWidth = true,
  rounded = "sm",
}: ButtonProps) => {
  // Base styles
  const baseStyles = `flex ${fullWidth ? "w-full" : "w-auto"} text-nowrap items-center justify-center gap-2 text-button-14 lg:text-button-16 py-3 px-4 border ${rounded === "full" ? "rounded-[var(--g-radius-full)]" : "rounded-[var(--g-radius-sm)]"} transition-all duration-150`;

  // Filled variant styles
  const filledStyles = `
    bg-g-blue-700
    border-g-blue-700
    text-white
    hover:bg-g-blue-800
    hover:border-g-blue-800
    disabled:bg-g-gray-alpha-100
    disabled:border-g-gray-alpha-100
    disabled:text-g-gray-700
    focus-ring-geist
  `;
  // secondary varient style
   const secondaryStyles = `
    bg-g-gray-100
    text-g-blue-700
    border-g-gray-100
    hover:bg-g-gray-200
    disabled:bg-g-gray-alpha-100
    disabled:border-g-gray-alpha-100
    disabled:text-g-gray-700
    focus-ring-geist
`;


  // Outline variant styles
  const outlineStyles = `
    bg-g-background-100
    border-g-gray-alpha-400
    text-g-gray-1000
    hover:bg-g-gray-alpha-100
    hover:text-g-gray-1000
    disabled:border-g-gray-200
    disabled:text-g-gray-600
    focus-ring-geist
  `;

  // Apply variant styles
  const variantStyles = variant === "outline" ? outlineStyles : variant === "secondary" ? secondaryStyles : filledStyles;

  // Disabled state
  const disabledStyles =
    disabled || isLoading ? "cursor-not-allowed" : "cursor-pointer";

  // For outline variant with icon only, center the icon
  const shouldCenterIcon = variant === "outline" && Icon && !label;

  if (isArrowButton) {
    return (
      <button
        onClick={onClick}
        type={type}
        disabled={disabled || isLoading}
        className={`
          w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14
          rounded-full border border-g-gray-alpha-400
          flex items-center justify-center bg-transparent shadow-geist-card
          hover:bg-g-gray-alpha-100
          focus-ring-geist
          ${
            disabled || isLoading
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer"
          }
          ${className}
        `}
        aria-label="Back"
      >
        <FaChevronLeft className="text-g-blue-700 w-3 h-3 md:h-4 md:w-4 lg:w-5 lg:h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled || isLoading}
      className={`
        ${baseStyles}
        ${variantStyles}
        ${disabledStyles}
        ${className}
      `}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : (
        <>
          {/* For outline variant with icon only, always center the icon */}
          {shouldCenterIcon && <Icon className="w-4 h-4" />}

          {/* For other cases, use the normal rendering logic */}
          {!shouldCenterIcon && (
            <>
              {Icon && iconPosition === "left" && <Icon className="w-4 h-4" />}
              {Icon && iconPosition === "center" && (
                <Icon className="5-4 h-5" />
              )}
              {label && <span>{label}</span>}
              {Icon && iconPosition === "right" && <Icon className="w-4 h-4" />}
            </>
          )}
        </>
      )}
    </button>
  );
};

export default Button;
