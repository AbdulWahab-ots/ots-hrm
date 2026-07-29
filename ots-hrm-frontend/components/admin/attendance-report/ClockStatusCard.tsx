import Image from "next/image";
import React from "react";
import Clock from "../../../public/Clock.svg";
import { TbExclamationCircle } from "react-icons/tb";
const ClockStatusCard: React.FC = () => {
  return (
    <div className="lg:col-span-2 bg-g-background-100 rounded-[var(--g-radius-md)] shadow-geist-card overflow-hidden p-4 lg:p-6 border-[1px] border-(--genrel-light-stroke)">
      <div className="flex items-center gap-2">
        <h2 className="text-(--genrel-text-light) text-heading-16">
          Today's Status
        </h2>
        <span className="inline-flex items-center gap-1 px-2.5 border-[1px] border-g-amber-200 py-1 rounded-full text-label-13 font-medium bg-g-amber-100 text-g-amber-800">
          <TbExclamationCircle /> Late
        </span>
      </div>
      <div className="flex justify-center my-6">
        <Image src={Clock} alt="clock image" />
      </div>
      <div className="flex justify-between gap-4">
        <div>
          <p className="lg:text-[30px] text-3xl font-semibold text-(--primary-dark-gray)">
            9:15 AM
          </p>
          <p className="text-(--genrel-text-light) text-label-14">
            Clocked In
          </p>
        </div>
        <div>
          <p className="lg:text-[30px] text-3xl font-semibold text-(--primary-dark-gray)">
            NA
          </p>
          <p className="text-(--genrel-text-light) text-label-14">
            Check Out
          </p>
        </div>
        <div>
          <p className="lg:text-[30px] text-3xl font-semibold text-(--primary-dark-gray)">
            8h 15m
          </p>
          <p className="text-(--genrel-text-light) text-label-14">
            Total Hours
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClockStatusCard;
