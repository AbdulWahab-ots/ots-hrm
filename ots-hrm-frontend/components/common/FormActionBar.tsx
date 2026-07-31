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
      className="rounded-3xl lg:rounded-[32px] mt-4 mx-6 sm:mx-10 lg:mx-16 py-2 px-4 shadow-geist-card sticky bottom-0 z-10"
      style={{
        // Hardcoded (not the --g-gray-1000/--g-blue-1000 tokens) on purpose: this bar is
        // designed to always read as a dark, high-contrast action bar. Those tokens invert
        // between themes (they're meant for text color, going light-on-dark in dark mode),
        // so using them here turned this into a near-white bar in dark mode instead of the
        // intended dark one.
        background: "linear-gradient(to right, #171717, #002359)",
      }}
    >
      <div className="flex justify-between items-center max-w-4xl mx-auto">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="text-white text-button-14 cursor-pointer hover:underline focus-ring-geist rounded-[var(--g-radius-sm)]"
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
