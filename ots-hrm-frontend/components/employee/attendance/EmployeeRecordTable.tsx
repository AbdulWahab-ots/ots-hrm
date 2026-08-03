// "use client";

// import React, { useState, useEffect, useCallback, useMemo } from "react";
// import { useRouter } from "next/navigation";
// import Button from "@/components/common/Button";
// import { TanstackTable } from "../../common/TanstackTable";
// import CustomDropdown from "@/components/common/form/DropDown";
// import { useDispatch } from "react-redux";
// import { AppDispatch } from "@/store/store";
// import { setIsLoading } from "@/store/features/global/globalSlice";
// import { employeeEttendanceRequestColumns } from "@/utils/Columns/employeeEttendanceRequestColumns";
// import { fetchAttendanceRecords } from "@/services/employeeService";
// import { createAttendanceRequestAPI } from "@/services/employeeService";
// // Removed local modal; parent handles the modal
// import { FaCheckCircle, FaSignOutAlt } from "react-icons/fa";

// export interface EmployeeRecord {
//   id: string;
//   selected?: boolean;
//   employeeName: string;
//   type: "Check In" | "Check Out" | "Both";
//   checkIn: string | null;
//   checkOut: string | null;
//   status: "Present" | "Holiday" | "Leave" | "Absent" | "Pending";
//   date: string;
//   reason: string | null;
//   hasCheckIn?: boolean;
//   hasCheckOut?: boolean;
// }

// const EmployeeRecordTable = ({
//   onRequest,
//   refreshToken,
// }: {
//   onRequest: (type: string, date: string) => void;
//   refreshToken?: number | string;
// }) => {
//   const [localData, setLocalData] = useState<EmployeeRecord[]>([]);
//   const [selectedRows, setSelectedRows] = useState<EmployeeRecord[]>([]);
//   const [selectedStatus, setSelectedStatus] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [totalItems, setTotalItems] = useState(0);
//   const [isLoading, setLocalIsLoading] = useState(false);
//   const [hasInitialized, setHasInitialized] = useState(false);
//   // Local modal removed; parent modal will be used

//   const dispatch = useDispatch<AppDispatch>();
//   const router = useRouter();

//   const statusOptions = useMemo(() => {
//     return [
//       { value: "", label: "All" },
//       { value: "Present", label: "Present" },
//       { value: "Holiday", label: "Holiday" },
//       { value: "Leave", label: "Leave" },
//       { value: "Absent", label: "Absent" },
//       { value: "Pending", label: "Pending" },
//     ];
//   }, []);

//   const fetchEmployeeRecords = useCallback(
//     async (page: number) => {
//       try {
//         setLocalIsLoading(true);
//         dispatch(setIsLoading(true));

//         const startDate = "2025-09-01";
//         const endDate = "2025-09-30";

//         const response = await fetchAttendanceRecords(
//           dispatch,
//           page,
//           10,
//           startDate,
//           endDate,
//           selectedStatus || undefined
//         );

//         if (response?.success && response.result?.data) {
//           const transformedData: EmployeeRecord[] = response.result.data.map(
//             (record: any, index: number) => ({
//               // Added index for key
//               id: record.id,
//               selected: false,
//               employeeName: `${record.user.firstName} ${record.user.lastName}`,
//               type:
//                 record.checkInTime && record.checkOutTime
//                   ? "Both"
//                   : record.checkInTime
//                   ? "Check In"
//                   : record.checkOutTime
//                   ? "Check Out"
//                   : "Both",
//               checkIn: record.checkInTime || null,
//               checkOut: record.checkOutTime || null,
//               status:
//                 record.status === "PRESENT"
//                   ? "Present"
//                   : record.status === "DAY_OFF" || record.status === "HOLIDAY"
//                   ? "Holiday"
//                   : record.status === "ON_LEAVE"
//                   ? "Leave"
//                   : record.status === "CHECK_IN"
//                   ? "Pending"
//                   : "Absent",
//               date: record.date,
//               reason: record.notes || null,
//               hasCheckIn: !!record.checkInTime,
//               hasCheckOut: !!record.checkOutTime,
//             })
//           );
//           setLocalData(transformedData);
//           setTotalPages(response.result.numberOfPages || 1);
//           setTotalItems(response.result.total || 0);
//         } else {
//           setLocalData([]);
//           setTotalPages(1);
//           setTotalItems(0);
//         }
//       } catch (error: any) {
//         console.error("Failed to fetch employee records:", error);
//         setLocalData([]);
//         setTotalPages(1);
//         setTotalItems(0);
//       } finally {
//         setLocalIsLoading(false);
//         dispatch(setIsLoading(false));
//       }
//     },
//     [dispatch, selectedStatus]
//   );

//   useEffect(() => {
//     if (!hasInitialized) {
//       setHasInitialized(true);
//     }
//     fetchEmployeeRecords(currentPage);
//   }, [
//     currentPage,
//     selectedStatus,
//     fetchEmployeeRecords,
//     hasInitialized,
//     refreshToken,
//   ]);

//   const toggleRowSelection = (id: string) => {
//     setLocalData((prevData) =>
//       prevData.map((record) =>
//         record.id === id ? { ...record, selected: !record.selected } : record
//       )
//     );
//   };

//   useEffect(() => {
//     const selected = localData.filter((record) => record.selected);
//     setSelectedRows(selected);
//   }, [localData]);

//   const handleOpenModal = (
//     type: "CHECK_IN" | "CHECK_OUT",
//     record: EmployeeRecord
//   ) => {
//     onRequest(type, record.date);
//   };

//   // No local modal to close

//   // Submission handled by parent modal

//   // Use shared columns (which already include an 'actions' column)
//   const columnsWithActions = useMemo(() => {
//     const baseColumns = employeeEttendanceRequestColumns.filter(
//       // @ts-ignore
//       (col) => (col as any).id !== "actions"
//     );

//     return [
//       ...baseColumns,
//       {
//         id: "actions",
//         header: "Actions",
//         cell: (info: any) => {
//           const record = info.row.original as EmployeeRecord;
//           return (
//             <div className="flex gap-2">
//               {!record.hasCheckIn && (
//                 <button
//                   key={`checkin-${record.id}`}
//                   onClick={() => handleOpenModal("CHECK_IN", record)}
//                   className="text-blue-500 hover:text-blue-700"
//                   title="Request Check In"
//                 >
//                   <FaCheckCircle size={18} />
//                 </button>
//               )}
//               {!record.hasCheckOut && (
//                 <button
//                   key={`checkout-${record.id}`}
//                   onClick={() => handleOpenModal("CHECK_OUT", record)}
//                   className="text-red-500 hover:text-red-700"
//                   title="Request Check Out"
//                 >
//                   <FaSignOutAlt size={18} />
//                 </button>
//               )}
//             </div>
//           );
//         },
//       },
//     ];
//   }, [employeeEttendanceRequestColumns]);

//   return (
//     <>
//       <div className="border-[1px] bg-white py-6 border-[#E9EAEB] rounded-3xl mx-auto">
//         <div className="flex justify-between items-center px-6 mb-6">
//           <h3 className="text-lg text-[#181D27] font-medium">
//             Employee Records
//           </h3>
//           <div className="flex items-center gap-4">
//             <CustomDropdown
//               id="status-filter"
//               name="status"
//               options={statusOptions}
//               value={selectedStatus}
//               onChange={(e) => setSelectedStatus(e.target.value)}
//               placeholder="Status"
//             />
//           </div>
//         </div>

//         <div className="relative">
//           <TanstackTable
//             columns={columnsWithActions}
//             data={localData}
//             className=""
//             showCheckboxes={true}
//             selectedRows={selectedRows}
//             isLoading={isLoading}
//             meta={{
//               toggleRowSelection,
//               selectedRows,
//               router,
//               onRequest: (type: string, date: string) => onRequest(type, date),
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
//     </>
//   );
// };

// export default EmployeeRecordTable;

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import Button from "@/components/common/Button";
import { TanstackTable } from "../../common/TanstackTable";
import CustomDropdown from "@/components/common/form/DropDown";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { setIsLoading } from "@/store/features/global/globalSlice";
import { employeeEttendanceRequestColumns } from "@/utils/Columns/employeeEttendanceRequestColumns";
import { fetchAttendanceRecords } from "@/services/employeeService";
import { createAttendanceRequestAPI } from "@/services/employeeService";
import { FaCheckCircle, FaSignOutAlt } from "react-icons/fa";

export interface EmployeeRecord {
  id: string;
  selected?: boolean;
  employeeName: string;
  type: "Check In" | "Check Out" | "Both";
  checkIn: string | null;
  checkOut: string | null;
  status: "Present" | "Holiday" | "Leave" | "Absent" | "Pending";
  date: string;
  reason: string | null;
  hasCheckIn?: boolean;
  hasCheckOut?: boolean;
}

const EmployeeRecordTable = ({
  onRequest,
  refreshToken,
}: {
  onRequest: (type: string, date: string) => void;
  refreshToken?: number | string;
}) => {
  const [localData, setLocalData] = useState<EmployeeRecord[]>([]);
  const [selectedRows, setSelectedRows] = useState<EmployeeRecord[]>([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setLocalIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  console.log(selectedStatus, "filter");
  const statusOptions = useMemo(() => {
    return [
      { value: "", label: "All" },
      { value: "Present", label: "Present" },
      { value: "Holiday", label: "Holiday" },
      { value: "Leave", label: "Leave" },
      { value: "Absent", label: "Absent" },
      // { value: "Pending", label: "Pending" },
    ];
  }, []);

  const fetchEmployeeRecords = useCallback(
    async (page: number) => {
      try {
        setLocalIsLoading(true);
        dispatch(setIsLoading(true));
        const today = new Date();
        const currentYear = today.getFullYear();

        // start date = current year ka pehla month (Jan 1)
        const startDate = `${currentYear}-01-01`;

        // end date = current year ka current month ka last din
        const endDate = format(
          new Date(currentYear, today.getMonth() + 1, 0), // 0 = last day of previous month
          "yyyy-MM-dd"
        );
        // Map UI status values to API status values
        const statusMapping: Record<string, string> = {
          Present: "PRESENT",
          Holiday: "HOLIDAY",
          Leave: "ON_LEAVE",
          Absent: "ABSENT",
          "": "", // For "All" option
        };

        const apiStatus =
          selectedStatus in statusMapping
            ? statusMapping[selectedStatus]
            : undefined;

        const response = await fetchAttendanceRecords(
          dispatch,
          page,
          10,
          startDate,
          endDate,
          apiStatus || undefined
        );

        if (response?.success && response.result?.data) {
          const transformedData: EmployeeRecord[] = response.result.data.map(
            (record: any, index: number) => ({
              id: record.id,
              selected: false,
              employeeName: `${record.user.firstName} ${record.user.lastName}`,
              type:
                record.checkInTime && record.checkOutTime
                  ? "Both"
                  : record.checkInTime
                  ? "Check In"
                  : record.checkOutTime
                  ? "Check Out"
                  : "Both",
              checkIn: record.checkInTime || null,
              checkOut: record.checkOutTime || null,
              // record.status is the backend AttendanceStatus enum (DEFAULT, PRESENT,
              // ABSENT, LATE, HALF_DAY, ON_LEAVE, HOLIDAY, DAY_OFF). DEFAULT means "not
              // yet resolved" - e.g. today's row before check-in, or an overnight
              // shift's "today" row while yesterday's shift is still open - and must
              // NOT be shown as "Absent"; only the cron-assigned ABSENT status means
              // that. A catch-all fallback here previously mapped DEFAULT (and LATE)
              // straight to "Absent", which is what made an employee mid-overnight-shift
              // look absent for today even though the absent-marking job hadn't touched
              // their row at all.
              status:
                record.status === "PRESENT" || record.status === "LATE" || record.status === "HALF_DAY"
                  ? "Present"
                  : record.status === "DAY_OFF" || record.status === "HOLIDAY"
                  ? "Holiday"
                  : record.status === "ON_LEAVE"
                  ? "Leave"
                  : record.status === "ABSENT"
                  ? "Absent"
                  : "Pending",
              date: record.date,
              reason: record.notes || null,
              hasCheckIn: !!record.checkInTime,
              hasCheckOut: !!record.checkOutTime,
            })
          );
          setLocalData(transformedData);
          setTotalPages(response.result.numberOfPages || 1);
          setTotalItems(response.result.total || 0);
        } else {
          setLocalData([]);
          setTotalPages(1);
          setTotalItems(0);
        }
      } catch (error: any) {
        console.error("Failed to fetch employee records:", error);
        setLocalData([]);
        setTotalPages(1);
        setTotalItems(0);
      } finally {
        setLocalIsLoading(false);
        dispatch(setIsLoading(false));
      }
    },
    [dispatch, selectedStatus]
  );

  useEffect(() => {
    if (!hasInitialized) {
      setHasInitialized(true);
    }
    fetchEmployeeRecords(currentPage);
  }, [
    currentPage,
    selectedStatus,
    fetchEmployeeRecords,
    hasInitialized,
    refreshToken,
  ]);

  const toggleRowSelection = (id: string) => {
    setLocalData((prevData) =>
      prevData.map((record) =>
        record.id === id ? { ...record, selected: !record.selected } : record
      )
    );
  };

  useEffect(() => {
    const selected = localData.filter((record) => record.selected);
    setSelectedRows(selected);
  }, [localData]);

  const handleOpenModal = (
    type: "CHECK_IN" | "CHECK_OUT",
    record: EmployeeRecord
  ) => {
    onRequest(type, record.date);
  };

  const columnsWithActions = useMemo(() => {
    const baseColumns = employeeEttendanceRequestColumns.filter(
      (col: any) => col.id !== "actions"
    );

    return [
      ...baseColumns,
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: (info: any) => {
          const record = info.row.original as EmployeeRecord;
          const hasAction = !record.hasCheckIn || !record.hasCheckOut;
          return (
            <div className="flex justify-end gap-1">
              {!record.hasCheckIn && (
                <button
                  key={`checkin-${record.id}`}
                  onClick={() => handleOpenModal("CHECK_IN", record)}
                  className="flex items-center justify-center w-8 h-8 rounded-[var(--g-radius-sm)] text-g-blue-700 hover:bg-g-blue-100 hover:text-g-blue-800 transition-colors focus-ring-geist"
                  title="Request Check In"
                  aria-label="Request Check In"
                >
                  <FaCheckCircle size={16} />
                </button>
              )}
              {!record.hasCheckOut && (
                <button
                  key={`checkout-${record.id}`}
                  onClick={() => handleOpenModal("CHECK_OUT", record)}
                  className="flex items-center justify-center w-8 h-8 rounded-[var(--g-radius-sm)] text-g-red-700 hover:bg-g-red-100 hover:text-g-red-800 transition-colors focus-ring-geist"
                  title="Request Check Out"
                  aria-label="Request Check Out"
                >
                  <FaSignOutAlt size={16} />
                </button>
              )}
              {!hasAction && <span className="text-g-gray-600 pr-1">--</span>}
            </div>
          );
        },
      },
    ];
  }, [employeeEttendanceRequestColumns]);

  return (
    <>
      <div className="border-[1px] bg-g-background-100 py-6 border-g-gray-alpha-400 rounded-[var(--g-radius-lg)] shadow-geist-card mx-auto">
        <div className="flex justify-between items-center px-6 mb-6">
          <h3 className="text-heading-16 text-g-gray-1000">
            Employee Records
          </h3>
          <div className="flex items-center gap-4">
            <CustomDropdown
              id="status-filter"
              name="status"
              options={statusOptions}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              placeholder="Status"
            />
          </div>
        </div>

        <div className="relative">
          <TanstackTable
            columns={columnsWithActions}
            data={localData}
            className=""
            showCheckboxes={true}
            selectedRows={selectedRows}
            isLoading={isLoading}
            meta={{
              toggleRowSelection,
              selectedRows,
              router,
              onRequest: (type: string, date: string) => onRequest(type, date),
            }}
          />

          <div className="flex gap-4 justify-between px-6 items-center border-t border-g-gray-alpha-400 pt-4">
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
            <p className="text-label-14 text-g-gray-900">
              Page {currentPage} of {totalPages}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmployeeRecordTable;
