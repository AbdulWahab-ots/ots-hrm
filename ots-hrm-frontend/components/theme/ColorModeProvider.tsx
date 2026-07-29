"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

type ColorMode = "light" | "dark";

const STORAGE_KEY = "hrm-color-theme";

interface ColorModeContextValue {
  theme: ColorMode;
  toggleTheme: () => void;
  setTheme: (theme: ColorMode) => void;
}

const ColorModeContext = createContext<ColorModeContextValue | undefined>(undefined);

function applyTheme(theme: ColorMode) {
  document.documentElement.setAttribute("data-theme", theme);
}

export default function ColorModeProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [theme, setThemeState] = useState<ColorMode>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as ColorMode | null;
    const initial =
      stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setThemeState(initial);
    applyTheme(initial);
  }, []);

  const setTheme = useCallback((next: ColorMode) => {
    setThemeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <ColorModeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ColorModeContext.Provider>
  );
}

export function useColorMode() {
  const ctx = useContext(ColorModeContext);
  if (!ctx) {
    throw new Error("useColorMode must be used within a ColorModeProvider");
  }
  return ctx;
}
