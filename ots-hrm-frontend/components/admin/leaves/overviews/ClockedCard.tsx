import React from "react";
import Button from "@/components/common/Button";
import { MdCheckCircle, MdCancel, MdInfo } from "react-icons/md";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import {
  approveVocationRequest,
  rejectVocationRequest,
} from "@/services/adminServices";
// import { toast } from "react-toastify"; // Assuming react-toastify for notifications

interface Employee {
  id?: string;
  name: string;
  designation: string;
  profileUrl?: string;
}

interface Department {
  id: string;
  name: string;
}

interface Leave {
  id: string;
  employee: Employee;
  department: Department;
  leaveType: "Casual Leave" | "Annual Leave" | "Sick Leave" | "Work From Home";
  startDate: string | null;
  endDate: string | null;
  status: "Approved" | "PENDING" | "Rejected";
  reason: string | null;
  submittedDate?: string;
  totalLeaves?: number;
  balance?: number;
}

interface ClockedOutCardProps {
  leave: Leave;
  viewType: "requests" | "history";
  onStatusChange?: () => void; // Callback to refresh data after status change
}

const ClockedOutCard: React.FC<ClockedOutCardProps> = ({
  leave,
  viewType,
  onStatusChange,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const statusColorClass =
    leave.status === "Approved"
      ? "text-g-green-800 bg-g-green-100"
      : leave.status === "PENDING"
        ? "text-g-amber-800 bg-g-amber-100"
        : "text-g-red-800 bg-g-red-100";

  const StatusIcon =
    leave.status === "Approved"
      ? MdCheckCircle
      : leave.status === "PENDING"
        ? MdInfo
        : MdCancel;

  const formatDateRange = () => {
    if (!leave.startDate || !leave.endDate) return "N/A";
    const start = new Date(leave.startDate).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });
    const end = new Date(leave.endDate).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });
    return `${start} - ${end}`;
  };

  const handleApprove = async () => {
    try {
      const result = await approveVocationRequest(dispatch, leave.id, {
        status: "APPROVED",
      });
      if (result.success) {
        // toast.success("Leave request approved successfully");
        if (onStatusChange) onStatusChange(); // Trigger data refresh
      } else {
        // toast.error(result.error || "Failed to approve leave request");
      }
    } catch (error) {
      // toast.error("An unexpected error occurred while approving the request");
    }
  };

  const handleReject = async () => {
    const reason = window.prompt("Please provide a reason for rejection:");
    if (reason) {
      try {
        const result = await rejectVocationRequest(dispatch, leave.id, {
          status: "REJECTED",
          rejectionReason: reason,
        });
        if (result.success) {
          // toast.success("Leave request rejected successfully");
          if (onStatusChange) onStatusChange(); // Trigger data refresh
        } else {
          // toast.error(result.error || "Failed to reject leave request");
        }
      } catch (error) {
        // toast.error("An unexpected error occurred while rejecting the request");
      }
    } else if (reason === "") {
      // toast.error("Rejection reason cannot be empty");
    }
  };

  return (
    <div className="lg:col-span-3 bg-g-background-100 rounded-[var(--g-radius-md)] overflow-hidden border-[1px] border-g-gray-alpha-400 shadow-geist-card">
      <div className="flex items-center justify-between border-b-[1px] border-(--genrel-light-stroke) p-4 lg:p-6">
        <h2 className="text-heading-20 text-g-gray-1000">
          {leave.leaveType}
        </h2>
        {viewType === "requests" ? (
          <div className="flex space-x-2">
            <Button variant="outline" label="Approve" onClick={handleApprove} />
            <button
              className="bg-(--error-100) border-[1px] border-(--error-50) text-(--error-500) py-3 px-4 font-bold rounded-[var(--g-radius-sm)] text-sm cursor-pointer"
              onClick={handleReject}
            >
              ✕
            </button>
          </div>
        ) : (
          <span
            className={`px-2 py-1 rounded-[var(--g-radius-sm)] text-xs font-medium ${statusColorClass} flex items-center gap-1`}
          >
            <StatusIcon className="w-4 h-4" />
            {leave.status}
          </span>
        )}
      </div>
      <div className="p-4 lg:p-5 flex items-center">
        <img
          className="w-10 h-10 rounded-full mr-4"
          src={leave.employee.profileUrl || "https://placehold.co/600"}
          alt={leave.employee.name}
        />
        <div>
          <p className="text-g-gray-1000 text-sm font-medium">
            {leave.employee.name}
          </p>
          <p className="text-(--genrel-text-light) text-sm font-normal">
            {leave.employee.designation}
          </p>
        </div>
        <p className="text-(--general-extra-light) text-xs font-medium ml-auto">
          {leave.submittedDate || "Submitted Yesterday"}
        </p>
      </div>
      <div className="p-4 lg:p-6 flex gap-6">
        <div className="flex flex-col gap-6">
          <p className="text-(--general-extra-light) text-base font-medium">
            Department
          </p>
          <p className="text-(--general-extra-light) text-base font-medium">
            Leave Type
          </p>
          <p className="text-(--general-extra-light) text-base font-medium">
            Duration
          </p>
          <p className="text-(--general-extra-light) text-base font-medium">
            Days
          </p>
          <p className="text-(--general-extra-light) text-base font-medium">
            Reason
          </p>
        </div>
        <div className="flex flex-col gap-6">
          <div>
            <span className="bg-gray-100 text-g-gray-900 font-medium px-2 py-1 rounded-[var(--g-radius-sm)] text-sm">
              {leave.department.name}
            </span>
          </div>
          <p className="text-(--genrel-text-light) text-base font-medium">
            {leave.leaveType}
          </p>
          <p className="text-g-gray-900 text-base font-medium">
            {formatDateRange()}
          </p>
          <p className="text-(--genrel-text-light) text-base font-medium">
            {leave.totalLeaves
              ? leave.totalLeaves - (leave.balance || 0)
              : "N/A"}
          </p>
          <p className="text-(--genrel-text-light) text-base font-medium">
            {leave.reason || "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClockedOutCard;
