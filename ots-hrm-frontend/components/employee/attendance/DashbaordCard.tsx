"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CircleAlert } from "lucide-react";
import { IoCheckmarkSharp } from "react-icons/io5";
import { PiFootball, PiReceipt } from "react-icons/pi";
import { IconType } from "react-icons"; // ✅ import IconType
import { GoPerson } from "react-icons/go";
import { AppDispatch, RootState } from "@/store/store";
import {
  fetchLeaveBalance,
  fetchOwnAttendanceStats,
} from "@/services/employeeService";
import { fetchPayrolls } from "@/services/payrollService";
import { payrollToRow } from "@/components/admin/paystub/PayrollTable";
import { nowBusiness } from "@/utils/timezone";

interface CardData {
  name: string;
  tooltip: string;
  icon: IconType; // ✅ changed from StaticImageData → IconType
  value: number | string;
}

const DashboardCards: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { profileData } = useSelector((state: RootState) => state.global) as {
    profileData: any;
  };

  const [leaveBalance, setLeaveBalance] = useState<number | null>(null);
  const [netSalary, setNetSalary] = useState<number | null>(null);
  const [leaveAbsentCount, setLeaveAbsentCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchLeaveBalance(dispatch).then((res: any) => {
      if (cancelled) return;
      const balances = res?.result?.leaveBalances ?? [];
      const total = balances.reduce(
        (sum: number, b: any) => sum + (b.remainingLeaves ?? 0),
        0
      );
      setLeaveBalance(total);
    });

    fetchPayrolls(dispatch, { page: 1, pageSize: 100 }).then((res: any) => {
      if (cancelled) return;
      const rows = (res?.result?.data ?? []).map(payrollToRow);
      // Payrolls come back sorted oldest-first (see fetchPayrolls); the last row
      // is the most recent payslip, whatever its approval status.
      const latest = rows[rows.length - 1];
      setNetSalary(latest ? latest.netSalary : 0);
    });

    const currentYear = nowBusiness().getFullYear();
    fetchOwnAttendanceStats(
      dispatch,
      `${currentYear}-01-01`,
      `${currentYear}-12-31`
    ).then((res: any) => {
      if (cancelled) return;
      const stats = res?.result;
      setLeaveAbsentCount(
        stats ? (stats.totalAbsent ?? 0) + (stats.totalOnLeave ?? 0) : 0
      );
    });

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  // Loaded once with the profile (see auth-service.getCurrentProfile, which already
  // joins employee.benefits.benefit) — no separate fetch needed. Only count benefits
  // that are currently in effect (not soft-deleted / not past their end date).
  const activeBenefits: number = (profileData?.result?.employee?.benefits ?? []).filter(
    (b: any) => {
      if (b.active === false) return false;
      if (!b.endDate) return true;
      return new Date(b.endDate) >= nowBusiness();
    }
  ).length;

  const format = (value: number | null, prefix = ""): string =>
    value === null ? "…" : `${prefix}${value.toLocaleString()}`;

  const data: CardData[] = [
    {
      name: "Leave Balance",
      tooltip: "Remaining leave days across all leave types this year",
      icon: IoCheckmarkSharp,
      value: format(leaveBalance),
    },
    {
      name: "Net Salary",
      tooltip: "Net salary from your most recent payslip",
      icon: PiReceipt,
      value: format(netSalary, "PKR "),
    },
    {
      name: "Leave/ Absent",
      tooltip: "Days on leave or marked absent this year",
      icon: PiFootball,
      value: format(leaveAbsentCount),
    },
    {
      name: "Active Benefits",
      tooltip: "Benefits currently assigned to you",
      icon: GoPerson,
      value: activeBenefits,
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
