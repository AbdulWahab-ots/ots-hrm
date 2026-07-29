// import React from "react";
// import Button from "@/components/common/Button";
// import { MdCheckCircle, MdCancel, MdInfo } from "react-icons/md";

// interface Employee {
//   id?: string;
//   name: string;
//   designation: string;
//   profileUrl?: string;
// }

// interface Department {
//   id: string;
//   name: string;
// }

// interface Attendance {
//   id: string;
//   employee: Employee;
//   department: Department;
//   type: "Check In" | "Check Out";
//   time: string | null;
//   status: "Approved" | "Pending" | "Canceled";
//   reason: string | null;
//   submittedDate?: string;
// }

// interface ClockedOutCardProps {
//   attendance: Attendance;
//   viewType: "requests" | "history";
// }

// const ClockedOutCard: React.FC<ClockedOutCardProps> = ({
//   attendance,
//   viewType,
// }) => {
//   const statusColorClass =
//     attendance.status === "Approved"
//       ? "text-[#12B76A] bg-[#ECFDF3]"
//       : attendance.status === "Pending"
//       ? "text-[#F79009] bg-[#FFFAEB]"
//       : "text-[#B42318] bg-[#FEF3F2]";

//   const StatusIcon =
//     attendance.status === "Approved"
//       ? MdCheckCircle
//       : attendance.status === "Pending"
//       ? MdInfo
//       : MdCancel;

//   const initials = attendance.employee.name
//     ? attendance.employee.name.charAt(0).toUpperCase()
//     : "U";

//   return (
//     <div className="mlg:col-span-3 bg-white rounded-3xl lg:rounded-[32px] shadow-md overflow-hidden border-[1px] border-(--genrel-light-stroke)">
//       <div className="flex items-center justify-between border-b-[1px] border-(--genrel-light-stroke) p-4 lg:p-6">
//         <h2 className="text-[20px] font-medium text-black">
//           {attendance.type}
//         </h2>
//         {viewType === "requests" ? (
//           <div className="flex space-x-2">
//             <Button variant="outline" label="Approve" />
//             <button className="bg-(--error-100) border-[1px] border-(--error-50) text-(--error-500) py-3 px-4 font-bold rounded-2xl text-sm cursor-pointer">
//               ✕
//             </button>
//           </div>
//         ) : (
//           <span
//             className={`px-2 py-1 rounded-full text-xs font-medium ${statusColorClass} flex items-center gap-1`}
//           >
//             <StatusIcon className="w-4 h-4" />
//             {attendance.status}
//           </span>
//         )}
//       </div>
//       <div className="p-4 lg:p-6 flex items-center">
//         {attendance.employee.profileUrl ? (
//           <img
//             className="w-12 h-12 rounded-full mr-4"
//             src={attendance.employee.profileUrl}
//             alt={attendance.employee.name}
//           />
//         ) : (
//           <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium mr-4">
//             {initials}
//           </div>
//         )}
//         <div>
//           <p className="text-[#1C202F] text-sm font-medium">
//             {attendance.employee.name}
//           </p>
//           <p className="text-(--genrel-text-light) text-sm font-normal">
//             {attendance.employee.designation}
//           </p>
//         </div>
//         <p className="text-(--general-extra-light) text-xs font-medium ml-auto">
//           {attendance.submittedDate || "Submitted Yesterday"}
//         </p>
//       </div>
//       <div className="p-4 lg:p-6 flex gap-6">
//         <div className="flex flex-col gap-6">
//           <p className="text-(--general-extra-light) text-base font-medium">
//             Department
//           </p>
//           <p className="text-(--general-extra-light) text-base font-medium">
//             Time
//           </p>
//           <p className="text-(--general-extra-light) text-base font-medium">
//             Reason
//           </p>
//         </div>
//         <div className="flex flex-col gap-6">
//           <div>
//             <span className="bg-gray-100 text-[#414651] font-medium px-2 py-1 rounded-2xl text-sm">
//               {attendance.department.name}
//             </span>
//           </div>
//           <p className="text-(--genrel-text-light) text-base font-medium">
//             {attendance.time || "N/A"}
//           </p>
//           <p className="text-(--general-extra-light) text-base font-medium">
//             {attendance.reason || "N/A"}
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ClockedOutCard;

// import React from "react";
// import Button from "@/components/common/Button";
// import { MdCheckCircle, MdCancel, MdInfo } from "react-icons/md";
// import { useDispatch } from "react-redux";
// import { AppDispatch } from "@/store/store";
// import { approveRequest, rejectRequest } from "@/services/adminServices";

// interface Employee {
//   id?: string;
//   name: string;
//   designation: string;
//   profileUrl?: string;
// }

// interface Department {
//   id: string;
//   name: string;
// }

// interface Attendance {
//   id: string;
//   employee: Employee;
//   department: Department;
//   type: "Check In" | "Check Out";
//   time: string | null;
//   status: "Approved" | "Pending" | "Canceled";
//   reason: string | null;
//   submittedDate?: string;
// }

// interface ClockedOutCardProps {
//   attendance: Attendance;
//   viewType: "requests" | "history";
// }

// const ClockedOutCard: React.FC<ClockedOutCardProps> = ({
//   attendance,
//   viewType,
// }) => {
//   const dispatch = useDispatch<AppDispatch>();

//   const statusColorClass =
//     attendance.status === "Approved"
//       ? "text-[#12B76A] bg-[#ECFDF3]"
//       : attendance.status === "Pending"
//       ? "text-[#F79009] bg-[#FFFAEB]"
//       : "text-[#B42318] bg-[#FEF3F2]";

//   const StatusIcon =
//     attendance.status === "Approved"
//       ? MdCheckCircle
//       : attendance.status === "Pending"
//       ? MdInfo
//       : MdCancel;

//   const initials = attendance.employee.name
//     ? attendance.employee.name.charAt(0).toUpperCase()
//     : "U";

//   const handleApprove = async () => {
//     const reviewNotes = attendance.reason
//       ? `Approved: ${attendance.reason}`
//       : "Request approved after review";
//     const success = await approveRequest(dispatch, attendance.id, reviewNotes);
//     if (success) {
//       // Optionally, trigger a refresh of the data or update the UI
//       console.log("Request approved successfully");
//     }
//   };

//   const handleReject = async () => {
//     const reviewNotes = attendance.reason
//       ? `Rejected: Insufficient reason provided for ${attendance.reason}`
//       : "Insufficient reason provided, request rejected after review";
//     const success = await rejectRequest(dispatch, attendance.id, reviewNotes);
//     if (success) {
//       // Optionally, trigger a refresh of the data or update the UI
//       console.log("Request rejected successfully");
//     }
//   };

//   return (
//     <div className="mlg:col-span-3 bg-white rounded-3xl lg:rounded-[32px] shadow-md overflow-hidden border-[1px] border-(--genrel-light-stroke)">
//       <div className="flex items-center justify-between border-b-[1px] border-(--genrel-light-stroke) p-4 lg:p-6">
//         <h2 className="text-[20px] font-medium text-black">
//           {attendance.type}
//         </h2>
//         {viewType === "requests" ? (
//           <div className="flex space-x-2">
//             <Button variant="outline" label="Approve" onClick={handleApprove} />
//             <button
//               className="bg-(--error-100) border-[1px] border-(--error-50) text-(--error-500) py-3 px-4 font-bold rounded-2xl text-sm cursor-pointer"
//               onClick={handleReject}
//             >
//               ✕
//             </button>
//           </div>
//         ) : (
//           <span
//             className={`px-2 py-1 rounded-full text-xs font-medium ${statusColorClass} flex items-center gap-1`}
//           >
//             <StatusIcon className="w-4 h-4" />
//             {attendance.status}
//           </span>
//         )}
//       </div>
//       <div className="p-4 lg:p-6 flex items-center">
//         {attendance.employee.profileUrl ? (
//           <img
//             className="w-12 h-12 rounded-full mr-4"
//             src={attendance.employee.profileUrl}
//             alt={attendance.employee.name}
//           />
//         ) : (
//           <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium mr-4">
//             {initials}
//           </div>
//         )}
//         <div>
//           <p className="text-[#1C202F] text-sm font-medium">
//             {attendance.employee.name}
//           </p>
//           <p className="text-(--genrel-text-light) text-sm font-normal">
//             {attendance.employee.designation}
//           </p>
//         </div>
//         <p className="text-(--general-extra-light) text-xs font-medium ml-auto">
//           {attendance.submittedDate || "Submitted Yesterday"}
//         </p>
//       </div>
//       <div className="p-4 lg:p-6 flex gap-6">
//         <div className="flex flex-col gap-6">
//           <p className="text-(--general-extra-light) text-base font-medium">
//             Department
//           </p>
//           <p className="text-(--general-extra-light) text-base font-medium">
//             Time
//           </p>
//           <p className="text-(--general-extra-light) text-base font-medium">
//             Reason
//           </p>
//         </div>
//         <div className="flex flex-col gap-6">
//           <div>
//             <span className="bg-gray-100 text-[#414651] font-medium px-2 py-1 rounded-2xl text-sm">
//               {attendance.department.name}
//             </span>
//           </div>
//           <p className="text-(--genrel-text-light) text-base font-medium">
//             {attendance.time || "N/A"}
//           </p>
//           <p className="text-(--general-extra-light) text-base font-medium">
//             {attendance.reason || "N/A"}
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ClockedOutCard;

import React, { useState } from "react";
import Button from "@/components/common/Button";
import { MdCheckCircle, MdCancel, MdInfo } from "react-icons/md";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { approveRequest, rejectRequest } from "@/services/adminServices";

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

interface Attendance {
  id: string;
  employee: Employee;
  department: Department;
  type: "Check In" | "Check Out";
  time: string | null;
  status: "Approved" | "Pending" | "Canceled";
  reason: string | null;
  submittedDate?: string;
}

interface ClockedOutCardProps {
  attendance: Attendance;
  viewType: "requests" | "history";
  onActionComplete?: (status: "Approved" | "Canceled") => void;
}

const ClockedOutCard: React.FC<ClockedOutCardProps> = ({
  attendance,
  viewType,
  onActionComplete,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isLoading, setIsLoading] = useState(false);

  const statusColorClass =
    attendance.status === "Approved"
      ? "text-g-green-800 bg-g-green-100"
      : attendance.status === "Pending"
      ? "text-g-amber-800 bg-g-amber-100"
      : "text-g-red-800 bg-g-red-100";

  const StatusIcon =
    attendance.status === "Approved"
      ? MdCheckCircle
      : attendance.status === "Pending"
      ? MdInfo
      : MdCancel;

  const initials = attendance.employee.name
    ? attendance.employee.name.charAt(0).toUpperCase()
    : "U";

  const handleApprove = async () => {
    setIsLoading(true);
    const reviewNotes = attendance.reason
      ? `Approved: ${attendance.reason}`
      : "Request approved after review";
    const result = await approveRequest(dispatch, attendance.id, reviewNotes);
    setIsLoading(false);
    if (result.success) {
      onActionComplete?.("Approved");
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    const reviewNotes = attendance.reason
      ? `Rejected: Insufficient reason provided for ${attendance.reason}`
      : "Insufficient reason provided, request rejected after review";
    const result = await rejectRequest(dispatch, attendance.id, reviewNotes);
    setIsLoading(false);
    if (result.success) {
      onActionComplete?.("Canceled");
    }
  };

  return (
    <div className="mlg:col-span-3 bg-g-background-100 rounded-[var(--g-radius-md)] shadow-geist-card overflow-hidden border border-(--genrel-light-stroke)">
      <div className="flex items-center justify-between border-b-[1px] border-(--genrel-light-stroke) p-4 lg:p-6">
        <h2 className="text-heading-20 text-g-gray-1000">
          {attendance.type}
        </h2>
        {viewType === "requests" ? (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              label="Approve"
              onClick={handleApprove}
              disabled={isLoading}
            />
            <button
              className="bg-g-red-100 border border-g-red-200 text-g-red-700 py-3 px-4 text-button-14 rounded-[var(--g-radius-sm)] cursor-pointer focus-ring-geist"
              onClick={handleReject}
              disabled={isLoading}
            >
              ✕
            </button>
          </div>
        ) : (
          <span
            className={`px-2 py-1 rounded-[var(--g-radius-full)] text-label-12 ${statusColorClass} flex items-center gap-1`}
          >
            <StatusIcon className="w-4 h-4" />
            {attendance.status}
          </span>
        )}
      </div>
      <div className="p-4 lg:p-6 flex items-center">
        {attendance.employee.profileUrl ? (
          <img
            className="w-12 h-12 rounded-full mr-4"
            src={attendance.employee.profileUrl}
            alt={attendance.employee.name}
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium mr-4">
            {initials}
          </div>
        )}
        <div>
          <p className="text-g-gray-1000 text-sm font-medium">
            {attendance.employee.name}
          </p>
          <p className="text-(--genrel-text-light) text-copy-14">
            {attendance.employee.designation}
          </p>
        </div>
        <p className="text-(--general-extra-light) text-label-12 ml-auto">
          {attendance.submittedDate || "Submitted Yesterday"}
        </p>
      </div>
      <div className="p-4 lg:p-6 flex gap-6">
        <div className="flex flex-col gap-6">
          <p className="text-(--general-extra-light) text-base font-medium">
            Department
          </p>
          <p className="text-(--general-extra-light) text-base font-medium">
            Time
          </p>
          <p className="text-(--general-extra-light) text-base font-medium">
            Reason
          </p>
        </div>
        <div className="flex flex-col gap-6">
          <div>
            <span className="bg-gray-100 text-g-gray-900 font-medium px-2 py-1 rounded-[var(--g-radius-sm)] text-label-13">
              {attendance.department.name}
            </span>
          </div>
          <p className="text-(--genrel-text-light) text-base font-medium">
            {attendance.time || "N/A"}
          </p>
          <p className="text-(--general-extra-light) text-base font-medium">
            {attendance.reason || "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClockedOutCard;
