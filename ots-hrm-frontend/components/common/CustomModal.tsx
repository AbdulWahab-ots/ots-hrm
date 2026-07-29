"use client";

import React, { useEffect } from "react";
import { RxCross2 } from "react-icons/rx";
import { AnimatePresence, motion } from "framer-motion";

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title?: string;
  children: React.ReactNode;
  confirmText?: string;
  backText?: string;
  variant?: "default" | "bottom-full" | "bottom-full-no-rounded";
  className?: string;
}

// Geist motion: 300ms, cubic-bezier(0.175, 0.885, 0.32, 1.1) for overlays/modals.
const GEIST_EASE = [0.175, 0.885, 0.32, 1.1] as const;
const GEIST_DURATION = 0.3;
// Overlay fades faster than the panel slides — asymmetric timing feels more responsive.
const OVERLAY_DURATION = 0.2;

const CustomModal: React.FC<CustomModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = "Confirm",
  backText = "Back",
  variant = "default",
  className = "",
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const isBottomDrawer = variant !== "default";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`fixed inset-0 bg-[var(--g-overlay)] z-[99] ${variant === "default"
            ? "flex items-center justify-center"
            : "flex items-end justify-center"
            }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: OVERLAY_DURATION, ease: "easeOut" }}
        >
          <motion.div
            className={`bg-g-background-100 overflow-hidden relative shadow-geist-modal flex flex-col
              ${variant === "default"
                ? "mx-4 md:mx-0 md:rounded-[var(--g-radius-md)] px-6 lg:px-[90px] h-[calc(100%-20px)]"
                : variant === "bottom-full"
                  ? "w-full h-[90%] rounded-t-[var(--g-radius-md)] rounded-b-none absolute bottom-0 px-6 lg:px-12"
                  : "w-full h-full absolute bottom-0 px-6 lg:px-12" // bottom-full-no-rounded
              } ${className}`}
            initial={
              isBottomDrawer
                ? { transform: "translateY(100%)" }
                : { opacity: 0, transform: "scale(0.98)" }
            }
            animate={
              isBottomDrawer
                ? { transform: "translateY(0%)" }
                : { opacity: 1, transform: "scale(1)" }
            }
            exit={
              isBottomDrawer
                ? { transform: "translateY(100%)" }
                : { opacity: 0, transform: "scale(0.98)" }
            }
            transition={{ duration: GEIST_DURATION, ease: GEIST_EASE }}
          >
            <button
              onClick={onClose}
              className="absolute cursor-pointer top-5 lg:top-10 right-10 text-g-gray-700 hover:text-g-blue-700 focus-ring-geist rounded-[var(--g-radius-sm)]"
            >
              <RxCross2 className="w-6 h-6 text-g-gray-700 hover:text-g-blue-700" />
            </button>
            {/* {title && ( */}
            <h2
              className={`text-heading-24 text-g-gray-1000 lg:pt-8 pt-5 mb-6 ${variant === "default" ? "" : "w-[800px] mx-auto"
                }`}
            >
              {title}
            </h2>
            {/* )} */}
            <div className="flex-1 overflow-y-auto flex justify-center">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CustomModal;
