"use client";

import { ReactNode } from "react";

interface FormActionBarProps {
  onCancel?: () => void;
  cancelLabel?: string;
  children: ReactNode;
}

const FormActionBar = ({
  onCancel,
  cancelLabel = "Back",
  children,
}: FormActionBarProps) => {
  return (
    <div
      className="rounded-3xl lg:rounded-[32px] mt-4 py-6 px-4 shadow-geist-card w-full sticky bottom-0 z-10"
      style={{
        background:
          "linear-gradient(to right, var(--g-gray-1000), var(--g-blue-1000))",
      }}
    >
      <div className="flex justify-between items-center max-w-4xl mx-auto">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="text-g-background-100 text-button-14 cursor-pointer hover:underline focus-ring-geist rounded-[var(--g-radius-sm)]"
          >
            {cancelLabel}
          </button>
        ) : (
          <span />
        )}
        <div>{children}</div>
      </div>
    </div>
  );
};

export default FormActionBar;
