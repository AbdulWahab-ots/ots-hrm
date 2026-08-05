"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { fetchLeaveBalance } from "@/services/employeeService";

import Casual from "../../../public/Casual-Icon.svg";
import Annual from "../../../public/Annual-icon.svg";
import Sick from "../../../public/Sick-Icon.svg";

interface LeaveBalance {
  leaveTypeId: string;
  leaveTypeName: string;
  totalLeaves: number;
  usedLeaves: number;
  remainingLeaves: number;
}

interface LeaveCardProps {
  title: string;
  count: number;
  icon: any;
  bgColor?: string;
}

// Leave types are freeform, company-configured names (no fixed icon per type in the
// backend) - pick a representative icon by matching common naming, falling back to a
// generic one so a newly configured type still renders something reasonable.
const iconForLeaveType = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("casual")) return Casual;
  if (lower.includes("sick")) return Sick;
  if (lower.includes("annual")) return Annual;
  return Casual;
};

const LeaveCard: React.FC<LeaveCardProps> = ({
  title,
  count,
  icon,
  bgColor,
}) => {
  const isPrimary = bgColor === "#F97066"; // first card special style

  return (
    <div
      className={`flex flex-col rounded-[var(--g-radius-md)] border shadow-geist-card ${isPrimary ? "bg-g-red-700 border-g-red-700" : "bg-g-background-100 border-g-gray-alpha-400"
        }`}
      style={{
        height: "",
        padding: "24px",
      }}
    >
      {/* Title */}
      <div
        className={`text-[16px] font-medium leading-6 tracking-[-0.02em] ${isPrimary ? "text-white" : "text-g-gray-900"
          }`}
      >
        {title}
      </div>

      {/* Icon (center vertically) */}
      <div className="flex flex-1 items-center justify-center">
        <Image src={icon} alt={title} width={120} height={120} />
      </div>

      {/* Count & Left text (bottom-left) */}
      <div className="flex items-center  gap-2">
        <span
          className={`font-semibold text-[60px] leading-[72px] ${isPrimary ? "text-white" : "text-g-gray-1000"
            }`}
        >
          {count}
        </span>
        <span
          className={`${isPrimary ? "text-white" : "text-g-gray-800"
            } text-base font-medium`}
        >
          Left
        </span>
      </div>
    </div>
  );
};

const LeavesOverviews = () => {
  const dispatch = useDispatch<AppDispatch>();
  const refreshLeaves = useSelector(
    (state: RootState) => state.global.refreshLeaves
  );
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaveBalance(dispatch).then((response) => {
      setBalances(response?.result?.leaveBalances ?? []);
      setIsLoading(false);
    });
    // Refetch whenever a leave request is submitted elsewhere on this page
    // (RecentRequests/CreateLeaveRequest dispatch triggerLeaveRefresh()), so the
    // remaining-days count reflects the new PENDING/APPROVED request immediately.
  }, [dispatch, refreshLeaves]);

  if (isLoading) {
    return (
      <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-[200px] rounded-[var(--g-radius-md)] border border-g-gray-alpha-400 bg-g-gray-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {balances.map((balance, idx) => (
        <LeaveCard
          key={balance.leaveTypeId}
          title={balance.leaveTypeName}
          count={balance.remainingLeaves}
          icon={iconForLeaveType(balance.leaveTypeName)}
          bgColor={idx === 0 ? "#F97066" : "#FFFFFF"}
        />
      ))}
    </div>
  );
};

export default LeavesOverviews;
