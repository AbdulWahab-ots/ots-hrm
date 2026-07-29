"use client";

import { Moon, Sun } from "lucide-react";
import { useColorMode } from "../theme/ColorModeProvider";

const ThemeToggle = ({ className = "" }: { className?: string }) => {
  const { theme, toggleTheme } = useColorMode();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className={`flex items-center justify-center h-9 w-9 rounded-[var(--g-radius-sm)] text-g-gray-900 hover:bg-g-gray-alpha-200 hover:text-g-gray-1000 transition-colors duration-150 cursor-pointer focus-ring-geist ${className}`}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

export default ThemeToggle;
