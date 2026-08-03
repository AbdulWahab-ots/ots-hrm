// // EmployeeAttendance.tsx
// "use client";

// import React, { useEffect, useRef, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import dayjs from "dayjs";
// import { RootState, AppDispatch } from "@/store/store";
// import {
//   fetchEmployeeAttendance,
//   fetchAttendanceStatus,
//   createAttendanceRequestAPI,
// } from "@/services/employeeService";
// import { convert24To12HourFormat } from "@/utils/helper";
// import EmployeeTimeCard from "./EmployeeTimeCard";
// import DashboardCards from "./DashbaordCard";
// import EmployeeRecordTable from "./EmployeeRecordTable";
// import EmployeeAttendanceReport from "./EmployeeAttendanceReport";
// import CustomModal from "@/components/common/CustomModal";
// import Button from "@/components/common/Button";
// import Loading from "@/components/common/Loading";
// import CreateAttendanceRequest from "./AddRequest";
// import { ProfileResponse } from "@/utils/types";

// type Tab = "requests" | "records";

// interface EmployeeRecord {
//   id: string;
//   selected?: boolean;
//   employeeName: string;
//   type: "Check In" | "Check Out" | "Both";
//   checkIn: string | null;
//   checkOut: string | null;
//   status: "Present" | "Holiday" | "Leave" | "Absent" | "Pending";
//   date: string;
//   reason: string | null;
// }

// const EmployeeAttendance: React.FC = () => {
//   const [dateRangeFilter, setDateRangeFilter] = useState<string>(
//     "04/26/2025 - 05/02/2025"
//   );
//   const [isLoading, setIsLoading] = useState<boolean>(true);
//   const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
//     dayjs(),
//     dayjs(),
//   ]);
//   const [activeTab, setActiveTab] = useState<Tab>("requests");
//   const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
//   const [initialModalData, setInitialModalData] = useState<{
//     type?: string;
//     date?: string;
//   } | null>(null);
//   const [currentMonth, setCurrentMonth] = useState<number>(dayjs().month());
//   const [currentYear, setCurrentYear] = useState<number>(dayjs().year());
//   const [isPunchedIn, setIsPunchedIn] = useState<boolean>(false);
//   const [punchInTime, setPunchInTime] = useState<Date | null>(null);
//   const [punchOutTime, setPunchOutTime] = useState<Date | null>(null);
//   const [refreshToken, setRefreshToken] = useState<number>(0);

//   const dispatch = useDispatch<AppDispatch>();
//   const attendanceData = useSelector((state: RootState) => state.attendance);
//   const attendanceList = attendanceData?.attendanceData;
//   const { profileData } = useSelector((state: RootState) => state.global) as {
//     profileData: ProfileResponse | null;
//   };
//   const transformAttendanceData = (attendanceList: any[]): EmployeeRecord[] => {
//     return attendanceList.map((record) => ({
//       id: record.id,
//       selected: false,
//       employeeName:
//         record.user?.firstName + " " + (record.user?.lastName || ""),
//       type:
//         record.checkInTime && record.checkOutTime
//           ? "Both"
//           : record.checkInTime
//           ? "Check In"
//           : "Check Out",
//       checkIn: record.checkInTime
//         ? convert24To12HourFormat(record.checkInTime, "checkin")
//         : null,
//       checkOut: record.checkOutTime
//         ? convert24To12HourFormat(record.checkOutTime, "checkout")
//         : null,
//       status:
//         record.status === "PRESENT"
//           ? "Present"
//           : record.status === "DAY_OFF" || record.status === "HOLIDAY"
//           ? "Holiday"
//           : record.status === "ON_LEAVE"
//           ? "Leave"
//           : record.status === "CHECK_IN"
//           ? "Pending"
//           : "Absent",
//       date: record.date,
//       reason: record.notes || "No reason provided",
//       presentStatus: record.presentStatus,
//       lockWorkingHours: record.lockWorkingHours,
//     }));
//   };

//   const transformedAttendanceList = attendanceList
//     ? transformAttendanceData(attendanceList)
//     : [];

//   const refetchAttendanceData = () => {
//     const startOfMonth = dayjs()
//       .year(currentYear)
//       .month(currentMonth)
//       .startOf("month")
//       .format("YYYY-MM-DD");
//     const endOfMonth = dayjs()
//       .year(currentYear)
//       .month(currentMonth)
//       .endOf("month")
//       .format("YYYY-MM-DD");
//     fetchEmployeeAttendance(dispatch, startOfMonth, endOfMonth).finally(() => {
//       setIsLoading(false);
//     });
//   };

//   useEffect(() => {
//     const currentDate = new Date().toISOString().split("T")[0];
//     fetchAttendanceStatus(dispatch).then((response) => {
//       const data = response?.result;
//       if (data) {
//         if (data.checkInTime && !data.checkOutTime) {
//           const checkInDateTime = new Date(`${data.date}T${data.checkInTime}`);
//           setIsPunchedIn(true);
//           setPunchInTime(checkInDateTime);
//         } else if (data.checkInTime && data.checkOutTime) {
//           const checkInDateTime = new Date(`${data.date}T${data.checkInTime}`);
//           const checkOutDateTime = new Date(
//             `${data.date}T${data.checkOutTime}`
//           );
//           setIsPunchedIn(false);
//           setPunchInTime(checkInDateTime);
//           setPunchOutTime(checkOutDateTime);
//         } else {
//           setIsPunchedIn(false);
//           setPunchInTime(null);
//           setPunchOutTime(null);
//         }
//       }
//     });
//   }, [dispatch]);

//   useEffect(() => {
//     refetchAttendanceData();
//   }, [currentMonth, currentYear, dispatch]);

//   const handleDateRangeSubmit = (values: {
//     dateRange: [dayjs.Dayjs, dayjs.Dayjs];
//   }) => {
//     if (values.dateRange?.length === 2) {
//       const [startDate, endDate] = values.dateRange;
//       fetchEmployeeAttendance(
//         dispatch,
//         startDate.format("YYYY-MM-DD"),
//         endDate.format("YYYY-MM-DD")
//       );
//       setDateRange(values.dateRange);
//       setDateRangeFilter(
//         `${startDate.format("MM/DD/YYYY")} - ${endDate.format("MM/DD/YYYY")}`
//       );
//       setCurrentMonth(startDate.month());
//       setCurrentYear(startDate.year());
//     }
//   };

//   const handleTabChange = (tab: Tab) => {
//     setActiveTab(tab);
//   };

//   const handleOpenModal = () => {
//     setInitialModalData(null);
//     setIsModalOpen(true);
//   };

//   const handleCloseModal = () => setIsModalOpen(false);

//   const handleCreateAttendanceRequest = async (
//     values: {
//       requestType: string;
//       date: string;
//       checkInTime?: string;
//       checkOutTime?: string;
//       description: string;
//     },
//     formikHelpers: any
//   ) => {
//     try {
//       let time = "";
//       if (values.requestType === "CHECK_IN") {
//         time = values.checkInTime || "";
//       } else if (values.requestType === "CHECK_OUT") {
//         time = values.checkOutTime || "";
//       }

//       const payload = {
//         type: values.requestType as "CHECK_IN" | "CHECK_OUT",
//         date: values.date,
//         time,
//         reason: values.description,
//       };

//       await createAttendanceRequestAPI(dispatch, payload);
//       handleCloseModal();

//       refetchAttendanceData();
//       setRefreshToken((t) => t + 1);
//     } catch (error) {
//       console.error("Error submitting attendance request:", error);
//       formikHelpers.setStatus(
//         "An unexpected error occurred. Please try again."
//       );
//     } finally {
//       formikHelpers.setSubmitting(false);
//     }
//   };

//   const handleRequest = (type: string, date: string) => {
//     setInitialModalData({ type, date });
//     setIsModalOpen(true);
//   };

//   const handlePunchUpdate = () => {
//     refetchAttendanceData();
//     fetchAttendanceStatus(dispatch).then((response) => {
//       const data = response?.result;
//       if (data) {
//         if (data.checkInTime && !data.checkOutTime) {
//           const checkInDateTime = new Date(`${data.date}T${data.checkInTime}`);
//           setIsPunchedIn(true);
//           setPunchInTime(checkInDateTime);
//         } else if (data.checkInTime && data.checkOutTime) {
//           const checkInDateTime = new Date(`${data.date}T${data.checkInTime}`);
//           const checkOutDateTime = new Date(
//             `${data.date}T${data.checkOutTime}`
//           );
//           setIsPunchedIn(false);
//           setPunchInTime(checkInDateTime);
//           setPunchOutTime(checkOutDateTime);
//         } else {
//           setIsPunchedIn(false);
//           setPunchInTime(null);
//           setPunchOutTime(null);
//         }
//       }
//     });
//     setRefreshToken((t) => t + 1);
//   };

//   const canNavigateNext = () => {
//     const currentDate = dayjs();
//     const selectedDate = dayjs().year(currentYear).month(currentMonth);
//     return selectedDate.isBefore(currentDate, "month");
//   };

//   return (
//     <div className="space-y-6">
//       <style jsx>{`
//         @keyframes border-expand {
//           0% {
//             border-left-width: 0;
//             border-right-width: 0;
//           }
//         }
//         .tab-button.active {
//           animation: border-expand 0.3s ease forwards;
//         }
//       `}</style>

//       <div className="grid  gap-6 md:grid-cols-2">
//         <EmployeeTimeCard
//           profileData={profileData} // Pass profileData directly to handle loading state
//           onPunchUpdate={handlePunchUpdate}
//         />
//         <div className="grid  gap-6">
//           <DashboardCards />
//         </div>
//       </div>

//       <div className="flex items-center justify-between">
//         <div className="flex gap-6">
//           <button
//             key="requests-tab"
//             className={`
//               py-2 font-semibold cursor-pointer text-base leading-6 tracking-[0%]
//               transition-colors duration-300 border-b-[1px]
//               ${
//                 activeTab === "requests"
//                   ? "text-[#1C202F] border-[#597BE8] tab-button active"
//                   : "text-[#3C4566] border-transparent"
//               }
//             `}
//             onClick={() => handleTabChange("requests")}
//             aria-selected={activeTab === "requests"}
//           >
//             Attendance List
//           </button>
//           <button
//             key="records-tab"
//             className={`
//               py-2 font-semibold cursor-pointer text-base leading-6 tracking-[0%]
//               transition-colors duration-300 border-b-[1px]
//               ${
//                 activeTab === "records"
//                   ? "text-[#1C202F] border-[#597BE8] tab-button active"
//                   : "text-[#3C4566] border-transparent"
//               }
//             `}
//             onClick={() => handleTabChange("records")}
//             aria-selected={activeTab === "records"}
//           >
//             Attendance Calendar View
//           </button>
//         </div>
//         <div>
//           <Button
//             label="Add Request"
//             variant="outline"
//             onClick={handleOpenModal}
//           />
//         </div>
//       </div>

//       <div className="bg-white rounded-3xl">
//         {isLoading ? (
//           <div className="flex justify-center items-center py-4">
//             <Loading />
//           </div>
//         ) : activeTab === "requests" ? (
//           <EmployeeRecordTable
//             onRequest={handleRequest}
//             refreshToken={refreshToken}
//           />
//         ) : (
//           <EmployeeAttendanceReport
//             localData={transformedAttendanceList}
//             currentMonth={currentMonth}
//             currentYear={currentYear}
//             setCurrentMonth={setCurrentMonth}
//             setCurrentYear={setCurrentYear}
//             canNavigateNext={canNavigateNext}
//           />
//         )}
//       </div>

//       <CustomModal
//         isOpen={isModalOpen}
//         onClose={handleCloseModal}
//         title="Create Attendance Request"
//         variant="bottom-full"
//       >
//         <CreateAttendanceRequest
//           onSubmit={handleCreateAttendanceRequest}
//           onCancel={handleCloseModal}
//           initialRequestType={initialModalData?.type}
//           initialDate={initialModalData?.date}
//         />
//       </CustomModal>
//     </div>
//   );
// };

// export default EmployeeAttendance;

"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { RootState, AppDispatch } from "@/store/store";
import {
  fetchEmployeeAttendance,
  fetchAttendanceStatus,
  createAttendanceRequestAPI,
  refreshAttendanceAPI,
} from "@/services/employeeService";
import RefreshAttendanceModal from "@/components/common/RefreshAttendanceModal";
import { convert24To12HourFormat } from "@/utils/helper";
import EmployeeTimeCard from "./EmployeeTimeCard";
import DashboardCards from "./DashbaordCard";
import EmployeeRecordTable from "./EmployeeRecordTable";
import EmployeeAttendanceReport from "./EmployeeAttendanceReport";
import CustomModal from "@/components/common/CustomModal";
import Button from "@/components/common/Button";
import Loading from "@/components/common/Loading";
import CreateAttendanceRequest from "./AddRequest";
import { ProfileResponse } from "@/utils/types";
import EmployeeCard from "../dashboard/components/EmployeeCard";
import SegmentedTabs from "@/components/common/SegmentedTabs";
import AttendanceHeatmap from "./AttendanceHeatmap";

type Tab = "requests" | "records";

interface EmployeeRecord {
  id: string;
  selected?: boolean;
  employeeName: string;
  type: "Check In" | "Check Out" | "Both";
  checkIn: string | null;
  checkOut: string | null;
  status: "Present" | "Holiday" | "Leave" | "Absent" | "Pending";
  date: string;
  reason: string | null;
  presentStatus?: string | null;
  lockWorkingHours?: number | null;
}

const EmployeeAttendance: React.FC = () => {
  const [dateRangeFilter, setDateRangeFilter] = useState<string>(
    "04/26/2025 - 05/02/2025"
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs(),
    dayjs(),
  ]);
  const [activeTab, setActiveTab] = useState<Tab>("requests");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [initialModalData, setInitialModalData] = useState<{
    type?: string;
    date?: string;
  } | null>(null);
  const [currentMonth, setCurrentMonth] = useState<number>(dayjs().month());
  const [currentYear, setCurrentYear] = useState<number>(dayjs().year());
  const [isPunchedIn, setIsPunchedIn] = useState<boolean>(false);
  const [punchInTime, setPunchInTime] = useState<Date | null>(null);
  const [punchOutTime, setPunchOutTime] = useState<Date | null>(null);
  const [refreshToken, setRefreshToken] = useState<number>(0);
  const [isRefreshAttendanceOpen, setIsRefreshAttendanceOpen] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const attendanceData = useSelector((state: RootState) => state.attendance);
  const attendanceList = attendanceData?.attendanceData;
  const { profileData } = useSelector((state: RootState) => state.global) as {
    profileData: ProfileResponse | null;
  };

  const transformAttendanceData = (attendanceList: any[]): EmployeeRecord[] => {
    return attendanceList.map((record) => ({
      id: record.id,
      selected: false,
      employeeName:
        record.user?.firstName + " " + (record.user?.lastName || ""),
      type:
        record.checkInTime && record.checkOutTime
          ? "Both"
          : record.checkInTime
            ? "Check In"
            : "Check Out",
      checkIn: record.checkInTime
        ? convert24To12HourFormat(record.checkInTime, "checkin")
        : null,
      checkOut: record.checkOutTime
        ? convert24To12HourFormat(record.checkOutTime, "checkout")
        : null,
      // See EmployeeRecordTable.tsx for why DEFAULT must map to "Pending", not "Absent".
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
      reason: record.notes || "No reason provided",
      presentStatus: record.presentStatus, // Ensure presentStatus is mapped
      lockWorkingHours: record.lockWorkingHours, // Ensure lockWorkingHours is mapped
    }));
  };

  const transformedAttendanceList = attendanceList
    ? transformAttendanceData(attendanceList)
    : [];

  const refetchAttendanceData = () => {
    const startOfMonth = dayjs()
      .year(currentYear)
      .month(currentMonth)
      .startOf("month")
      .format("YYYY-MM-DD");
    const endOfMonth = dayjs()
      .year(currentYear)
      .month(currentMonth)
      .endOf("month")
      .format("YYYY-MM-DD");
    fetchEmployeeAttendance(dispatch, startOfMonth, endOfMonth).finally(() => {
      setIsLoading(false);
    });
  };

  const getLocalDateISO = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  useEffect(() => {
    const currentDate = getLocalDateISO();
    fetchAttendanceStatus(dispatch).then((response) => {
      const data = response?.result;
      if (data) {
        if (data.checkInTime && !data.checkOutTime) {
          const checkInDateTime = new Date(`${data.date}T${data.checkInTime}`);
          setIsPunchedIn(true);
          setPunchInTime(checkInDateTime);
        } else if (data.checkInTime && data.checkOutTime) {
          const checkInDateTime = new Date(`${data.date}T${data.checkInTime}`);
          const checkOutDateTime = new Date(
            `${data.date}T${data.checkOutTime}`
          );
          setIsPunchedIn(false);
          setPunchInTime(checkInDateTime);
          setPunchOutTime(checkOutDateTime);
        } else {
          setIsPunchedIn(false);
          setPunchInTime(null);
          setPunchOutTime(null);
        }
      }
    });
  }, [dispatch]);

  useEffect(() => {
    refetchAttendanceData();
  }, [currentMonth, currentYear, dispatch]);

  const handleDateRangeSubmit = (values: {
    dateRange: [dayjs.Dayjs, dayjs.Dayjs];
  }) => {
    if (values.dateRange?.length === 2) {
      const [startDate, endDate] = values.dateRange;
      fetchEmployeeAttendance(
        dispatch,
        startDate.format("YYYY-MM-DD"),
        endDate.format("YYYY-MM-DD")
      );
      setDateRange(values.dateRange);
      setDateRangeFilter(
        `${startDate.format("MM/DD/YYYY")} - ${endDate.format("MM/DD/YYYY")}`
      );
      setCurrentMonth(startDate.month());
      setCurrentYear(startDate.year());
    }
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
  };

  const handleOpenModal = () => {
    setInitialModalData(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleCreateAttendanceRequest = async (
    values: {
      requestType: string;
      date: string;
      checkInTime?: string;
      checkOutTime?: string;
      description: string;
    },
    formikHelpers: any
  ) => {
    try {
      let time = "";
      if (values.requestType === "CHECK_IN") {
        time = values.checkInTime || "";
      } else if (values.requestType === "CHECK_OUT") {
        time = values.checkOutTime || "";
      }

      const payload = {
        type: values.requestType as "CHECK_IN" | "CHECK_OUT",
        date: values.date,
        time,
        reason: values.description,
      };

      await createAttendanceRequestAPI(dispatch, payload);
      handleCloseModal();

      refetchAttendanceData();
      setRefreshToken((t) => t + 1);
    } catch (error) {
      console.error("Error submitting attendance request:", error);
      formikHelpers.setStatus(
        "An unexpected error occurred. Please try again."
      );
    } finally {
      formikHelpers.setSubmitting(false);
    }
  };

  const handleRequest = (type: string, date: string) => {
    setInitialModalData({ type, date });
    setIsModalOpen(true);
  };

  const handlePunchUpdate = () => {
    refetchAttendanceData();
    fetchAttendanceStatus(dispatch).then((response) => {
      const data = response?.result;
      if (data) {
        if (data.checkInTime && !data.checkOutTime) {
          const checkInDateTime = new Date(`${data.date}T${data.checkInTime}`);
          setIsPunchedIn(true);
          setPunchInTime(checkInDateTime);
        } else if (data.checkInTime && data.checkOutTime) {
          const checkInDateTime = new Date(`${data.date}T${data.checkInTime}`);
          const checkOutDateTime = new Date(
            `${data.date}T${data.checkOutTime}`
          );
          setIsPunchedIn(false);
          setPunchInTime(checkInDateTime);
          setPunchOutTime(checkOutDateTime);
        } else {
          setIsPunchedIn(false);
          setPunchInTime(null);
          setPunchOutTime(null);
        }
      }
    });
    setRefreshToken((t) => t + 1);
  };

  const canNavigateNext = () => {
    const currentDate = dayjs();
    const selectedDate = dayjs().year(currentYear).month(currentMonth);
    return selectedDate.isBefore(currentDate, "month");
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 items-stretch xl:grid-cols-5">
        <EmployeeCard
          profileData={profileData} // Pass profileData directly to handle loading state
          isPunchedIn={isPunchedIn}
          punchInTime={punchInTime}
          punchOutTime={punchOutTime}
          setIsPunchedIn={setIsPunchedIn}
          setPunchInTime={setPunchInTime}
          setPunchOutTime={setPunchOutTime}
          onPunchUpdate={handlePunchUpdate}
          className="md:col-span-3 h-full"
          dashboardType="attendance"
        />
        <div className="grid sm:col-span-3 xl:col-span-2 gap-6 h-full">
          <DashboardCards />
        </div>
      </div>

      {/* Attendance heatmap — GitHub-style, full width, derived from the same
          attendance source as the records table (no new endpoint). */}
      <AttendanceHeatmap />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center justify-between">
        <SegmentedTabs
          options={[
            { value: "requests", label: "Attendance List" },
            { value: "records", label: "Attendance Calendar View" },
          ]}
          value={activeTab}
          onChange={(v) => handleTabChange(v as Tab)}
        />
        <div className="self-end sm:self-auto flex gap-2">
          <Button
            label="Refresh Attendance"
            variant="outline"
            onClick={() => setIsRefreshAttendanceOpen(true)}
          />
          <Button
            label="Add Request"
            variant="outline"
            onClick={handleOpenModal}
          />
        </div>
      </div>

      <div className="bg-g-background-100 rounded-3xl">
        {activeTab === "requests" ? (
          <EmployeeRecordTable
            onRequest={handleRequest}
            refreshToken={refreshToken}
          />
        ) : (
          <EmployeeAttendanceReport
            localData={transformedAttendanceList}
            currentMonth={currentMonth}
            currentYear={currentYear}
            setCurrentMonth={setCurrentMonth}
            setCurrentYear={setCurrentYear}
            canNavigateNext={canNavigateNext}
          />
        )}
      </div>

      <CustomModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Create Attendance Request"
        variant="bottom-full"
      >
        <CreateAttendanceRequest
          onSubmit={handleCreateAttendanceRequest}
          onCancel={handleCloseModal}
          initialRequestType={initialModalData?.type}
          initialDate={initialModalData?.date}
        />
      </CustomModal>

      <RefreshAttendanceModal
        isOpen={isRefreshAttendanceOpen}
        onClose={() => {
          setIsRefreshAttendanceOpen(false);
          refetchAttendanceData();
          setRefreshToken((t) => t + 1);
        }}
        onFetch={async (date) => {
          const response = await refreshAttendanceAPI(dispatch, date);
          return response?.result ?? null;
        }}
      />
    </div>
  );
};

export default EmployeeAttendance;
