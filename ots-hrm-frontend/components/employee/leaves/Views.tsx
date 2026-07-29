// In src/components/Views.tsx
import React from "react";
import { MdCheckCircle, MdCancel, MdInfo } from "react-icons/md";
import { Vocation } from "@/utils/company";

interface ClockedOutCardProps {
  leave: Vocation;
}

const ClockedOutCard: React.FC<ClockedOutCardProps> = ({ leave }) => {
  // Safely access department name with fallback
  const departmentName = leave.leaveType?.department?.name || "N/A";

  const statusColorClass =
    leave.status === "APPROVED"
      ? "text-g-green-800 bg-g-green-100"
      : leave.status === "PENDING"
      ? "text-g-amber-800 bg-g-amber-100"
      : "text-g-red-800 bg-g-red-100";

  const StatusIcon =
    leave.status === "APPROVED"
      ? MdCheckCircle
      : leave.status === "PENDING"
      ? MdInfo
      : MdCancel;

  const formatDateRange = () => {
    if (!leave.fromDate || !leave.toDate) return "N/A";
    const start = new Date(leave.fromDate).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });
    const end = new Date(leave.toDate).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });
    return `${start} - ${end}`;
  };

  const formatActionDate = () => {
    if (!leave.actionAt) return "N/A";
    return new Date(leave.actionAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });
  };

  return (
    <div className="max-w-[728px] w-full">
      <div className="mlg:col-span-3 bg-g-background-100 rounded-[var(--g-radius-md)] overflow-hidden border-[1px] border-g-gray-alpha-400 shadow-geist-card">
        <div className="flex items-center justify-between border-b-[1px] border-(--genrel-light-stroke) p-4 lg:p-6">
          <h2 className="text-heading-20 text-g-gray-1000">
            {leave.leaveType.name}
          </h2>
          <span
            className={`px-2 py-1 rounded-[var(--g-radius-sm)] text-xs font-medium ${statusColorClass} flex items-center gap-1`}
          >
            <StatusIcon className="w-4 h-4" />
            {leave.status}
          </span>
        </div>
        <div className="p-4 lg:p-5 flex items-center">
          <img
            className="w-12 h-12 rounded-full mr-4"
            src={leave.requestedByUser.pictureUrl || "https://placehold.co/600"}
            alt={`${leave.requestedByUser.firstName} ${leave.requestedByUser.lastName}`}
          />
          <div>
            <p className="text-g-gray-1000 text-sm font-medium">
              {`${leave.requestedByUser.firstName} ${leave.requestedByUser.lastName}`}
            </p>
            <p className="text-(--genrel-text-light) text-sm font-normal">
              {leave.requestedByUser.userName}
            </p>
          </div>
          <p className="text-(--general-extra-light) text-xs font-medium ml-auto">
            {leave.createdAt
              ? new Date(leave.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "2-digit",
                })
              : "Submitted Yesterday"}
          </p>
        </div>
        <div className="p-4 lg:p-6 flex gap-6">
          <div className="flex flex-col gap-6">
            <p className="text-(--general-extra-light) text-base font-medium">
              Department
            </p>
            <p className="text-(--general-extra-light) text-base font-medium">
              Duration
            </p>
            <p className="text-(--general-extra-light) text-base font-medium">
              Reason
            </p>
          </div>
          <div className="flex flex-col gap-6">
            <div>
              <span className="bg-gray-100 text-g-gray-900 font-medium px-2 py-1 rounded-[var(--g-radius-sm)] text-sm">
                {departmentName} {/* Use safe departmentName */}
              </span>
            </div>
            <p className="text-(--genrel-text-light) text-base font-medium">
              {formatDateRange()}
            </p>
            <p className="text-(--genrel-text-light) text-base font-medium">
              {leave.reason || "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClockedOutCard;
