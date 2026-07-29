import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import ThemeProvider from "./ThemeProvider";
import ColorModeProvider from "@/components/theme/ColorModeProvider";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const NO_FLASH_SCRIPT = `
(function () {
  try {
    var stored = window.localStorage.getItem("hrm-color-theme");
    var theme = stored || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans`}>
        <ThemeProvider>
          <ColorModeProvider>
            {children}
            <Toaster
              toastOptions={{
                duration: 5000, // ⏱️ Increased duration (default is 4000ms)
              }}
            />
          </ColorModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
