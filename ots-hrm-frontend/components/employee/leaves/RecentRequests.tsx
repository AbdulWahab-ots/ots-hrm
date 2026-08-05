// In src/components/RecentRequests.tsx
"use client";

import Button from "@/components/common/Button";
import { Plus } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { IoSettingsOutline } from "react-icons/io5";
import CreateLeaveRequest from "./add";
import CustomModal from "@/components/common/CustomModal";
import SuccessConfirmation from "@/components/common/SuccessConfirmation";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import {
  createLeaveRequestAPI,
  getAllVacationsAPI,
} from "@/services/employeeService";
import { triggerLeaveRefresh } from "@/store/features/global/globalSlice";
import Calendar from "../dashboard/components/Calendar";
import { PiReceiptBold } from "react-icons/pi";
import QuickActions from "./QuickActions";
import { format } from "date-fns";

interface RequestCardProps {
  title: string;
  dateRange: string;
  status: "approved" | "rejected" | "pending"; // Add "pending" to status
}

const RequestCard: React.FC<RequestCardProps> = ({
  title,
  dateRange,
  status,
}) => {
  return (
    <div className="flex items-center justify-between w-full rounded-[var(--g-radius-md)] bg-g-gray-alpha-100 px-4 py-2">
      <div className="flex flex-col">
        <span className="text-base font-semibold mb-1 text-g-gray-900">
          {title}
        </span>
        <span className="font-medium text-g-gray-800 text-sm">{dateRange}</span>
      </div>
      <span
        className={`h-2 w-2 rounded-full ${status === "approved"
          ? "bg-g-green-700"
          : status === "rejected"
            ? "bg-g-red-700"
            : "bg-g-amber-700" // Add color for pending (e.g., orange)
          }`}
      />
    </div>
  );
};


// Vacation.status values ("PENDING"/"APPROVED"/"REJECTED"/"CANCELLED") -> the card's
// lowercase status prop. Anything else (e.g. CANCELLED) falls back to "pending" styling
// rather than crashing on an unrecognized value.
const toCardStatus = (status: string): RequestCardProps["status"] => {
  const lower = status?.toLowerCase();
  return lower === "approved" || lower === "rejected" ? lower : "pending";
};

const RecentRequests = () => {
  const dispatch = useDispatch<AppDispatch>();
  const refreshLeaves = useSelector(
    (state: RootState) => state.global.refreshLeaves
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [requests, setRequests] = useState<RequestCardProps[]>([]);

  const loadRecentRequests = useCallback(async () => {
    const response = await getAllVacationsAPI(dispatch, {
      pagedListRequest: { pageNo: 1, pageSize: 2, getAllRecords: false },
      queryOptionsRequest: {
        filtersRequest: [
          { field: "requestType", operator: 1, matchMode: 1, value: "LEAVE" },
        ],
        sortRequest: [{ field: "createdAt", direction: 1, priority: 1 }],
        includes: ["leaveType"],
      },
    });

    const recent = (response?.result?.data ?? []).map((vacation: any) => ({
      title: vacation.leaveType?.name || "Leave",
      dateRange:
        vacation.fromDate === vacation.toDate
          ? format(new Date(vacation.fromDate), "MM/dd/yyyy")
          : `${format(new Date(vacation.fromDate), "MM/dd/yyyy")} to ${format(new Date(vacation.toDate), "MM/dd/yyyy")}`,
      status: toCardStatus(vacation.status),
    }));

    setRequests(recent);
  }, [dispatch]);

  useEffect(() => {
    loadRecentRequests();
  }, [loadRecentRequests, refreshLeaves]);

  const handleApplyLeave = () => {
    setIsModalOpen(true);
  };

  const handleCreateLeaveRequest = async (
    values: {
      fromDate: string;
      toDate: string;
      reason: string;
      typeId: string;
      requestType: string;
    },
    formikHelpers: any
  ) => {
    try {
      const success = await createLeaveRequestAPI(dispatch, values);
      if (success) {
        console.log(success, "success");
        setSuccessMessage("Leave request submitted successfully!");
        setIsSuccessModalOpen(true);
        setIsModalOpen(false);
        // Triggers this component's own refetch (via the refreshLeaves effect above)
        // as well as VocationTable's, so both show the real saved record.
        dispatch(triggerLeaveRefresh());
      } else {
        throw new Error("API returned false");
      }
    } catch (error: any) {
      console.error("Operation failed:", error);
      formikHelpers.setStatus(
        error?.response?.data?.message ||
        "An unexpected error occurred. Please try again."
      );
    }
  };

  return (
    <div className="lg:col-span-2 flex flex-col gap-5">
      <QuickActions
        onApplyLeave={handleApplyLeave}
        onViewCalendar={() => setIsCalendarOpen(true)}
        ondashboard={false}
      />
      <div
        className="rounded-[var(--g-radius-md)] border bg-g-background-100 border-g-gray-alpha-400 shadow-geist-card p-6 flex flex-col gap-6 overflow-hidden"
      >
        <h2 className="text-heading-20 text-g-gray-900">
          Recent Requests
        </h2>
        <div className="flex gap-2">
          {requests.map((req, idx) => (
            <RequestCard
              key={idx}
              title={req.title}
              dateRange={req.dateRange}
              status={req.status}
            />
          ))}
        </div>
      </div>
      <CustomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Apply for Leave"
        variant="bottom-full"
      >
        <CreateLeaveRequest
          onSubmit={handleCreateLeaveRequest}
          onCancel={() => setIsModalOpen(false)}
        />
      </CustomModal>
      <SuccessConfirmation
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="Success!"
        message={successMessage}
      />
      <CustomModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        title="Calendar"
        variant="bottom-full"
      >
        <Calendar />
      </CustomModal>
    </div>
  );
};

export default RecentRequests;
