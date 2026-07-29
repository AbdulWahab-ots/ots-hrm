"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"
import { useColorMode } from "@/components/theme/ColorModeProvider"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useColorMode()

  return (
    <Sonner
      theme={theme}
      position="bottom-right"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-g-green-700" />,
        info: <InfoIcon className="size-4 text-g-blue-700" />,
        warning: <TriangleAlertIcon className="size-4 text-g-amber-700" />,
        error: <OctagonXIcon className="size-4 text-g-red-700" />,
        loading: <Loader2Icon className="size-4 animate-spin text-g-gray-800" />,
      }}
      style={
        {
          "--normal-bg": "var(--g-background-100)",
          "--normal-text": "var(--g-gray-1000)",
          "--normal-border": "var(--g-gray-alpha-400)",
          "--border-radius": "var(--g-radius-md)",
          "--success-bg": "var(--g-background-100)",
          "--success-text": "var(--g-green-700)",
          "--success-border": "var(--g-green-200)",
          "--error-bg": "var(--g-background-100)",
          "--error-text": "var(--g-red-700)",
          "--error-border": "var(--g-red-200)",
          "--warning-bg": "var(--g-background-100)",
          "--warning-text": "var(--g-amber-700)",
          "--warning-border": "var(--g-amber-200)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "shadow-geist-menu",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
