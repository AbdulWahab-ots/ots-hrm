// "use client";

// import React, { useState, useEffect, useCallback, useMemo } from "react";
// import { useRouter } from "next/navigation";
// import Button from "@/components/common/Button";
// import { TanstackTable } from "@/components/common/TanstackTable";
// import { useDispatch, useSelector } from "react-redux";
// import { AppDispatch, RootState } from "@/store/store";
// import { fetchAllDepartments } from "@/services/adminServices";
// import { setIsLoading } from "@/store/features/global/globalSlice";
// import { RequestColumns } from "@/utils/Columns/RequestColumns";
// import CustomModal from "@/components/common/CustomModal";
// import ManagementView from "./ManagementView";
// import { fetchAllRequests } from "@/services/adminServices";
// import { GetRequestsPayload } from "@/utils/types";

// export interface Employee {
//   id?: string;
//   name: string;
//   designation: string;
//   profileUrl?: string;
// }

// export interface Department {
//   id: string;
//   name: string;
// }

// export interface Attendance {
//   id: string;
//   selected?: boolean;
//   userId: string;
//   employee: Employee;
//   department: Department;
//   type: "Check In" | "Check Out";
//   time: string | null;
//   status: "Approved" | "Pending" | "Canceled";
//   reason: string | null;
//   submittedDate?: string;
//   date: string;
// }

// const RequestTable = () => {
//   const [localData, setLocalData] = useState<Attendance[]>([]);
//   const [selectedRows, setSelectedRows] = useState<Attendance[]>([]);
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

//   const [isDateModalOpen, setIsDateModalOpen] = useState(false);
//   const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
//   const [selectedAttendance, setSelectedAttendance] =
//     useState<Attendance | null>(null);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
//   const [selectedDepartment, setSelectedDepartment] = useState("");
//   const [selectedStatus, setSelectedStatus] = useState("");
//   const [selectedRange, setSelectedRange] = useState<{
//     startDate: Date | null;
//     endDate: Date | null;
//   }>({
//     startDate: null,
//     endDate: null,
//   });
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [totalItems, setTotalItems] = useState(0);
//   const [isLoading, setLocalIsLoading] = useState(false);
//   const [hasInitialized, setHasInitialized] = useState(false);
//   const [activeFilter, setActiveFilter] = useState("day");
//   const dispatch = useDispatch<AppDispatch>();
//   const router = useRouter();

//   const departments = useSelector(
//     (state: RootState) => state.department.departmentData
//   );

//   const departmentOptions = [
//     { value: "", label: "All" },
//     ...(departments?.map((dept: Department) => ({
//       value: dept.id,
//       label: dept.name,
//     })) || []),
//   ];

//   const statusOptions = useMemo(
//     () => [
//       { value: "", label: "All" },
//       { value: "Approved", label: "Approved" },
//       { value: "Pending", label: "Pending" },
//       { value: "Canceled", label: "Canceled" },
//     ],
//     []
//   );

//   const handleFilterChange = (filter: string) => {
//     setActiveFilter(filter);
//     setCurrentPage(1); // Reset to first page when filter changes
//   };

//   // Utility function to calculate date range based on activeFilter in PKT
//   const getDateRangeForFilter = useCallback(() => {
//     // Create a new Date object in PKT
//     const today = new Date();
//     today.setHours(0, 0, 0, 0); // Reset to midnight PKT

//     let startDate: Date;
//     let endDate: Date;

//     switch (activeFilter) {
//       case "day":
//         startDate = new Date(today); // Start of current day in PKT (2025-09-11 00:00:00 PKT)
//         endDate = new Date(today); // End of current day in PKT
//         endDate.setHours(23, 59, 59, 999); // Set to end of day (2025-09-11 23:59:59 PKT)
//         break;
//       case "week":
//         startDate = new Date(today);
//         startDate.setDate(today.getDate() - 7); // Last 7 days
//         startDate.setHours(0, 0, 0, 0);
//         endDate = new Date(today);
//         endDate.setHours(23, 59, 59, 999);
//         break;
//       case "month":
//         startDate = new Date(today);
//         startDate.setMonth(today.getMonth() - 1); // Last 30 days
//         startDate.setHours(0, 0, 0, 0);
//         endDate = new Date(today);
//         endDate.setHours(23, 59, 59, 999);
//         break;
//       case "year":
//         startDate = new Date(today);
//         startDate.setFullYear(today.getFullYear() - 1); // Last 365 days
//         startDate.setHours(0, 0, 0, 0);
//         endDate = new Date(today);
//         endDate.setHours(23, 59, 59, 999);
//         break;
//       default:
//         startDate = new Date(today);
//         endDate = new Date(today);
//         endDate.setHours(23, 59, 59, 999);
//     }

//     // Convert PKT dates to UTC for API (subtract 5 hours)
//     const startDateUTC = new Date(startDate.getTime() - 5 * 60 * 60 * 1000); // 2025-09-10T19:00:00Z
//     const endDateUTC = new Date(endDate.getTime() - 5 * 60 * 60 * 1000); // 2025-09-11T18:59:59Z

//     return { startDate: startDateUTC, endDate: endDateUTC };
//   }, [activeFilter]);

//   useEffect(() => {
//     if (!hasInitialized) {
//       if (!departments || departments.length === 0) {
//         dispatch(fetchAllDepartments);
//       }
//       setHasInitialized(true);
//     }
//   }, [dispatch, departments, hasInitialized]);

//   useEffect(() => {
//     const handler = setTimeout(() => {
//       setDebouncedSearchTerm(searchTerm);
//     }, 500);
//     return () => {
//       clearTimeout(handler);
//     };
//   }, [searchTerm]);

//   const fetchAttendance = useCallback(
//     async (page: number) => {
//       try {
//         setLocalIsLoading(true);
//         dispatch(setIsLoading(true));

//         const payload: GetRequestsPayload = {
//           pagedListRequest: {
//             pageNo: page,
//             pageSize: 10,
//             getAllRecords: false,
//           },
//           queryOptionsRequest: {
//             filtersRequest: [],
//             sortRequest: [
//               {
//                 field: "createdAt",
//                 direction: 1,
//                 priority: 1,
//               },
//             ],
//             includes: [
//               "user",
//               "user.employee",
//               "user.employee.department",
//               "user.employee.designation",
//             ],
//           },
//         };

//         // Add activeFilter-based date range to filters
//         const { startDate, endDate } = getDateRangeForFilter();
//         payload.queryOptionsRequest.filtersRequest.push({
//           field: "date",
//           operator: 1,
//           matchMode: 10,
//           rangeValues: {
//             start: startDate.toISOString().split("T")[0], // e.g., 2025-09-10
//             end: endDate.toISOString().split("T")[0], // e.g., 2025-09-11
//           },
//         });

//         if (debouncedSearchTerm) {
//           payload.queryOptionsRequest.filtersRequest.push({
//             field: "user.employee.firstName",
//             operator: 1,
//             matchMode: 1,
//             value: debouncedSearchTerm,
//           });
//         }

//         if (selectedDepartment) {
//           payload.queryOptionsRequest.filtersRequest.push({
//             field: "user.employee.departmentId",
//             operator: 1,
//             matchMode: 1,
//             value: selectedDepartment,
//           });
//         }

//         if (selectedStatus) {
//           payload.queryOptionsRequest.filtersRequest.push({
//             field: "status",
//             operator: 1,
//             matchMode: 1,
//             value: selectedStatus.toUpperCase(),
//           });
//         }

//         if (selectedRange.startDate && selectedRange.endDate) {
//           const startDateUTC = new Date(
//             selectedRange.startDate.getTime() - 5 * 60 * 60 * 1000
//           );
//           const endDateUTC = new Date(
//             selectedRange.endDate.getTime() - 5 * 60 * 60 * 1000
//           );
//           endDateUTC.setHours(23, 59, 59, 999); // Ensure full day coverage
//           payload.queryOptionsRequest.filtersRequest.push({
//             field: "date",
//             operator: 1,
//             matchMode: 10,
//             rangeValues: {
//               start: startDateUTC.toISOString().split("T")[0],
//               end: endDateUTC.toISOString().split("T")[0],
//             },
//           });
//         }

//         const response = await fetchAllRequests(dispatch, payload);
//         console.log("API Response:", response); // Debug response

//         if (response && response.success && response.result) {
//           const transformedData = response.result.data.map((request: any) => {
//             const nameParts = [
//               request.user?.employee?.firstName,
//               request.user?.employee?.middleName,
//               request.user?.employee?.lastName,
//             ].filter(Boolean);
//             const fullName =
//               nameParts.length > 0
//                 ? nameParts.join(" ")
//                 : request.user?.userName || "Unknown";

//             return {
//               id: request.id,
//               userId: request.userId,
//               selected: false,
//               employee: {
//                 name: fullName,
//                 designation:
//                   request.user?.employee?.designation?.title || "N/A",
//                 profileUrl: request.user?.pictureUrl || undefined,
//               },
//               department: {
//                 id: request.user?.employee?.department?.id || "",
//                 name: request.user?.employee?.department?.name || "N/A",
//               },
//               type: request.type === "CHECK_IN" ? "Check In" : "Check Out",
//               time: request.time || null,
//               status:
//                 request.status === "APPROVED"
//                   ? "Approved"
//                   : request.status === "PENDING"
//                   ? "Pending"
//                   : "Canceled",
//               reason: request.reason || null,
//               submittedDate: request.date
//                 ? new Date(request.date).toLocaleDateString("en-PK", {
//                     timeZone: "Asia/Karachi",
//                   })
//                 : "Submitted Yesterday",
//             };
//           });

//           setLocalData(transformedData);
//           setTotalPages(response.result.numberOfPages);
//           setTotalItems(response.result.total);
//         } else {
//           console.error("Invalid API response:", response);
//           setLocalData([]);
//         }
//       } catch (error: any) {
//         console.error("Failed to fetch attendance requests:", error);
//         setLocalData([]);
//       } finally {
//         setLocalIsLoading(false);
//         dispatch(setIsLoading(false));
//       }
//     },
//     [
//       dispatch,
//       debouncedSearchTerm,
//       selectedDepartment,
//       selectedStatus,
//       selectedRange,
//       activeFilter,
//     ]
//   );

//   useEffect(() => {
//     if (hasInitialized) {
//       fetchAttendance(currentPage);
//     }
//   }, [
//     currentPage,
//     debouncedSearchTerm,
//     selectedDepartment,
//     selectedStatus,
//     selectedRange,
//     activeFilter,
//     fetchAttendance,
//     hasInitialized,
//   ]);

//   const handleOpenDateModal = () => setIsDateModalOpen(true);
//   const handleCloseDateModal = () => setIsDateModalOpen(false);

//   const handleSaveRange = (range: {
//     startDate: Date | null;
//     endDate: Date | null;
//   }) => {
//     setSelectedRange(range);
//     handleCloseDateModal();
//   };

//   const handleRangeSelect = (range: {
//     startDate: Date | null;
//     endDate: Date | null;
//   }) => {
//     setSelectedRange(range);
//   };

//   const toggleRowSelection = (id: string) => {
//     setLocalData((prevData) =>
//       prevData.map((att) =>
//         att.id === id ? { ...att, selected: !att.selected } : att
//       )
//     );
//   };

//   const handleOpenDetailsModal = (attendance: Attendance) => {
//     console.log("Clicked Attendance ID:", attendance.id);
//     console.log("Attendance Data:", attendance);
//     setSelectedAttendance(attendance);
//     setIsDetailsModalOpen(true);
//   };

//   const handleCloseDetailsModal = () => {
//     setIsDetailsModalOpen(false);
//     setSelectedAttendance(null);
//     fetchAttendance(currentPage); // Refresh data when modal closes
//   };

//   const handleActionComplete = () => {
//     fetchAttendance(currentPage); // Refresh data after action
//   };

//   useEffect(() => {
//     const selected = localData.filter((att) => att.selected);
//     setSelectedRows(selected);
//   }, [localData]);

//   useEffect(() => {
//     if (isDeleteModalOpen || isDateModalOpen || isDetailsModalOpen) {
//       document.body.style.overflow = "hidden";
//     } else {
//       document.body.style.overflow = "auto";
//     }
//     return () => {
//       document.body.style.overflow = "auto";
//     };
//   }, [isDeleteModalOpen, isDateModalOpen, isDetailsModalOpen]);

//   return (
//     <>
//       <div className="border-[1px] bg-white py-6 border-[#E9EAEB] rounded-3xl mx-auto">
//         <div className="flex justify-between items-center px-6 mb-6">
//           <h2 className="text-lg text-[#181D27] font-medium">
//             Attendance Requests
//           </h2>
//           <ul className="inline-flex gap-1 border border-(--genrel-light-stroke) bg-(--primary-alpha-5) rounded-[20px] p-1">
//             <li
//               className={`px-4 py-3 ${
//                 activeFilter === "day"
//                   ? "bg-(--primary-alpha-5) text-(--primary-blue-500)"
//                   : "text-(--general-extra-light)"
//               } rounded-2xl text-sm font-semibold cursor-pointer`}
//               onClick={() => handleFilterChange("day")}
//             >
//               D
//             </li>
//             <li
//               className={`px-4 py-3 ${
//                 activeFilter === "week"
//                   ? "bg-(--primary-alpha-5) text-(--primary-blue-500)"
//                   : "text-(--general-extra-light)"
//               } rounded-2xl text-sm font-semibold cursor-pointer`}
//               onClick={() => handleFilterChange("week")}
//             >
//               W
//             </li>
//             <li
//               className={`px-4 py-3 ${
//                 activeFilter === "month"
//                   ? "bg-(--primary-alpha-5) text-(--primary-blue-500)"
//                   : "text-(--general-extra-light)"
//               } rounded-2xl text-sm font-semibold cursor-pointer`}
//               onClick={() => handleFilterChange("month")}
//             >
//               M
//             </li>
//             <li
//               className={`px-4 py-3 ${
//                 activeFilter === "year"
//                   ? "bg-(--primary-alpha-5) text-(--primary-blue-500)"
//                   : "text-(--general-extra-light)"
//               } rounded-2xl text-sm font-semibold cursor-pointer`}
//               onClick={() => handleFilterChange("year")}
//             >
//               Y
//             </li>
//           </ul>
//         </div>

//         <div className="relative">
//           <TanstackTable
//             columns={RequestColumns(handleOpenDetailsModal)}
//             data={localData}
//             className=""
//             showCheckboxes={true}
//             selectedRows={selectedRows}
//             isLoading={isLoading}
//             meta={{
//               toggleRowSelection,
//               selectedRows,
//               router,
//             }}
//           />

//           <div className="flex gap-4 justify-between px-6 items-center border-t border-gray-200 pt-4">
//             <div className="flex gap-4">
//               <Button
//                 label="Previous"
//                 variant="outline"
//                 onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
//                 disabled={currentPage === 1 || isLoading}
//               />
//               <Button
//                 label="Next"
//                 variant="outline"
//                 onClick={() => setCurrentPage((prev) => prev + 1)}
//                 disabled={currentPage >= totalPages || isLoading}
//               />
//             </div>
//             <p>
//               Page {currentPage} of {totalPages}
//             </p>
//           </div>
//         </div>
//       </div>

//       <CustomModal
//         isOpen={isDetailsModalOpen}
//         onClose={handleCloseDetailsModal}
//         title="Attendance Details"
//         variant="bottom-full"
//       >
//         {selectedAttendance && (
//           <ManagementView
//             selectedAttendance={selectedAttendance}
//             onActionComplete={handleActionComplete}
//           />
//         )}
//       </CustomModal>
//     </>
//   );
// };

// export default RequestTable;

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import Button from "@/components/common/Button";
import { TanstackTable } from "@/components/common/TanstackTable";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { fetchAllDepartments } from "@/services/adminServices";
import { setIsLoading } from "@/store/features/global/globalSlice";
import { RequestColumns } from "@/utils/Columns/RequestColumns";
import CustomModal from "@/components/common/CustomModal";
import ManagementView from "./ManagementView";
import { fetchAllRequests } from "@/services/adminServices";
import { GetRequestsPayload } from "@/utils/types";
import CountBadge from "@/components/common/CountBadge";
import { nowBusiness, BUSINESS_TIMEZONE } from "@/utils/timezone";

export interface Employee {
  id?: string;
  name: string;
  designation: string;
  profileUrl?: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface Attendance {
  id: string;
  selected?: boolean;
  userId: string;
  employee: Employee;
  department: Department;
  type: "Check In" | "Check Out";
  time: string | null;
  status: "Approved" | "Pending" | "Canceled";
  reason: string | null;
  submittedDate?: string;
  date: string;
}

const RequestTable = () => {
  const [localData, setLocalData] = useState<Attendance[]>([]);
  const [selectedRows, setSelectedRows] = useState<Attendance[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] =
    useState<Attendance | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedRange, setSelectedRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: null,
    endDate: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setLocalIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [activeFilter, setActiveFilter] = useState("day");
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const departments = useSelector(
    (state: RootState) => state.department.departmentData
  );

  const departmentOptions = [
    { value: "", label: "All" },
    ...(departments?.map((dept: Department) => ({
      value: dept.id,
      label: dept.name,
    })) || []),
  ];

  const statusOptions = useMemo(
    () => [
      { value: "", label: "All" },
      { value: "Approved", label: "Approved" },
      { value: "Pending", label: "Pending" },
      { value: "Canceled", label: "Canceled" },
    ],
    []
  );

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Utility function to calculate date range based on activeFilter in BUSINESS_TIMEZONE
  const getDateRangeForFilter = useCallback(() => {
    const today = nowBusiness();
    today.setHours(0, 0, 0, 0); // Reset to midnight (business timezone)

    let startDate: Date;
    let endDate: Date;

    switch (activeFilter) {
      case "day":
        startDate = new Date(today);
        endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "week":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "month":
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "year":
        startDate = new Date(today);
        startDate.setFullYear(today.getFullYear() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        startDate = new Date(today);
        endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
    }

    // No manual UTC conversion needed here — format() (used where these dates are
    // consumed) reads the local calendar date directly, so there's no timezone to
    // compensate for. A hardcoded -5h offset only ever worked for PKT specifically
    // and silently broke for every other timezone.
    return { startDate, endDate };
  }, [activeFilter]);

  useEffect(() => {
    if (!hasInitialized) {
      if (!departments || departments.length === 0) {
        dispatch(fetchAllDepartments);
      }
      setHasInitialized(true);
    }
  }, [dispatch, departments, hasInitialized]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const fetchAttendance = useCallback(
    async (page: number) => {
      try {
        setLocalIsLoading(true);
        dispatch(setIsLoading(true));

        const payload: GetRequestsPayload = {
          pagedListRequest: {
            pageNo: page,
            pageSize: 10,
            getAllRecords: false,
          },
          queryOptionsRequest: {
            filtersRequest: [],
            sortRequest: [
              {
                field: "createdAt",
                direction: 1,
                priority: 1,
              },
            ],
            includes: [
              "user",
              "user.employee",
              "user.employee.department",
              "user.employee.designation",
            ],
          },
        };

        // Add activeFilter-based date range to filters
        const { startDate, endDate } = getDateRangeForFilter();
        payload.queryOptionsRequest.filtersRequest.push({
          field: "date",
          operator: 1,
          matchMode: 10,
          rangeValues: {
            start: format(startDate, "yyyy-MM-dd"),
            end: format(endDate, "yyyy-MM-dd"),
          },
        });

        if (debouncedSearchTerm) {
          payload.queryOptionsRequest.filtersRequest.push({
            field: "user.employee.firstName",
            operator: 1,
            matchMode: 1,
            value: debouncedSearchTerm,
          });
        }

        if (selectedDepartment) {
          payload.queryOptionsRequest.filtersRequest.push({
            field: "user.employee.departmentId",
            operator: 1,
            matchMode: 1,
            value: selectedDepartment,
          });
        }

        if (selectedStatus) {
          payload.queryOptionsRequest.filtersRequest.push({
            field: "status",
            operator: 1,
            matchMode: 1,
            value: selectedStatus.toUpperCase(),
          });
        }

        if (selectedRange.startDate && selectedRange.endDate) {
          payload.queryOptionsRequest.filtersRequest.push({
            field: "date",
            operator: 1,
            matchMode: 10,
            rangeValues: {
              start: format(selectedRange.startDate, "yyyy-MM-dd"),
              end: format(selectedRange.endDate, "yyyy-MM-dd"),
            },
          });
        }

        const response = await fetchAllRequests(dispatch, payload);
        console.log("API Response:", response);

        if (response && response.success && response.result) {
          const transformedData = response.result.data.map((request: any) => {
            const nameParts = [
              request.user?.employee?.firstName,
              request.user?.employee?.middleName,
              request.user?.employee?.lastName,
            ].filter(Boolean);
            const fullName =
              nameParts.length > 0
                ? nameParts.join(" ")
                : request.user?.userName || "Unknown";

            // Format the date as "6 Sep, 2025" (3-letter month)
            const formattedDate = request.date
              ? new Date(request.date).toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
                year: "numeric",
                timeZone: BUSINESS_TIMEZONE,
              })
              : "N/A";

            return {
              id: request.id,
              userId: request.userId,
              selected: false,
              employee: {
                name: fullName,
                designation:
                  request.user?.employee?.designation?.title || "N/A",
                profileUrl: request.user?.pictureUrl || undefined,
              },
              department: {
                id: request.user?.employee?.department?.id || "",
                name: request.user?.employee?.department?.name || "N/A",
              },
              type: request.type === "CHECK_IN" ? "Check In" : "Check Out",
              time: request.time || null,
              status:
                request.status === "APPROVED"
                  ? "Approved"
                  : request.status === "PENDING"
                    ? "Pending"
                    : "Canceled",
              reason: request.reason || null,
              submittedDate: formattedDate,
              date: formattedDate,
            };
          });

          setLocalData(transformedData);
          setTotalPages(response.result.numberOfPages);
          setTotalItems(response.result.total);
        } else {
          console.error("Invalid API response:", response);
          setLocalData([]);
        }
      } catch (error: any) {
        console.error("Failed to fetch attendance requests:", error);
        setLocalData([]);
      } finally {
        setLocalIsLoading(false);
        dispatch(setIsLoading(false));
      }
    },
    [
      dispatch,
      debouncedSearchTerm,
      selectedDepartment,
      selectedStatus,
      selectedRange,
      activeFilter,
    ]
  );

  useEffect(() => {
    if (hasInitialized) {
      fetchAttendance(currentPage);
    }
  }, [
    currentPage,
    debouncedSearchTerm,
    selectedDepartment,
    selectedStatus,
    selectedRange,
    activeFilter,
    fetchAttendance,
    hasInitialized,
  ]);

  const handleOpenDateModal = () => setIsDateModalOpen(true);
  const handleCloseDateModal = () => setIsDateModalOpen(false);

  const handleSaveRange = (range: {
    startDate: Date | null;
    endDate: Date | null;
  }) => {
    setSelectedRange(range);
    handleCloseDateModal();
  };

  const handleRangeSelect = (range: {
    startDate: Date | null;
    endDate: Date | null;
  }) => {
    setSelectedRange(range);
  };

  const toggleRowSelection = (id: string) => {
    setLocalData((prevData) =>
      prevData.map((att) =>
        att.id === id ? { ...att, selected: !att.selected } : att
      )
    );
  };

  const handleOpenDetailsModal = (attendance: Attendance) => {
    console.log("Clicked Attendance ID:", attendance.id);
    console.log("Attendance Data:", attendance);
    setSelectedAttendance(attendance);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedAttendance(null);
    fetchAttendance(currentPage);
  };

  const handleActionComplete = () => {
    fetchAttendance(currentPage);
  };

  useEffect(() => {
    const selected = localData.filter((att) => att.selected);
    setSelectedRows(selected);
  }, [localData]);

  useEffect(() => {
    if (isDeleteModalOpen || isDateModalOpen || isDetailsModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isDeleteModalOpen, isDateModalOpen, isDetailsModalOpen]);

  return (
    <>
      <div className="border bg-g-background-100 py-6 border-g-gray-alpha-400 rounded-[var(--g-radius-md)] shadow-geist-card mx-auto">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center px-6 mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-heading-16 text-g-gray-1000">
              Attendance Requests
            </h2>
            <CountBadge count={totalItems} />
          </div>
          <ul className="inline-flex gap-1 border border-(--genrel-light-stroke) bg-(--primary-alpha-5) rounded-[20px] p-1">
            <li
              className={`px-4 py-3 ${activeFilter === "day"
                ? "bg-(--primary-alpha-5) text-(--primary-blue-500)"
                : "text-(--general-extra-light)"
                } rounded-[var(--g-radius-sm)] text-button-14 cursor-pointer focus-ring-geist`}
              onClick={() => handleFilterChange("day")}
            >
              D
            </li>
            <li
              className={`px-4 py-3 ${activeFilter === "week"
                ? "bg-(--primary-alpha-5) text-(--primary-blue-500)"
                : "text-(--general-extra-light)"
                } rounded-[var(--g-radius-sm)] text-button-14 cursor-pointer focus-ring-geist`}
              onClick={() => handleFilterChange("week")}
            >
              W
            </li>
            <li
              className={`px-4 py-3 ${activeFilter === "month"
                ? "bg-(--primary-alpha-5) text-(--primary-blue-500)"
                : "text-(--general-extra-light)"
                } rounded-[var(--g-radius-sm)] text-button-14 cursor-pointer focus-ring-geist`}
              onClick={() => handleFilterChange("month")}
            >
              M
            </li>
            <li
              className={`px-4 py-3 ${activeFilter === "year"
                ? "bg-(--primary-alpha-5) text-(--primary-blue-500)"
                : "text-(--general-extra-light)"
                } rounded-[var(--g-radius-sm)] text-button-14 cursor-pointer focus-ring-geist`}
              onClick={() => handleFilterChange("year")}
            >
              Y
            </li>
          </ul>
        </div>

        <div className="relative">
          <TanstackTable
            columns={RequestColumns(handleOpenDetailsModal, false)}
            data={localData}
            className=""
            showCheckboxes={false}
            selectedRows={selectedRows}
            isLoading={isLoading}
            meta={{
              toggleRowSelection,
              selectedRows,
              router,
            }}
          />

          <div className="flex gap-4 justify-between px-6 items-center border-t border-gray-200 pt-4">
            <div className="flex gap-4">
              <Button
                label="Previous"
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || isLoading}
              />
              <Button
                label="Next"
                variant="outline"
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={currentPage >= totalPages || isLoading}
              />
            </div>
            <p>
              Page {currentPage} of {totalPages}
            </p>
          </div>
        </div>
      </div>

      <CustomModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        title="Attendance Details"
        variant="bottom-full"
      >
        {selectedAttendance && (
          <ManagementView
            selectedAttendance={selectedAttendance}
            onActionComplete={handleActionComplete}
          />
        )}
      </CustomModal>
    </>
  );
};

export default RequestTable;
