
"use client";

import React, { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { fetchAttendanceStatus } from "@/services/employeeService";
import Button from "@/components/common/Button";
import { PiReceiptBold } from "react-icons/pi";
import { Play, Pause, Plus } from "lucide-react";
import CustomModal from "@/components/common/CustomModal";
import CreateLeaveRequest from "@/components/employee/leaves/add";
import SuccessConfirmation from "@/components/common/SuccessConfirmation";
import { createLeaveRequestAPI } from "@/services/employeeService";
import { triggerLeaveRefresh } from "@/store/features/global/globalSlice";
import QuickActions from "@/components/employee/leaves/QuickActions";
import { nowBusiness } from "@/utils/timezone";



interface TimeTrackingCardProps {
  isPunchedIn?: boolean; // Optional prop to indicate check-in status
  punchInTime?: Date | null; // Optional prop for punch-in time
  punchOutTime?: Date | null; // Optional prop for punch-out time
}

const TimeTrackingCard: React.FC<TimeTrackingCardProps> = ({
  isPunchedIn: propIsPunchedIn,
  punchInTime: propPunchInTime,
  punchOutTime: propPunchOutTime,
}) => {
  const [isPunchedIn, setIsPunchedIn] = useState<boolean>(false);
  const [punchInTime, setPunchInTime] = useState<Date | null>(null);
  const [punchOutTime, setPunchOutTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>("00:00:00");
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const isFetchedStatus = useRef(false);

  // Function to calculate time difference for the timer
  const calculateTimeDifference = (
    startTime: Date,
    endTime: Date = nowBusiness()
  ) => {
    const diff = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  };

  // Fetch attendance status for the current day
  useEffect(() => {
    if (!isFetchedStatus.current) {
      fetchAttendanceStatus(dispatch).then((response) => {
        const data = response?.result;
        if (data) {
          if (data.checkInTime && !data.checkOutTime) {
            const checkInDateTime = new Date(
              `${data.date}T${data.checkInTime}`
            );
            setIsPunchedIn(true);
            setPunchInTime(checkInDateTime);
            setElapsedTime(calculateTimeDifference(checkInDateTime));
          } else if (data.checkInTime && data.checkOutTime) {
            const checkInDateTime = new Date(
              `${data.date}T${data.checkInTime}`
            );
            const checkOutDateTime = new Date(
              `${data.date}T${data.checkOutTime}`
            );
            setIsPunchedIn(false);
            setPunchInTime(checkInDateTime);
            setPunchOutTime(checkOutDateTime);
            setElapsedTime(
              calculateTimeDifference(checkInDateTime, checkOutDateTime)
            );
          } else {
            setIsPunchedIn(false);
            setPunchInTime(null);
            setPunchOutTime(null);
            setElapsedTime("00:00:00");
          }
        }
        isFetchedStatus.current = true;
      });
    }
  }, [dispatch]);

  // Update state based on props (if provided)
  useEffect(() => {
    if (propIsPunchedIn !== undefined) {
      setIsPunchedIn(propIsPunchedIn);
    }
    if (propPunchInTime !== undefined) {
      setPunchInTime(propPunchInTime);
    }
    if (propPunchOutTime !== undefined) {
      setPunchOutTime(propPunchOutTime);
    }
  }, [propIsPunchedIn, propPunchInTime, propPunchOutTime]);

  // Start/stop timer based on check-in status
  useEffect(() => {
    if (isPunchedIn && punchInTime) {
      const interval = setInterval(() => {
        const now = nowBusiness();
        const timeDiff = calculateTimeDifference(punchInTime, now);
        setElapsedTime(timeDiff);
      }, 1000);

      setTimerInterval(interval);

      return () => clearInterval(interval);
    } else {
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
      if (punchInTime && punchOutTime) {
        setElapsedTime(calculateTimeDifference(punchInTime, punchOutTime));
      }
    }
  }, [isPunchedIn, punchInTime, punchOutTime]);

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
        console.log("successs", success);
        setSuccessMessage("Leave request submitted successfully!");
        setIsSuccessModalOpen(true);
        setIsModalOpen(false);
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
    <div className="lg:col-span-2">
      <div className="rounded-[var(--g-radius-md)] border-g-gray-alpha-400 items-center border-[1px] bg-g-background-100 shadow-geist-card p-4 mb-4">
        <h3 className="text-heading-20 text-g-gray-900">
          Time tracking
        </h3>
        <div className="mt-6 flex items-center justify-between rounded-[var(--g-radius-md)] bg-g-gray-alpha-100 py-4 px-6">
          <div>
            <p className="text-copy-14 text-g-gray-900 font-medium">
              {punchInTime
                ? `Checked In at ${punchInTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}`
                : "Not Checked In"}
            </p>
            <p className="text-4xl font-medium mt-1 text-g-gray-900">
              {elapsedTime}
            </p>
          </div>
          <button className="rounded-[var(--g-radius-sm)] border-[1px]  border-g-gray-alpha-400 bg-g-gray-200 p-2 transition focus-ring-geist">
            {isPunchedIn ? (
              <Pause className="h-4 w-4 text-g-gray-alpha-700" />
            ) : (
              <Play className="h-4 w-4 text-g-gray-alpha-700" />
            )}
          </button>
        </div>
      </div>
      {/* <div className="rounded-3xl flex-col flex gap-2 border-[#597BE84D] text-left border-[1px] bg-white p-5 mt-4">
        <h3 className="text-[20px] mb-4 font-medium text-[#3C4566]">
          Quick Actions
        </h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            label="Apply for Leaves"
            variant="outline"
            icon={Plus}
            onClick={handleApplyLeave}
          />
          <Button
            label="View Pay slip"
            variant="outline"
            icon={PiReceiptBold}
          />
        </div>
      </div> */}
      <QuickActions
        onApplyLeave={handleApplyLeave}
        onViewCalendar={() => setIsCalendarOpen(true)}
        ondashboard={true}
      />
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
    </div>
  );
};

export default TimeTrackingCard;
