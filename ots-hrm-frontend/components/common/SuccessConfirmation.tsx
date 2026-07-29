"use client";

import Image from "next/image";
import React from "react";
import SuccessIcon from "../../public/SuccessIcon.svg";
import SuccessImage from "../../public/SuccessImage.svg";
import { RxCross2 } from "react-icons/rx";
import Group2 from "../../public/Group 2.png";
import Group3 from "../../public/Group 3.png";

interface SuccessConfirmationProps {
  isOpen?: boolean;
  onClose?: () => void;
  title?: string;
  message?: string;
  variant?: "default" | "fullscreen";
}

const SuccessConfirmation: React.FC<SuccessConfirmationProps> = ({
  isOpen,
  onClose,
  title = "Success!",
  message = "Great! A new company, Stellaria Solutions, has been added to your list. Feel free to customize it!",
  variant = "default",
}) => {
  if (!isOpen) return null;

  const isFullScreen = variant === "fullscreen";

  return (
    <div
      className={`fixed inset-0 bg-[var(--g-overlay)] z-[999] flex ${isFullScreen
        ? "items-end justify-center"
        : "items-center justify-center"
        }`}
      onClick={onClose} // click background to close
    >
      <div
        onClick={(e) => e.stopPropagation()} // prevent close when clicking inside
        className={`relative bg-g-background-100 overflow-hidden shadow-geist-modal transition-all duration-300 ${isFullScreen
          ? "w-full h-[90%] rounded-t-[var(--g-radius-md)] flex flex-col items-center justify-center m-0 p-0"
          : "rounded-[var(--g-radius-md)] w-[375px] sm:w-[404px] lg:w-[484px] p-0"
          }`}
      >
        {/* ✅ Close Button */}
        <div
          className={`absolute z-[1001] ${isFullScreen ? "top-6 right-8" : "top-[10px] right-4"
            }`}
        >
          <button onClick={onClose} className="transition focus-ring-geist rounded-[var(--g-radius-sm)]">
            <RxCross2
              className={`cursor-pointer ${isFullScreen ? "w-8 h-8" : "w-6 h-6"
                } text-g-gray-700 hover:text-g-blue-700`}
            />
          </button>
        </div>

        {/* ✅ Fullscreen background images */}
        {isFullScreen && (
          <>
            <div className="absolute top-0 left-[25%] w-full z-0">
              <Image
                src={Group2}
                alt="Top decoration"
                className=" object-cover"
                priority
              />
            </div>
            <div className="absolute bottom-0 left-[20%] w-full z-0">
              <Image
                src={Group3}
                alt="Bottom decoration"
                className=" object-cover"
                priority
              />
            </div>
            <div className="absolute bottom-0 left-[60%] w-full z-0">
              <Image
                src={Group3}
                alt="Bottom decoration"
                className="w-[151px] object-cover"
                priority
              />
            </div>
          </>
        )}

        {/* ✅ Content */}
        <div
          className={`flex flex-col items-center text-center relative z-[10] ${isFullScreen ? "max-w-lg mx-auto px-6" : "px-6 pt-8"
            }`}
        >
          <Image
            src={SuccessIcon}
            alt="Success icon"
            width={isFullScreen ? 100 : 64}
            height={isFullScreen ? 100 : 64}
            className="text-red-400"
          />
          <h2
            className={`text-g-gray-1000 mt-6 ${isFullScreen ? "text-heading-24" : "text-heading-20"
              }`}
          >
            {title}
          </h2>
          <p
            className={`text-g-gray-800 mt-2 ${isFullScreen ? "text-copy-16" : "text-copy-14"
              }`}
          >
            {message}
          </p>
        </div>

        {/* ✅ Bottom Success Image */}
        <div className="flex justify-center mt-6 relative z-[10]">
          <Image
            src={SuccessImage}
            alt="Success image"
            className={`${isFullScreen ? "w-1/3 max-w-sm" : ""}`}
          />
        </div>
      </div>
    </div>
  );
};

export default SuccessConfirmation;
