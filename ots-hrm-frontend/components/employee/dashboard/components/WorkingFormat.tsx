"use client";

import React from "react";

type WorkingFormatProps = {
  onSite: number; // percentage
  remote: number; // percentage
};

const WorkingFormatCard: React.FC<WorkingFormatProps> = ({
  onSite,
  remote,
}) => {
  // Ensure min height so small values still visible
  const minHeight = 80; // px
  const maxHeight = 220; // px

  const getHeight = (value: number) => {
    return (value / 100) * (maxHeight - minHeight) + minHeight;
  };

  return (
    <div className="xl:col-span-3">
      <div className="  rounded-3xl border-[1px] border-g-gray-alpha-400 p-6 bg-g-background-100">
        <h2 className="text-[20px] font-medium text-gray-700 mb-6">
          Working Format
        </h2>
        <div className="flex gap-6 items-end justify-center h-[250px]">
          {/* On Site Card */}
          <div className="flex-1">
            <div
              className="rounded-t-2xl rounded-b-[4px] border-[1px] border-[#597BE84D] bg-[#12B76A] pl-6 py-4 flex flex-col items-start justify-end"
              style={{ height: getHeight(onSite) }}
            >
              <span className="text-[#F2F7FA] text-[48px] font-normal">
                {onSite}%
              </span>
              <span className="text-base text-[#F2F7FA] ">On Site</span>
            </div>
            <div className="w-full mt-1 h-1 rounded-full bg-[#12B76A] "></div>
          </div>

          {/* Remote Card */}
          <div className="flex-1 ">
            <div
              className="rounded-t-2xl rounded-b-[4px] border-[1px] border-[#597BE84D] bg-[#597BE8BF] py-4 flex flex-col items-start pl-6 justify-end "
              style={{ height: getHeight(remote) }}
            >
              <span className="text-[#F2F7FA] text-[48px] font-normal">
                {remote}%
              </span>
              <span className="text-base text-[#F2F7FA] ">Remote</span>
            </div>
            <div className="w-full mt-1 h-1 rounded-full bg-[#597BE8BF]"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkingFormatCard;
