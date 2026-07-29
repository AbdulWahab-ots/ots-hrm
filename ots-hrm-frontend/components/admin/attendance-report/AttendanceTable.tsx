"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import Button from "@/components/common/Button";
import { TanstackTable } from "@/components/common/TanstackTable";
import CustomDropdown from "@/components/common/form/DropDown";
import DateRangeField from "@/components/common/form/DateRangeField";
import DateRangePickerModal from "@/components/common/form/DateRangePickerModal";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import {
  fetchAllDepartments,
  fetchAllDesignations,
  fetchAllShifts,
  fetchAllAttendance,
} from "@/services/adminServices";
import { AdminattendanceColumns } from "@/utils/Columns/AdminattendanceColumns";
import { GetAttendancePayload, Attendance, Department } from "@/utils/types";
import { setIsLoading } from "@/store/features/global/globalSlice";
import { toast } from "sonner";
import CountBadge from "@/components/common/CountBadge";

const AttendanceTable = () => {
  const [localData, setLocalData] = useState<Attendance[]>([]);
  const [selectedRows, setSelectedRows] = useState<Attendance[]>([]);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  // Initialize selectedRange as null to indicate no default date filter
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
  const [sortConfig, setSortConfig] = useState<{
    field: string;
    direction: number;
  }>({
    field: "date",
    direction: 1, // Default: descending
  });

  const itemsPerPage = 5;

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const departments = useSelector(
    (state: RootState) => state.department.departmentData
  );
  const designations = useSelector(
    (state: RootState) => state.designation.designationData
  );
  const shifts = useSelector((state: RootState) => state.shift.shiftData);
  const attendanceData = useSelector(
    (state: RootState) => state.attendance.attendanceData
  );
  const isLoading = useSelector((state: RootState) => state.global.isLoading);
  const attendanceError = useSelector(
    (state: RootState) => state.attendance.error
  );

  const departmentOptions = useMemo(
    () => [
      { value: "", label: "All Departments" },
      ...(Array.isArray(departments)
        ? departments.map((dept: Department) => ({
          value: dept.id,
          label: dept.name,
        }))
        : []),
    ],
    [departments]
  );

  const shiftOptions = useMemo(
    () => [
      { value: "", label: "All Shifts" },
      ...(Array.isArray(shifts)
        ? shifts.map((shift: { id: string; name: string }) => ({
          value: shift.id,
          label: shift.name,
        }))
        : []),
    ],
    [shifts]
  );

  const statusOptions = useMemo(
    () => [
      { value: "", label: "All" },
      { value: "PRESENT", label: "Present" },
      { value: "DEFAULT", label: "Absent" },
      { value: "LATE", label: "Late" },
      { value: "ON_LEAVE", label: "Leave" },
    ],
    []
  );

  useEffect(() => {
    dispatch(fetchAllDepartments);
    dispatch(fetchAllDesignations);
    dispatch(fetchAllShifts);
  }, [dispatch]);

  const formatTime = (timeStr: string | null): string | null => {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hh = h % 12 || 12;
    return `${hh.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")} ${ampm}`;
  };

  const mapToAttendance = useCallback(
    (item: any): Attendance => {
      const user = item.user;
      const employee = user.employee;
      let status: "PRESENT" | "Absent" | "Late" | "ON_LEAVE" = "Absent";
      if (item.status === "PRESENT") {
        status = "PRESENT";
      } else if (item.status === "DEFAULT") {
        status = "Absent";
      } else if (item.status === "ON_LEAVE") {
        status = "ON_LEAVE";
      } else if (item.lateMinutes > 0) {
        status = "Late";
      }
      const shiftName =
        shifts?.find((shift: { id: string }) => shift.id === item.shiftId)
          ?.name ||
        item.shiftId ||
        "Morning";
      const normalizedShift: "Morning" | "Evening" = shiftName
        .toLowerCase()
        .includes("evening")
        ? "Evening"
        : "Morning";

      return {
        id: item.id,
        userId: item.userId,
        selected: false,
        employee: {
          name: `${user.firstName} ${user.lastName || ""}`,
          designation:
            designations?.find(
              (des: { id: string }) => des.id === employee.designationId
            )?.title || "",
          profileUrl: user.pictureUrl || null,
        },
        department: {
          id: employee.departmentId,
          name:
            departments?.find(
              (dept: { id: string }) => dept.id === employee.departmentId
            )?.name || "",
        },
        status,
        lockWorkingHours: item.lockWorkingHours
          ? Number(item.lockWorkingHours)
          : null,
        isLate: item.lateMinutes > 0,
        checkInTime: formatTime(item.checkInTime),
        checkOutTime: formatTime(item.checkOutTime),
        totalHours: item.totalWorkingHours
          ? Number(item.totalWorkingHours)
          : null,
        shift: normalizedShift,
        shiftId: item.shiftId,
        date: item.date,
        comment: item.notes || null,
        totalWorkingDays: 0,
        daysPresent: 0,
        daysAbsent: 0,
        daysLate: item.lateMinutes > 0 ? 1 : 0,
        clockInTime: item.checkInTime || null,
      };
    },
    [departments, designations, shifts]
  );

  const buildFilters = useCallback(() => {
    // Format using local date parts so the picked calendar day isn't shifted
    // back by toISOString()'s UTC conversion (off-by-one in +UTC timezones).
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const filters: GetAttendancePayload["queryOptionsRequest"] = {
      filtersRequest: [],
      sortRequest: [
        {
          field: sortConfig.field,
          direction: sortConfig.direction,
          priority: 1,
        },
      ],
      includes: ["user", "user.employee"],
    };

    // Only include date filter if both startDate and endDate are explicitly set
    if (
      selectedRange.startDate &&
      selectedRange.endDate &&
      selectedRange.startDate !== null &&
      selectedRange.endDate !== null
    ) {
      filters.filtersRequest.push({
        field: "date",
        operator: 1,
        matchMode: 10,
        rangeValues: {
          start: formatLocalDate(selectedRange.startDate),
          end: formatLocalDate(selectedRange.endDate),
        },
      });
    }

    if (selectedDepartment && selectedDepartment !== "") {
      filters.filtersRequest.push({
        field: "user.employee.departmentId",
        operator: 1,
        matchMode: 1,
        value: selectedDepartment,
      });
    }

    if (selectedShift && selectedShift !== "") {
      filters.filtersRequest.push({
        field: "shiftId",
        operator: 1,
        matchMode: 1,
        value: selectedShift,
      });
    }

    if (selectedStatus && selectedStatus !== "") {
      filters.filtersRequest.push({
        field: "status",
        operator: 1,
        matchMode: 1,
        value:
          selectedStatus === "Late" ? "PRESENT" : selectedStatus.toUpperCase(),
      });

      if (selectedStatus === "Late") {
        filters.filtersRequest.push({
          field: "lateMinutes",
          operator: 1,
          matchMode: 2,
          value: 0,
        });
      }
    }

    return filters;
  }, [
    selectedRange,
    selectedDepartment,
    selectedShift,
    selectedStatus,
    sortConfig,
  ]);

  const fetchAttendance = useCallback(
    async (
      page: number,
      filters: GetAttendancePayload["queryOptionsRequest"]
    ) => {
      const payload: GetAttendancePayload = {
        pagedListRequest: {
          pageNo: page,
          pageSize: itemsPerPage,
          getAllRecords: false,
        },
        queryOptionsRequest: filters,
      };

      try {
        dispatch(setIsLoading(true));
        const response = await fetchAllAttendance(dispatch, payload);
        if (response && response.result) {
          const mappedData = response.result.data.map(mapToAttendance);
          setLocalData(mappedData);
          setTotalPages(response.result.numberOfPages);
          setTotalItems(response.result.total);
        } else {
          console.error("Invalid API response: No result found");
          toast.error("Failed to fetch attendance records");
        }
      } catch (error) {
        console.error("Failed to fetch attendance:", error);
        toast.error("Failed to fetch attendance records");
      } finally {
        dispatch(setIsLoading(false));
      }
    },
    [dispatch, mapToAttendance]
  );

  useEffect(() => {
    const filters = buildFilters();
    fetchAttendance(currentPage, filters);
  }, [
    currentPage,
    selectedDepartment,
    selectedShift,
    selectedStatus,
    selectedRange,
    sortConfig,
    fetchAttendance,
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

  const handleSortChange = (
    columnId: string,
    isSorted: false | "asc" | "desc"
  ) => {
    if (isSorted) {
      setSortConfig({
        field: columnId,
        direction: isSorted === "asc" ? 0 : 1,
      });
    } else {
      setSortConfig({
        field: "date",
        direction: 1,
      });
    }
  };

  useEffect(() => {
    const selected = localData.filter((att) => att.selected);
    setSelectedRows(selected);
  }, [localData]);

  useEffect(() => {
    if (isDateModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isDateModalOpen]);

  return (
    <>
      <div className="border-[1px] bg-g-background-100 py-6 border-g-gray-alpha-400 rounded-[var(--g-radius-md)] mx-auto">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center px-6 mb-6">
          <div className="flex items-center gap-2">
            <h3 className="text-heading-16 text-g-gray-1000">
              Attendance List
            </h3>
            <CountBadge count={totalItems} />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* <CustomDropdown
              id="department-filter"
              name="department"
              options={departmentOptions}
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              placeholder="Select Department"
            /> */}
            <CustomDropdown
              id="shift-filter"
              name="shift"
              options={shiftOptions}
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              placeholder="Select Shift"
            />
            <CustomDropdown
              id="status-filter"
              name="status"
              options={statusOptions}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              placeholder="Select Status"
            />
            <DateRangeField
              name="dateRange"
              value={{
                startDate: selectedRange.startDate,
                endDate: selectedRange.endDate,
              }}
              onChange={handleRangeSelect}
              onCustomSelect={handleOpenDateModal}
              placeholder="Select Date Range"
            />
          </div>
        </div>

        <DateRangePickerModal
          isOpen={isDateModalOpen}
          onClose={handleCloseDateModal}
          onSave={handleSaveRange}
          initialRange={selectedRange}
        />

        <div className="relative">
          <TanstackTable
            columns={AdminattendanceColumns}
            data={localData}
            className=""
            showCheckboxes={true}
            selectedRows={selectedRows}
            isLoading={isLoading}
            enableSorting={false}
            meta={{
              toggleRowSelection,
              selectedRows,
              router,
              onSortChange: handleSortChange,
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
    </>
  );
};

export default AttendanceTable;
