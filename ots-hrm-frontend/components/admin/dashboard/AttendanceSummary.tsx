"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Check, X } from "lucide-react";

import { GrCheckmark } from "react-icons/gr";
import HeaderWithTooltip from "@/components/common/Typography/HeaderWithTooltip";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { setIsLoading } from "@/store/features/global/globalSlice";
import { getAllVacationsAPI } from "@/services/employeeService";
import { Vocation, GetVacationsPayload } from "@/utils/company";
import {
  approveVocationRequest,
  rejectVocationRequest,
} from "@/services/adminServices";
import Button from "@/components/common/Button";
import { nowBusiness } from "@/utils/timezone";

import { FiExternalLink } from "react-icons/fi";
import { useRouter } from "next/navigation";

interface LeaveApplication {
  id: string;
  firstName: string;
  lastName: string | null;
  userName: string;
  pictureUrl?: string | null; // Updated to allow null
  type: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
}

const AttendanceSummary: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"Pending" | "Approved">("Pending");
  const [visibleCount, setVisibleCount] = useState(4);
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [isLoading, setLocalIsLoading] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  // Format date as YYYY-MM-DD
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Fetch leaves from API for today to tomorrow
  const fetchLeaves = useCallback(
    async (statusFilter: "PENDING" | "APPROVED") => {
      const today = nowBusiness();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1); // Today + 1 day
      const startDate = formatLocalDate(today);
      const endDate = formatLocalDate(tomorrow);

      const payload: GetVacationsPayload = {
        pagedListRequest: {
          pageNo: 1,
          pageSize: 5,
          getAllRecords: false,
        },
        queryOptionsRequest: {
          filtersRequest: [
            {
              field: "status",
              operator: 1,
              matchMode: 1,
              value: statusFilter,
            },
            {
              field: "createdAt",
              operator: 1,
              matchMode: 10,
              rangeValues: {
                start: startDate,
                end: endDate,
              },
            },
          ],
          sortRequest: [
            {
              field: "createdAt",
              direction: -1, // Latest first
              priority: 1,
            },
          ],
          includes: ["leaveType", "requestedByUser"],
        },
      };

      try {
        setLocalIsLoading(true);
        dispatch(setIsLoading(true));
        const response = await getAllVacationsAPI(dispatch, payload);
        if (response && response.result) {
          const fetchedLeaves: LeaveApplication[] = response.result.data.map(
            (leave: Vocation) => ({
              id: leave.id,
              firstName: leave.requestedByUser?.firstName || "Unknown",
              lastName: leave.requestedByUser?.lastName || null,
              userName: leave.requestedByUser?.userName || "UN",
              pictureUrl: leave.requestedByUser?.pictureUrl, // Type matches string | null | undefined
              type: leave.leaveType?.name || "Unknown Leave",
              status: leave.status,
            })
          );
          setLeaves(fetchedLeaves);
        } else {
          console.error("Invalid API response: No result found");
          setLeaves([]);
        }
      } catch (error) {
        console.error("Failed to fetch leaves:", error);
        setLeaves([]);
      } finally {
        setLocalIsLoading(false);
        dispatch(setIsLoading(false));
      }
    },
    [dispatch]
  );

  // Handle approve action
  const handleApprove = async (leaveId: string) => {
    try {
      const result = await approveVocationRequest(dispatch, leaveId, {
        status: "APPROVED",
      });
      if (result.success) {
        fetchLeaves("PENDING"); // Refresh Pending tab data
      } else {
        console.error(result.error || "Failed to approve leave request");
      }
    } catch (error) {
      console.error("An unexpected error occurred while approving the request");
    }
  };

  // Handle reject action
  const handleReject = async (leaveId: string) => {
    const reason = window.prompt("Please provide a reason for rejection:");
    if (reason) {
      try {
        const result = await rejectVocationRequest(dispatch, leaveId, {
          status: "REJECTED",
          rejectionReason: reason,
        });
        if (result.success) {
          fetchLeaves("PENDING"); // Refresh Pending tab data
        } else {
          console.error(result.error || "Failed to reject leave request");
        }
      } catch (error) {
        console.error(
          "An unexpected error occurred while rejecting the request"
        );
      }
    } else if (reason === "") {
      console.error("Rejection reason cannot be empty");
    }
  };

  // Fetch leaves when tab changes
  useEffect(() => {
    const statusFilter = activeTab === "Pending" ? "PENDING" : "APPROVED";
    fetchLeaves(statusFilter);
    setVisibleCount(4); // Reset visible count when tab changes
  }, [activeTab, fetchLeaves]);

  // Filter leaves based on active tab
  const displayedLeaves = leaves.filter((leave) =>
    activeTab === "Pending"
      ? leave.status === "PENDING"
      : leave.status === "APPROVED"
  );

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <div className="space-y-5">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === "Pending" ? (
              <>
                <div className="w-10 h-10 bg-gray-200 rounded-[var(--g-radius-md)] animate-pulse" />
                <div className="w-10 h-10 bg-gray-200 rounded-[var(--g-radius-md)] animate-pulse" />
              </>
            ) : (
              <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse" />
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full xl:col-span-4 bg-g-background-100 p-4 border-[1px] border-g-gray-alpha-400 rounded-[var(--g-radius-md)] shadow-geist-card lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <HeaderWithTooltip
          title="Today Leave Applications"
          tooltipContent="This shows the daily leaves of employees."
          iconSize={14}
          textClassName="text-g-gray-900 text-heading-20"
        />
        <div>
          <Button
            variant="outline"
            icon={FiExternalLink}
            onClick={() => router.push("/admin/leaves")}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 text-sm mt-4 border-b-[1px] border-g-gray-alpha-400">
        {["Pending", "Approved"].map((tab) => (
          <button
            key={tab}
            className={`pb-2  text-sm cursor-pointer font-semibold ${
              activeTab === tab
                ? "border-b-[1px] text-g-gray-900 border-g-blue-700"
                : "text-g-gray-800"
            }`}
            onClick={() => {
              setActiveTab(tab as any);
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Applications List */}
      <div className="mt-4 space-y-5">
        {isLoading ? (
          <SkeletonLoader />
        ) : displayedLeaves.length === 0 ? (
          <p>No leaves found for today.</p>
        ) : (
          displayedLeaves.slice(0, visibleCount).map((leave) => {
            const initials = leave.userName.slice(0, 2).toUpperCase();
            return (
              <div
                key={leave.id}
                className="flex items-center justify-between pb-3"
              >
                {/* Employee Info */}
                <div className="flex items-center gap-3">
                  {leave.pictureUrl ? (
                    <img
                      src={leave.pictureUrl}
                      alt={`${leave.firstName} ${leave.lastName || ""}`}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const nextSibling = e.currentTarget
                          .nextElementSibling as HTMLElement | null;
                        if (nextSibling) {
                          nextSibling.style.display = "flex";
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-medium"
                    style={{ display: leave.pictureUrl ? "none" : "flex" }}
                  >
                    {initials}
                  </div>
                  <div>
                    <p className="font-medium text-base text-g-gray-900">
                      {`${leave.firstName} ${leave.lastName || ""}`}
                    </p>
                    <p className="text-base font-normal text-g-gray-700">
                      {leave.type}
                    </p>
                  </div>
                </div>

                {/* Actions or Badge */}
                <div className="flex items-center gap-2">
                  {activeTab === "Pending" ? (
                    <>
                      <button
                        className="p-4 flex items-center justify-center border-[1px] border-g-green-200 rounded-[var(--g-radius-md)] bg-g-green-100 text-g-green-800 hover:bg-g-green-200 cursor-pointer focus-ring-geist"
                        onClick={() => handleApprove(leave.id)}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        className="p-4 flex items-center justify-center border-[1px] border-g-red-200 rounded-[var(--g-radius-md)] bg-g-red-100 text-g-red-800 hover:bg-g-red-200 cursor-pointer focus-ring-geist"
                        onClick={() => handleReject(leave.id)}
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <span
                      className="px-2 py-[2px] rounded-full text-xs font-medium text-g-green-800 bg-g-green-100 flex items-center gap-1"
                      style={{
                        gap: "4px",
                        opacity: 1,
                        paddingTop: "2px",
                        paddingRight: "8px",
                        paddingBottom: "2px",
                        paddingLeft: "6px",
                        borderRadius: "16px",
                      }}
                    >
                      <GrCheckmark className="w-3 h-3 mb-0.5" />
                      APPROVED
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Load more */}
      {/* {visibleCount < displayedLeaves.length && (
        <div className="flex justify-center mt-2">
          <button onClick={() => setVisibleCount((prev) => prev + 5)}>
            <IoIosArrowDown className="w-6 h-6 text-[#7782AE] cursor-pointer" />
          </button>
        </div>
      )} */}
    </div>
  );
};

export default AttendanceSummary;
