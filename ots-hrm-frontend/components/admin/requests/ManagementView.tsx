import React, { useState, useEffect, useCallback } from "react";
import ClockedOutCard from "./ClockedCard";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { fetchAllRequests } from "@/services/adminServices";
import { GetRequestsPayload } from "@/utils/types";
import SkeletonCard from "@/components/common/SkeletonCard";
import Image from "next/image";

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
  userId: string;
  employee: Employee;
  department: Department;
  type: "Check In" | "Check Out";
  time: string | null;
  status: "Approved" | "Pending" | "Rejected";
  reason: string | null;
  submittedDate?: string;
}

interface ManagementViewProps {
  selectedAttendance: Attendance | null;
  onActionComplete?: () => void;
}

const ManagementView: React.FC<ManagementViewProps> = ({
  selectedAttendance,
  onActionComplete,
}) => {
  const [activeTab, setActiveTab] = useState<"requests" | "history">(
    "requests"
  );
  const [historyData, setHistoryData] = useState<Attendance[]>([]);
  const [pendingData, setPendingData] = useState<Attendance[]>([]);
  const [actionStatus, setActionStatus] = useState<
    "Approved" | "Rejected" | null
  >(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isRequestsLoading, setIsRequestsLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  // Fetch helpers
  const transformResponseToAttendance = useCallback(
    (data: any[]): Attendance[] => {
      return data.map((request: any) => {
        const nameParts = [
          request.user?.employee?.firstName,
          request.user?.employee?.middleName,
          request.user?.employee?.lastName,
        ].filter(Boolean);
        const fullName =
          nameParts.length > 0
            ? nameParts.join(" ")
            : request.user?.userName || "Unknown";

        return {
          id: request.id,
          userId: request.userId,
          employee: {
            name: fullName,
            designation: request.user?.employee?.designation?.title || "N/A",
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
                : "Rejected",
          reason: request.reason || null,
          submittedDate: request.date || "Submitted Yesterday",
        } as Attendance;
      });
    },
    []
  );

  const fetchPendingForUser = useCallback(async () => {
    if (!selectedAttendance?.userId) {
      setPendingData([]);
      return;
    }
    setIsRequestsLoading(true);
    const payload: GetRequestsPayload = {
      pagedListRequest: {
        pageNo: 1,
        pageSize: 50,
        getAllRecords: false,
      },
      queryOptionsRequest: {
        filtersRequest: [
          {
            field: "userId",
            operator: 1,
            matchMode: 1,
            value: selectedAttendance.userId,
          },
          { field: "status", operator: 1, matchMode: 1, value: "PENDING" },
        ],
        sortRequest: [{ field: "createdAt", direction: -1, priority: 1 }],
        includes: [
          "user",
          "user.employee",
          "user.employee.department",
          "user.employee.designation",
        ],
      },
    };

    const response = await fetchAllRequests(dispatch, payload);
    if (response && response.success && response.result) {
      const transformed = transformResponseToAttendance(
        response.result.data
      ).filter((r) => r.status === "Pending");
      setPendingData(transformed);
    } else {
      setPendingData([]);
    }
    setIsRequestsLoading(false);
  }, [dispatch, selectedAttendance?.userId, transformResponseToAttendance]);

  useEffect(() => {
    if (activeTab === "history" && selectedAttendance) {
      const fetchHistory = async () => {
        setIsHistoryLoading(true);
        const payload: GetRequestsPayload = {
          pagedListRequest: {
            pageNo: 1,
            pageSize: 10,
            getAllRecords: false,
          },
          queryOptionsRequest: {
            filtersRequest: [
              {
                field: "userId",
                operator: 1,
                matchMode: 1,
                value: selectedAttendance.userId,
              },
            ],
            sortRequest: [],
            includes: [
              "user",
              "user.employee",
              "user.employee.department",
              "user.employee.designation",
            ],
          },
        };

        const response = await fetchAllRequests(dispatch, payload);

        if (response && response.success && response.result) {
          const transformedData = transformResponseToAttendance(
            response.result.data
          ).filter((item: Attendance) => item.status !== "Pending");

          setHistoryData(transformedData);
        } else {
          setHistoryData([]);
        }
        setIsHistoryLoading(false);
      };

      fetchHistory();
    }
  }, [activeTab, selectedAttendance, dispatch, transformResponseToAttendance]);

  useEffect(() => {
    if (activeTab === "requests") {
      fetchPendingForUser();
    }
  }, [activeTab, fetchPendingForUser]);

  const handleActionComplete = (status: "Approved" | "Rejected") => {
    setActionStatus(status);
    onActionComplete?.();
    // Refresh both lists after an action
    fetchPendingForUser();
    if (activeTab === "history" || status) {
      // Ensure history reflects new state next time user opens the tab
      setHistoryData((prev) => prev);
    }
  };

  const renderContent = () => {
    if (activeTab === "requests") {
      if (pendingData.length === 0 && !isRequestsLoading) {
        return (
          <div className="p-2 sm:p-6 text-center flex flex-col items-center gap-4">
            <div>
              <Image
                src="/Group 27.png"
                alt="No requests"
                width={200}
                height={200}
                className="object-contain w-[546px] h-[283px]"
              />
              <div className="-top-[200px] sm:-top-[244px] left-[0px] relative flex-col flex items-center justify-center gap-[60px]">
                <Image
                  src="/emptyreq.png"
                  alt="No requests"
                  width={200}
                  height={200}
                  className="object-contain w-[180px] h-[120px] sm:w-[353px] sm:h-[193px] relative "
                />
                <p className="text-heading-16 text-g-gray-1000">
                  No pending request available.
                </p>
              </div>
            </div>
          </div>
        );
      }
    }

    if (activeTab === "history" && isHistoryLoading) {
      return (
        <div className="grid gap-6 p-6">
          {[...Array(3)].map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      );
    }

    return (
      <div className="grid gap-6 overflow-y-auto">
        {(activeTab === "requests" ? pendingData : historyData).map(
          (attendance) => (
            <ClockedOutCard
              key={attendance.id}
              attendance={attendance}
              viewType={activeTab}
              onActionComplete={handleActionComplete}
            />
          )
        )}
        {activeTab === "history" &&
          historyData.length === 0 &&
          !isHistoryLoading && (
            <div className="p-2 sm:p-6 text-center text-heading-16 text-g-gray-1000">
              <div>
                <Image
                  src="/Group 27.png"
                  alt="No requests"
                  width={200}
                  height={200}
                  className="object-contain w-[546px] h-[283px]"
                />
                <div className="-top-[200px] sm: -top-[244px] left-[0px] relative flex-col flex items-center justify-center gap-[60px]">
                  <Image
                    src="/emptyreq.png"
                    alt="No requests"
                    width={200}
                    height={200}
                    className="object-contain w-[180px] h-[120px] sm:w-[353px] sm:h-[193px] relative "
                  />
                  <p className="text-heading-16 text-g-gray-1000">
                    No history available.
                  </p>
                </div>
              </div>
            </div>
          )}
      </div>
    );
  };

  return (
    <div className="w-[800px] pb-6 mb-4 h-full flex flex-col">
      <div className="sticky top-0 z-10 pb-4 bg-g-background-100">
        <div className="flex gap-4">
          <button
            className={`px-4 py-2 text-button-14 text-(--general-extra-light) focus-ring-geist ${activeTab === "requests"
              ? "border-b-[1px] border-g-blue-700"
              : "text-(--general-extra-light)"
              }`}
            onClick={() => setActiveTab("requests")}
          >
            Requests
          </button>
          <button
            className={`px-4 py-2 text-button-14 text-(--general-extra-light) focus-ring-geist ${activeTab === "history"
              ? "border-b-[1px] border-g-blue-700"
              : "text-(--general-extra-light)"
              }`}
            onClick={() => setActiveTab("history")}
          >
            History
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0">{renderContent()}</div>
    </div>
  );
};

export default ManagementView;
