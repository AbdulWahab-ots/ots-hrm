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
import { EmployeeAttendanceRequest } from "@/utils/Columns/EmployeeAttendanceRequest";

import {
  createAttendanceRequestAPI,
  fetchAllEmployeeRequests,
} from "@/services/employeeService";
import { GetRequestsPayload } from "@/utils/types";
import CustomModal from "@/components/common/CustomModal";
import CreateAttendanceRequest from "../attendance/AddRequest";
import CustomDropdown from "@/components/common/form/DropDown";
import { BUSINESS_TIMEZONE } from "@/utils/timezone";

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

const EmployeeRequestTable = () => {
  const [localData, setLocalData] = useState<Attendance[]>([]);
  const [selectedRows, setSelectedRows] = useState<Attendance[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [initialModalData, setInitialModalData] = useState<{
    type?: string;
    date?: string;
  } | null>(null);
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
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setLocalIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [activeFilter, setActiveFilter] = useState("day");
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const departments = useSelector(
    (state: RootState) => state.department.departmentData
  );

  const statusOptions = useMemo(
    () => [
      { value: "", label: "All" },
      { value: "Approved", label: "Approved" },
      { value: "Pending", label: "Pending" },
      { value: "REJECTED", label: "Rejected" },
    ],
    []
  );
  const handleOpenModal = () => {
    setInitialModalData(null);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => setIsModalOpen(false);
  useEffect(() => {
    if (!hasInitialized) {
      if (!departments || departments.length === 0) {
        dispatch(fetchAllDepartments);
      }
      setHasInitialized(true);
    }
  }, [dispatch, departments, hasInitialized]);

  const fetchAttendance = useCallback(
    async (page: number) => {
      try {
        setLocalIsLoading(true);

        // ✅ Get user from localStorage
        const storedUser = localStorage.getItem("user");
        const user = storedUser ? JSON.parse(storedUser) : null;
        const userId = user?.result?.id || "";
        console.log(user, "userId");
        const payload: GetRequestsPayload = {
          pagedListRequest: {
            pageNo: page,
            pageSize: 10,
            getAllRecords: false,
          },
          queryOptionsRequest: {
            filtersRequest: [
              {
                field: "userId",
                operator: 1,
                matchMode: 1,
                value: userId, // ✅ dynamic from localStorage
              },
            ],
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

        const response = await fetchAllEmployeeRequests(dispatch, payload);
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
                    : "Rejected",
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
        // dispatch(setIsLoading(false));
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

    selectedStatus,
    selectedRange,
    activeFilter,
    fetchAttendance,
    hasInitialized,
  ]);

  const toggleRowSelection = (id: string) => {
    setLocalData((prevData) =>
      prevData.map((att) =>
        att.id === id ? { ...att, selected: !att.selected } : att
      )
    );
  };

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

      // refetchAttendanceData();
      // setRefreshToken((t) => t + 1);
    } catch (error) {
      console.error("Error submitting attendance request:", error);
      formikHelpers.setStatus(
        "An unexpected error occurred. Please try again."
      );
    } finally {
      formikHelpers.setSubmitting(false);
    }
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
      <div className="flex justify-between items-center px-6 mb-6">
        <h2 className="text-[20px] sm:text-[30px] text-[#181D27]  font-semibold">
          Attendance Requests
        </h2>
        <div>
          <Button
            label="Add Request"
            variant="outline"
            onClick={handleOpenModal}
          />
        </div>
      </div>
      <div className="border-[1px] bg-g-background-100 py-6 border-g-gray-alpha-400 rounded-3xl mx-auto">
        <div className="flex justify-between items-center px-6 mb-6">
          <h2 className="text-lg text-[#181D27] font-medium">
            Attendance Requests List
          </h2>
          <div>
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
            columns={EmployeeAttendanceRequest(false)}
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
      </div>
    </>
  );
};

export default EmployeeRequestTable;
