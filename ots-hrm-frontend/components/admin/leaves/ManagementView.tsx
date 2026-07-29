// "use client";
// import React, { useState, useEffect, useRef } from "react";
// import { ColumnDef } from "@tanstack/react-table";
// import { TanstackTable } from "@/components/common/TanstackTable";
// import ClockedOutCard from "./overviews/ClockedCard";
// import CustomDropdown from "@/components/common/form/DropDown";

// import { dummyData } from "@/utils/constants";
// import LeavesChart from "./overviews/LeavesChart";

// interface Employee {
//   id?: string;
//   name: string;
//   designation: string;
//   profileUrl?: string;
// }

// interface ManagementViewProps {
//   leaveId: string | number; // Adjust type based on your Vocation.id type (likely string or number)
// }
// interface Department {
//   id: string;
//   name: string;
// }

// export interface Leave {
//   id: string;
//   employee: Employee;
//   department: Department;
//   leaveType: "Casual Leave" | "Annual Leave" | "Sick Leave" | "Work From Home";
//   startDate: string | null;
//   endDate: string | null;
//   status: "Approved" | "Pending" | "Rejected";
//   reason: string | null;
//   submittedDate?: string;
//   totalLeaves?: number;
//   balance?: number;
//   pending: number | undefined;
// }

// const historyColumns: ColumnDef<Leave, any>[] = [
//   {
//     accessorKey: "leaveType",
//     header: "Leave Type",
//     cell: (info) => (
//       <div className="text-gray-500">{info.getValue() || "N/A"}</div>
//     ),
//   },

//   {
//     accessorKey: "balance",
//     header: "Balance",
//     cell: (info) => {
//       const balance = info.getValue() as number;
//       const totalLeaves = info.row.original.totalLeaves as number;
//       // Calculate progress as a percentage of balance out of totalLeaves
//       const progress = totalLeaves > 0 ? (balance / totalLeaves) * 100 : 0;

//       return (
//         <div className="flex flex-col">
//           <div className="flex items-center">
//             <div
//               className="bg-[#F5F5F5] rounded-full h-2.5 mr-2"
//               style={{ width: "150px" }} // Fixed width of 150px
//             >
//               <div
//                 className="bg-(--primary-blue-400) h-2.5 rounded-full"
//                 // style={{ width: `${progress}%` }}
//               ></div>
//             </div>
//           </div>
//           <div className="flex text-xs mt-1 capitalize text-(--tertiary-dark-gray) justify-start">
//             <div className="ml-1">{balance}</div>
//           </div>
//         </div>
//       );
//     },
//   },
//   {
//     accessorKey: "totalLeaves",
//     header: "Total Leaves",
//     cell: (info) => (
//       <div className="text-gray-500">{info.getValue() || "N/A"}</div>
//     ),
//   },
//   {
//     accessorKey: "totalLeaves",
//     header: "Approved",
//     cell: (info) => (
//       <div className="text-gray-500">{info.getValue() || "N/A"}</div>
//     ),
//   },
//   {
//     accessorKey: "pending",
//     header: "Pending",
//     cell: (info) => (
//       <div className="text-gray-500">{info.getValue() || "N/A"}</div>
//     ),
//   },
// ];

// interface ManagementViewProps {
//   leave: Leave;
// }

// const ManagementView: React.FC<ManagementViewProps> = ({ leaveId }) => {
//   console.log(leaveId);
//   const [activeTab, setActiveTab] = useState<"requests" | "history">(
//     "requests"
//   );
//   const [selectedLeaveType, setSelectedLeaveType] = useState<string>(
//     leave.leaveType
//   );
//   const [isAnimating, setIsAnimating] = useState(false);
//   const tabRef = useRef<HTMLDivElement>(null);
//   const containerRef = useRef<HTMLDivElement>(null);

//   const leaveTypeOptions = [
//     { value: "", label: "All" },
//     { value: "Casual Leave", label: "Casual Leave" },
//     { value: "Annual Leave", label: "Annual Leave" },
//     { value: "Sick Leave", label: "Sick Leave" },
//     { value: "Work From Home", label: "Work From Home" },
//   ];

//   const requestData = dummyData.filter(
//     (item) => item.status === "Pending" || item.status === "Rejected"
//   );

//   const historyData = dummyData.filter((item) =>
//     selectedLeaveType ? item.leaveType === selectedLeaveType : true
//   );

//   // Handle tab switch with animation
//   const handleTabSwitch = (tab: "requests" | "history") => {
//     if (tab !== activeTab) {
//       setIsAnimating(true);
//       setActiveTab(tab);
//       setTimeout(() => setIsAnimating(false), 300); // Match animation duration
//     }
//   };

//   return (
//     <div ref={containerRef} className="w-[800px] min-h-full pt-2 pb-12">
//       <LeavesChart />
//       <div className="py-4 transition-all duration-300">
//         <div className="flex gap-4 px-4">
//           <button
//             className={`relative px-4 cursor-pointer py-2 text-sm font-semibold ${
//               activeTab === "requests"
//                 ? "border-b-[1px] border-(--primary-blue-400)"
//                 : "text-[#1C202F] hover:text-gray-600"
//             }`}
//             onClick={() => handleTabSwitch("requests")}
//           >
//             Requests
//           </button>
//           <button
//             className={`relative px-4 cursor-pointer py-2 text-sm font-semibold ${
//               activeTab === "history"
//                 ? "border-b-[1px] border-(--primary-blue-400)"
//                 : "text-[#1C202F] hover:text-gray-600"
//             }`}
//             onClick={() => handleTabSwitch("history")}
//           >
//             Record
//           </button>
//         </div>
//       </div>

//       <div className="grid gap-6 pb-6">
//         {activeTab === "requests" ? (
//           requestData.map((leaveItem) => (
//             <ClockedOutCard
//               key={leaveItem.id}
//               leave={leaveItem}
//               viewType={activeTab}
//             />
//           ))
//         ) : (
//           <div className="border-[1px] bg-g-background-100 py-6 border-g-gray-alpha-400 rounded-3xl">
//             <div className="flex justify-between items-center px-6 mb-6">
//               <h2 className="text-lg text-(--primary-gray-900) font-medium">
//                 Leave Requests
//               </h2>
//               <CustomDropdown
//                 id="leave-type-filter"
//                 name="leaveType"
//                 options={leaveTypeOptions}
//                 value={selectedLeaveType}
//                 onChange={(e) => setSelectedLeaveType(e.target.value)}
//                 placeholder="Filter by Leave Type"
//               />
//             </div>

//             <TanstackTable
//               columns={historyColumns}
//               data={historyData}
//               className=""
//               showCheckboxes={true}
//               isLoading={false}
//               showTdBottomBorder={true}
//             />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ManagementView;

// "use client";

// import React, { useState, useEffect, useRef } from "react";
// import { ColumnDef } from "@tanstack/react-table";
// import { TanstackTable } from "@/components/common/TanstackTable";
// import ClockedOutCard from "./overviews/ClockedCard";
// import CustomDropdown from "@/components/common/form/DropDown";
// import { useDispatch } from "react-redux";
// import { AppDispatch } from "@/store/store";
// import { getAllVacationsAPI } from "@/services/employeeService";
// import { setIsLoading } from "@/store/features/global/globalSlice";
// import { dummyData } from "@/utils/constants";
// import LeavesChart from "./overviews/LeavesChart";
// import {
//   Vocation,
//   GetVacationsPayload,
//   QueryOptionsRequest,
// } from "@/utils/company";

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

// interface Leave {
//   id: string;
//   employee: Employee;
//   department: Department;
//   leaveType: "Casual Leave" | "Annual Leave" | "Sick Leave" | "Work From Home";
//   startDate: string | null;
//   endDate: string | null;
//   status: "Approved" | "Pending" | "Rejected";
//   reason: string | null;
//   submittedDate?: string;
//   totalLeaves?: number;
//   balance?: number;
//   pending: number | undefined;
// }

// interface ManagementViewProps {
//   leaveId: string | number;
// }

// const historyColumns: ColumnDef<Leave, any>[] = [
//   {
//     accessorKey: "leaveType",
//     header: "Leave Type",
//     cell: (info) => (
//       <div className="text-gray-500">{info.getValue() || "N/A"}</div>
//     ),
//   },
//   {
//     accessorKey: "balance",
//     header: "Balance",
//     cell: (info) => {
//       const balance = info.getValue() as number;
//       const totalLeaves = info.row.original.totalLeaves as number;
//       const progress = totalLeaves > 0 ? (balance / totalLeaves) * 100 : 0;

//       return (
//         <div className="flex flex-col">
//           <div className="flex items-center">
//             <div
//               className="bg-[#F5F5F5] rounded-full h-2.5 mr-2"
//               style={{ width: "150px" }}
//             >
//               <div
//                 className="bg-(--primary-blue-400) h-2.5 rounded-full"
//                 style={{ width: `${progress}%` }}
//               ></div>
//             </div>
//           </div>
//           <div className="flex text-xs mt-1 capitalize text-(--tertiary-dark-gray) justify-start">
//             <div className="ml-1">{balance}</div>
//           </div>
//         </div>
//       );
//     },
//   },
//   {
//     accessorKey: "totalLeaves",
//     header: "Total Leaves",
//     cell: (info) => (
//       <div className="text-gray-500">{info.getValue() || "N/A"}</div>
//     ),
//   },
//   {
//     accessorKey: "totalLeaves",
//     header: "Approved",
//     cell: (info) => (
//       <div className="text-gray-500">{info.getValue() || "N/A"}</div>
//     ),
//   },
//   {
//     accessorKey: "pending",
//     header: "Pending",
//     cell: (info) => (
//       <div className="text-gray-500">{info.getValue() || "N/A"}</div>
//     ),
//   },
// ];

// const ManagementView: React.FC<ManagementViewProps> = ({ leaveId }) => {
//   console.log("Selected Leave ID:", leaveId);
//   const [activeTab, setActiveTab] = useState<"requests" | "history">(
//     "requests"
//   );
//   const [selectedLeaveType, setSelectedLeaveType] = useState<string>("");
//   const [isAnimating, setIsAnimating] = useState(false);
//   const [leaveData, setLeaveData] = useState<Leave[]>([]);
//   const tabRef = useRef<HTMLDivElement>(null);
//   const containerRef = useRef<HTMLDivElement>(null);
//   const dispatch = useDispatch<AppDispatch>();

//   const leaveTypeOptions = [
//     { value: "", label: "All" },
//     { value: "Casual Leave", label: "Casual Leave" },
//     { value: "Annual Leave", label: "Annual Leave" },
//     { value: "Sick Leave", label: "Sick Leave" },
//     { value: "Work From Home", label: "Work From Home" },
//   ];

//   const historyData = dummyData.filter((item) =>
//     selectedLeaveType ? item.leaveType === selectedLeaveType : true
//   );

//   // Fetch leave data using getAllVacationsAPI
//   useEffect(() => {
//     const fetchLeaveData = async () => {
//       const payload: GetVacationsPayload = {
//         pagedListRequest: {
//           pageNo: 1,
//           pageSize: 1,
//           getAllRecords: true,
//         },
//         queryOptionsRequest: {
//           filtersRequest: [
//             {
//               field: "createdById",
//               operator: 1,
//               matchMode: 1,
//               value: leaveId.toString(),
//             },
//           ],
//           sortRequest: [
//             {
//               field: "createdAt",
//               direction: 1,
//               priority: 1,
//             },
//           ],
//           includes: ["leaveType", "requestedByUser", "leaveType.department"],
//         },
//       };

//       try {
//         dispatch(setIsLoading(true));
//         const response = await getAllVacationsAPI(dispatch, payload);
//         console.log(response);
//         // if (response && response.result && response.result.data) {
//         //   const apiData = response.result.data.map((vocation: Vocation) => ({
//         //     id: vocation.id,
//         //     employee: {
//         //       id: vocation.requestedByUser.id,
//         //       name: `${vocation.requestedByUser.firstName} ${
//         //         vocation.requestedByUser.lastName || ""
//         //       }`,
//         //       designation: "Employee", // Adjust based on your data if designation is available
//         //       profileUrl:
//         //         vocation.requestedByUser.pictureUrl ||
//         //         "https://placehold.co/600",
//         //     },
//         //     department: {
//         //       id: vocation.leaveType.department.id,
//         //       name: vocation.leaveType.department.name,
//         //     },
//         //     leaveType: vocation.leaveType.name as
//         //       | "Casual Leave"
//         //       | "Annual Leave"
//         //       | "Sick Leave"
//         //       | "Work From Home",
//         //     startDate: vocation.fromDate,
//         //     endDate: vocation.toDate,
//         //     status: vocation.status as "Approved" | "Pending" | "Rejected",
//         //     reason: vocation.reason,
//         //     submittedDate: vocation.createdAt,
//         //     // totalLeaves: vocation.leaveType.maxDaysPerYear || 0, // Adjust based on your data
//         //     // balance: vocation.leaveType.maxDaysPerYear
//         //     //   ? vocation.leaveType.maxDaysPerYear - vocation.totalDays
//         //     //   : 0, // Simplified balance calculation
//         //     pending: vocation.status === "PENDING" ? 1 : 0,
//         //   }));
//         //   setLeaveData(apiData);
//         // } else {
//         //   console.error("Invalid API response: No result found");
//         // }
//       } catch (error) {
//         console.error("Failed to fetch leave data:", error);
//       } finally {
//         dispatch(setIsLoading(false));
//       }
//     };

//     fetchLeaveData();
//   }, [dispatch, leaveId]);

//   // Handle tab switch with animation
//   const handleTabSwitch = (tab: "requests" | "history") => {
//     if (tab !== activeTab) {
//       setIsAnimating(true);
//       setActiveTab(tab);
//       setTimeout(() => setIsAnimating(false), 300); // Match animation duration
//     }
//   };

//   return (
//     <div ref={containerRef} className="w-[800px] min-h-full pt-2 pb-12">
//       <LeavesChart />
//       <div className="py-4 transition-all duration-300">
//         <div className="flex gap-4 px-4">
//           <button
//             className={`relative px-4 cursor-pointer py-2 text-sm font-semibold ${
//               activeTab === "requests"
//                 ? "border-b-[1px] border-(--primary-blue-400)"
//                 : "text-[#1C202F] hover:text-gray-600"
//             }`}
//             onClick={() => handleTabSwitch("requests")}
//           >
//             Requests
//           </button>
//           <button
//             className={`relative px-4 cursor-pointer py-2 text-sm font-semibold ${
//               activeTab === "history"
//                 ? "border-b-[1px] border-(--primary-blue-400)"
//                 : "text-[#1C202F] hover:text-gray-600"
//             }`}
//             onClick={() => handleTabSwitch("history")}
//           >
//             Record
//           </button>
//         </div>
//       </div>

//       <div className="grid gap-6 pb-6">
//         {activeTab === "requests" ? (
//           leaveData.map((leaveItem) => (
//             <ClockedOutCard
//               key={leaveItem.id}
//               leave={leaveItem}
//               viewType={activeTab}
//             />
//           ))
//         ) : (
//           <div className="border-[1px] bg-g-background-100 py-6 border-g-gray-alpha-400 rounded-3xl">
//             <div className="flex justify-between items-center px-6 mb-6">
//               <h2 className="text-lg text-(--primary-gray-900) font-medium">
//                 Leave Requests
//               </h2>
//               <CustomDropdown
//                 id="leave-type-filter"
//                 name="leaveType"
//                 options={leaveTypeOptions}
//                 value={selectedLeaveType}
//                 onChange={(e) => setSelectedLeaveType(e.target.value)}
//                 placeholder="Filter by Leave Type"
//               />
//             </div>

//             <TanstackTable
//               columns={historyColumns}
//               data={historyData}
//               className=""
//               showCheckboxes={true}
//               isLoading={false}
//               showTdBottomBorder={true}
//             />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ManagementView;
"use client";

import React, { useState, useEffect, useRef } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { TanstackTable } from "@/components/common/TanstackTable";
import ClockedOutCard from "./overviews/ClockedCard";
import CustomDropdown from "@/components/common/form/DropDown";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { getAllVacationsAPI } from "@/services/employeeService";
import { setIsLoading } from "@/store/features/global/globalSlice";
import LeavesChart from "./overviews/LeavesChart";
import {
  Vocation,
  GetVacationsPayload,
  QueryOptionsRequest,
} from "@/utils/company";
import SkeletonCard from "@/components/common/SkeletonCard"; // Import SkeletonCard
import Image from "next/image";

export const dummyData: Leave[] = [
  {
    id: "1",
    employee: { name: "John Doe", designation: "Software Engineer" },
    department: { id: "dept1", name: "Engineering" },
    leaveType: "Casual Leave",
    startDate: "2025-01-24",
    endDate: "2025-01-26",
    status: "Approved",
    reason: "Personal reasons",
    submittedDate: "2025-01-20",
    pending: 12,
    totalLeaves: 3,
    balance: 12,
  },
  {
    id: "2",
    employee: { name: "Jane Smith", designation: "Designer" },
    department: { id: "dept2", name: "Design" },
    leaveType: "Sick Leave",
    startDate: "2025-02-10",
    endDate: "2025-02-12",
    status: "PENDING",
    reason: "Medical appointment",
    submittedDate: "2025-02-05",
    totalLeaves: 3,
    pending: 8,
    balance: 5,
  },
  {
    id: "3",
    employee: { name: "Bob Johnson", designation: "Manager" },
    department: { id: "dept3", name: "Management" },
    leaveType: "Annual Leave",
    startDate: "2025-03-15",
    endDate: "2025-03-20",
    status: "Rejected",
    reason: "Vacation",
    submittedDate: "2025-03-10",
    pending: 3,
    totalLeaves: 6,
    balance: 10,
  },
  {
    id: "4",
    employee: { name: "Alice Brown", designation: "Analyst" },
    department: { id: "dept4", name: "Analytics" },
    leaveType: "Work From Home",
    startDate: "2025-04-01",
    endDate: "2025-04-02",
    status: "Approved",
    reason: "Remote work request",
    submittedDate: "2025-03-28",
    totalLeaves: 2,
    pending: 6,
    balance: 8,
  },
];

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
  pending: number | undefined;
}

interface ManagementViewProps {
  leaveId: string | number;
}

const historyColumns: ColumnDef<Leave, any>[] = [
  {
    accessorKey: "leaveType",
    header: "Leave Type",
    cell: (info) => (
      <div className="text-gray-500">{info.getValue() || "N/A"}</div>
    ),
  },
  {
    accessorKey: "balance",
    header: "Balance",
    cell: (info) => {
      const balance = info.getValue() as number;
      const totalLeaves = info.row.original.totalLeaves as number;
      const progress = totalLeaves > 0 ? (balance / totalLeaves) * 100 : 0;

      return (
        <div className="flex flex-col">
          <div className="flex items-center">
            <div
              className="bg-[#F5F5F5] rounded-full h-2.5 mr-2"
              style={{ width: "150px" }}
            >
              <div
                className="bg-(--primary-blue-400) h-2.5 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
          <div className="flex text-xs mt-1 capitalize text-(--tertiary-dark-gray) justify-start">
            <div className="ml-1">{balance}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "totalLeaves",
    header: "Total Leaves",
    cell: (info) => (
      <div className="text-gray-500">{info.getValue() || "N/A"}</div>
    ),
  },
  {
    accessorKey: "totalLeaves",
    header: "Approved",
    cell: (info) => (
      <div className="text-gray-500">{info.getValue() || "N/A"}</div>
    ),
  },
  {
    accessorKey: "pending",
    header: "Pending",
    cell: (info) => (
      <div className="text-gray-500">{info.getValue() || "N/A"}</div>
    ),
  },
];

const ManagementView: React.FC<ManagementViewProps> = ({ leaveId }) => {
  console.log("Selected Leave ID:", leaveId);
  const [activeTab, setActiveTab] = useState<"requests" | "history">(
    "requests"
  );
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [leaveData, setLeaveData] = useState<Leave[]>([]);
  const tabRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch<AppDispatch>();
  // Access isLoading from Redux store
  const [isLoading, setLocalIsLoading] = useState(false);
  console.log(leaveData, "leaveData");

  const leaveTypeOptions = [
    { value: "", label: "All" },
    { value: "Casual Leave", label: "Casual Leave" },
    { value: "Annual Leave", label: "Annual Leave" },
    { value: "Sick Leave", label: "Sick Leave" },
    { value: "Work From Home", label: "Work From Home" },
  ];

  const historyData = leaveData.filter((item) =>
    selectedLeaveType ? item.leaveType === selectedLeaveType : true
  );

  // Map API leave type to Leave interface leaveType
  const mapLeaveType = (apiType: string): Leave["leaveType"] => {
    switch (apiType) {
      case "Annual":
        return "Annual Leave";
      case "Casual":
        return "Casual Leave";
      case "Sick":
        return "Sick Leave";
      case "Work From Home":
        return "Work From Home";
      default:
        return "Annual Leave"; // Fallback
    }
  };

  // Handler to fetch or refresh leave data
  const fetchLeaveData = async () => {
    const payload: GetVacationsPayload = {
      pagedListRequest: {
        pageNo: 1,
        pageSize: 1,
        getAllRecords: true,
      },
      queryOptionsRequest: {
        filtersRequest: [
          {
            field: "createdById",
            operator: 1,
            matchMode: 1,
            value: leaveId.toString(),
          },
        ],
        sortRequest: [
          {
            field: "createdAt",
            direction: 1,
            priority: 1,
          },
        ],
        includes: ["leaveType", "requestedByUser", "leaveType.department"],
      },
    };

    try {
      setLocalIsLoading(true);
      dispatch(setIsLoading(true));
      const response = await getAllVacationsAPI(dispatch, payload);
      if (
        response &&
        response.result &&
        Array.isArray(response.result.data) &&
        response.result.data.length > 0
      ) {
        const apiData = response.result.data.map((vocation: Vocation) => {
          const requestedByUser = vocation.requestedByUser || {
            id: "",
            firstName: "Unknown",
            lastName: "",
            pictureUrl: null,
          };
          const leaveType = vocation.leaveType || {
            id: "",
            name: "Unknown",
            department: { id: "", name: "Unknown" },
            maxDaysPerYear: 0,
          };
          const department = leaveType.department || {
            id: "",
            name: "Unknown",
          };

          return {
            id: vocation.id || "",
            employee: {
              id: requestedByUser.id,
              name: `${requestedByUser.firstName} ${requestedByUser.lastName || ""
                }`.trim(),
              designation: "Employee",
              profileUrl:
                requestedByUser.pictureUrl || "https://placehold.co/600",
            },
            department: {
              id: department.id,
              name: department.name,
            },
            leaveType: mapLeaveType(leaveType.name),
            startDate: vocation.fromDate || null,
            endDate: vocation.toDate || null,
            status: (vocation.status || "PENDING") as
              | "Approved"
              | "PENDING"
              | "Rejected",
            reason: vocation.reason || null,
            submittedDate: vocation.createdAt
              ? new Date(vocation.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "2-digit",
              })
              : "N/A",
            pending: vocation.status === "PENDING" ? 1 : 0,
          };
        });
        setLeaveData(apiData);
      } else {
        console.error("No leave data found for the provided leaveId");
        setLeaveData([]);
      }
    } catch (error) {
      console.error("Failed to fetch leave data:", error);
      setLeaveData([]);
    } finally {
      setLocalIsLoading(false);
      dispatch(setIsLoading(false));
    }
  };

  // Fetch leave data on mount
  useEffect(() => {
    fetchLeaveData();
  }, [dispatch, leaveId]);

  // Handle tab switch with animation
  const handleTabSwitch = (tab: "requests" | "history") => {
    if (tab !== activeTab) {
      setIsAnimating(true);
      setActiveTab(tab);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  return (
    <div ref={containerRef} className="min-w-[250px] w-[800px] min-h-full pt-2 pb-12">
      <LeavesChart />
      <div className="py-4 transition-all duration-300">
        <div className="flex gap-4 px-4">
          <button
            className={`relative px-4 cursor-pointer py-2 text-sm font-semibold ${activeTab === "requests"
              ? "border-b-[1px] border-(--primary-blue-400)"
              : "text-[#1C202F] hover:text-gray-600"
              }`}
            onClick={() => handleTabSwitch("requests")}
          >
            Requests
          </button>
          <button
            className={`relative px-4 cursor-pointer py-2 text-sm font-semibold ${activeTab === "history"
              ? "border-b-[1px] border-(--primary-blue-400)"
              : "text-[#1C202F] hover:text-gray-600"
              }`}
            onClick={() => handleTabSwitch("history")}
          >
            Record
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 pb-6">
        {activeTab === "requests" ? (
          isLoading ? (
            <SkeletonCard />
          ) : leaveData.length > 0 ? (
            (() => {
              const pendingLeaves = leaveData.filter(
                (leaveItem) => leaveItem.status === "PENDING"
              );
              return pendingLeaves.length > 0 ? (
                pendingLeaves.map((leaveItem) => (
                  <ClockedOutCard
                    key={leaveItem.id}
                    leave={leaveItem}
                    viewType={activeTab}
                    onStatusChange={fetchLeaveData}
                  />
                ))
              ) : (
                <div className=" bg-g-background-100 rounded-3xl w-full h-auto p-[24px] flex flex-col justify-center items-center lg:rounded-[32px] overflow-hidden">
                  <Image
                    src="/emptyleaves.png"
                    alt="No leave data"
                    width={200}
                    height={200}
                    className="object-contain w-[353px] h-[193px]"
                  />
                  <p className="text-center font-medium text-base text-g-gray-900">
                    No leave data found for this ID.
                  </p>
                </div>
              );
            })()
          ) : (
            <div className=" bg-g-background-100 rounded-3xl w-full h-[200px] flex justify-center items-center lg:rounded-[32px] overflow-hidden ">
              <Image
                src="/emptyleaves.png"
                alt="No leave data"
                width={200}
                height={200}
                className="object-contain w-[353px] h-[193px]"
              />
              <p className="text-center font-medium text-base text-g-gray-900">
                No leave data found for this ID.
              </p>
            </div>
          )
        ) : (
          <div className="border-[1px] bg-g-background-100 py-6 border-g-gray-alpha-400 rounded-3xl">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center px-6 mb-6">
              <h2 className="text-lg text-(--primary-gray-900) font-medium">
                Leave Requests
              </h2>
              <CustomDropdown
                id="leave-type-filter"
                name="leaveType"
                options={leaveTypeOptions}
                value={selectedLeaveType}
                onChange={(e) => setSelectedLeaveType(e.target.value)}
                placeholder="Filter by Leave Type"
              />
            </div>

            <TanstackTable
              columns={historyColumns}
              data={historyData}
              className=""
              showCheckboxes={true}
              isLoading={false}
              showTdBottomBorder={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagementView;
