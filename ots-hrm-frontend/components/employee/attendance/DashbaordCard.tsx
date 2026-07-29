"use client";
import React, { useState } from "react";
import { CircleAlert } from "lucide-react";
import { IoCheckmarkSharp, IoGiftOutline } from "react-icons/io5";
import { PiFootball, PiReceipt, PiReceiptLight } from "react-icons/pi";
import { IoMdFingerPrint } from "react-icons/io";
import { MdCalendarToday } from "react-icons/md";
import { IconType } from "react-icons"; // ✅ import IconType
import { LuCalendar } from "react-icons/lu";
import { GoPerson } from "react-icons/go";

interface CardData {
  name: string;
  tooltip: string;
  icon: IconType; // ✅ changed from StaticImageData → IconType
  value: number;
  percentage: string;
}

const DashboardCards: React.FC = () => {
  const data: CardData[] = [
    {
      name: "Leave Balance",
      tooltip: "Total Leave Balance",
      icon: IoCheckmarkSharp,
      value: 10,
      percentage: "+9.01%",
    },
    {
      name: "Net Salary",
      tooltip: "Employee Net Salary",
      icon: PiReceipt,
      value: 10,
      percentage: "+9.01%",
    },
    {
      name: "Leave/ Absent",
      tooltip: "Employee Leave/ Absent",
      icon: PiFootball,
      value: 10 / 1,
      percentage: "+9.01%",
    },
    {
      name: "Active Benefits",
      tooltip: "Total Benefits",
      icon: GoPerson,
      value: 10,
      percentage: "+9.01%",
    },
  ];

  return (
    <div className="grid  sm:grid-cols-2 gap-5">
      {data.map((card, index) => {
        const [showTooltip, setShowTooltip] = useState(false);
        const isPresentCard = card.name === "Leave Balanc";
        const Icon = card.icon; // ✅ assign icon to variable for usage

        return (
          <div
            key={index}
            className={`rounded-[var(--g-radius-lg)] border-[1px] border-g-gray-alpha-400 p-6 flex justify-between shadow-geist-card ${isPresentCard
              ? "bg-g-gray-900 text-white"
              : "bg-g-background-100 text-g-gray-900"
              }`}
          >
            <div>
              <h3
                className={`text-label-16 flex items-center gap-2 relative ${isPresentCard ? "text-white" : "text-g-gray-900"
                  }`}
              >
                {card.name}
                <div
                  className="relative"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  <CircleAlert
                    className={`w-4 h-4 cursor-pointer ${isPresentCard ? "text-white" : "text-g-gray-900"
                      }`}
                  />
                  {showTooltip && (
                    <div className="absolute z-10 left-1/2 transform -translate-x-1/2 bottom-full mb-2">
                      <div className="bg-g-gray-1000 rounded-[var(--g-radius-sm)] px-3 py-2 shadow-geist-menu">
                        <p className="text-white text-label-12 whitespace-nowrap">
                          {card.tooltip}
                        </p>
                      </div>
                      <div className="absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-g-gray-1000"></div>
                    </div>
                  )}
                </div>
              </h3>
              <p
                className={`lg:text-[48px] sm:text-[32px] text-3xl pt-6 font-semibold ${isPresentCard ? "text-white" : "text-g-gray-1000"
                  }`}
              >
                {card.value}
              </p>
            </div>

            <div
              className={`w-[44px] h-[44px] rounded-full flex justify-center items-center ${isPresentCard ? "bg-g-gray-800" : "bg-g-blue-100"
                }`}
            >
              <Icon
                className={
                  isPresentCard
                    ? "text-white h-[26px] w-[26px]"
                    : "text-g-gray-900 h-[26px] w-[26px]"
                }
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardCards;
