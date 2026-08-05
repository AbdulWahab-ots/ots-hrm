// In src/components/VocationTable.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FiEye } from "react-icons/fi";
import Button from "@/components/common/Button";
import { TanstackTable } from "../../common/TanstackTable";
import CustomModal from "../../common/CustomModal";
import SearchInput from "@/components/common/form/SearchInput";
import CustomDropdown from "@/components/common/form/DropDown";
import DateRangeField from "@/components/common/form/DateRangeField";
import DateRangePickerModal from "@/components/common/form/DateRangePickerModal";
import ClockedOutCard from "./Views";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import {
  fetchAllDepartments,
  fetchAllLeaveTypes,
} from "@/services/adminServices";
import {
  Vocation,
  GetVacationsPayload,
  QueryOptionsRequest,
} from "@/utils/company";
import { setIsLoading } from "@/store/features/global/globalSlice";
import { vocationColumns } from "@/utils/Columns/vocationColumns";
import { getAllVacationsAPI } from "@/services/employeeService";
import CountBadge from "@/components/common/CountBadge";
import { businessStartOfDayUTC, businessEndOfDayUTC } from "@/utils/timezone";

const VocationTable = () => {
  const [localData, setLocalData] = useState<Vocation[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<Vocation | null>(null);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedLeaveType, setSelectedLeaveType] = useState("");
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

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  // Select departments, leave types, and refreshLeaves from Redux store
  const departments = useSelector(
    (state: RootState) => state.department.departmentData
  );
  const leaveTypes = useSelector(
    (state: RootState) => state.leaveType.leaveTypeData
  );
  const refreshLeaves = useSelector(
    (state: RootState) => state.global.refreshLeaves
  ); // Add refreshLeaves

  // Dynamic leave type options from API
  const leaveTypeOptions = [
    { value: "", label: "All" },
    ...(leaveTypes?.map((leaveType: any) => ({
      value: leaveType.id,
      label: leaveType.name,
    })) || []),
  ];

  // Static status options
  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
  ];

  // Fetch departments and leave types on component mount
  useEffect(() => {
    if (!leaveTypes || leaveTypes.length === 0) {
      dispatch(fetchAllLeaveTypes);
    }
  }, [dispatch, departments, leaveTypes]);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const fetchLeaves = useCallback(
    async (
      page: number,
      filters: GetVacationsPayload["queryOptionsRequest"]
    ) => {
      const payload: GetVacationsPayload = {
        pagedListRequest: {
          pageNo: page,
          pageSize: 5,
          getAllRecords: false,
        },
        queryOptionsRequest: {
          filtersRequest: [...filters.filtersRequest],
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
        if (response && response.result) {
          setLocalData(response.result.data);
          setTotalPages(response.result.numberOfPages);
          setTotalItems(response.result.total);
        } else {
          console.error("Invalid API response: No result found");
        }
      } catch (error) {
        console.error("Failed to fetch leaves:", error);
      } finally {
        setLocalIsLoading(false);
        dispatch(setIsLoading(false));
      }
    },
    [dispatch]
  );

  const buildFilters = (): QueryOptionsRequest => {
    const filters: QueryOptionsRequest = {
      filtersRequest: [
        // This page is specifically the Leaves List - without this, the shared
        // /vacation/get_all endpoint would also return remote-work requests.
        {
          field: "requestType",
          operator: 1,
          matchMode: 1,
          value: "LEAVE",
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
    };

    if (selectedRange.startDate && selectedRange.endDate) {
      filters.filtersRequest.push({
        field: "createdAt",
        operator: 1,
        matchMode: 10,
        rangeValues: {
          // createdAt is a full timestamp column, not a bare date. A bare "yyyy-MM-dd"
          // string is ambiguous - the backend parses it using the SERVER's own OS
          // timezone (not necessarily BUSINESS_TIMEZONE or even UTC), which can shift
          // the range by hours and make it match nothing. These helpers resolve the
          // correct absolute UTC instant for start/end of day in BUSINESS_TIMEZONE.
          start: businessStartOfDayUTC(selectedRange.startDate),
          end: businessEndOfDayUTC(selectedRange.endDate),
        },
      });
    }

    if (selectedStatus && selectedStatus !== "") {
      filters.filtersRequest.push({
        field: "status",
        operator: 1,
        matchMode: 1,
        value: selectedStatus,
      });
    }

    if (selectedLeaveType && selectedLeaveType !== "") {
      // typeId is the actual FK column on Vacation - "leaveType" is only the relation
      // name and doesn't filter correctly against a raw id value.
      filters.filtersRequest.push({
        field: "typeId",
        operator: 1,
        matchMode: 1,
        value: selectedLeaveType,
      });
    }

    if (debouncedSearchTerm) {
      // Vacation has no "name" column - the employee's name lives on the joined
      // requestedByUser relation. Match either first or last name (Or'd together,
      // each still scoped by the And filters above via the query builder).
      filters.filtersRequest.push({
        field: "requestedByUser.firstName",
        operator: 2,
        matchMode: 7,
        ignoreCase: true,
        value: debouncedSearchTerm,
      });
      filters.filtersRequest.push({
        field: "requestedByUser.lastName",
        operator: 2,
        matchMode: 7,
        ignoreCase: true,
        value: debouncedSearchTerm,
      });
    }

    return filters;
  };

  // Re-fetch leaves when filters or refreshLeaves change
  useEffect(() => {
    const filters = buildFilters();
    fetchLeaves(currentPage, filters);
  }, [
    currentPage,
    selectedStatus,
    selectedLeaveType,
    debouncedSearchTerm,
    selectedRange,
    fetchLeaves,
    refreshLeaves, // Add refreshLeaves as a dependency
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

  const handleView = (leave: Vocation) => {
    setSelectedLeave(leave);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (isModalOpen || isDateModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isModalOpen, isDateModalOpen]);

  return (
    <div className="border-[1px] mt-6 bg-g-background-100 py-6 border-g-gray-alpha-400 rounded-[var(--g-radius-md)] shadow-geist-card mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center px-6 mb-6 gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg text-g-gray-1000 font-medium">Leaves List</h3>
          <CountBadge count={totalItems} />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <CustomDropdown
              id="status-filter"
              name="status"
              options={statusOptions}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              placeholder="Status"
            />
            <CustomDropdown
              id="leave-type-filter"
              name="leaveType"
              options={leaveTypeOptions}
              value={selectedLeaveType}
              onChange={(e) => setSelectedLeaveType(e.target.value)}
              placeholder="Leave Type"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <DateRangeField
              name="dateRange"
              value={{
                startDate: selectedRange.startDate,
                endDate: selectedRange.endDate,
              }}
              onChange={handleRangeSelect}
              onCustomSelect={handleOpenDateModal}
              placeholder="Date"
            />
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Employee Name"
              id="leave-search"
              name="leaveSearch"
            />
          </div>
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
          columns={vocationColumns}
          data={localData}
          className=""
          showCheckboxes={false}
          isLoading={isLoading}
          meta={{ handleView, router }}
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
        onClose={() => setIsModalOpen(false)}
        title="Leave Details"
        variant="bottom-full"
      >
        {selectedLeave && <ClockedOutCard leave={selectedLeave} />}
      </CustomModal>
    </div>
  );
};

export default VocationTable;
