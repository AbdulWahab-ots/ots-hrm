"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/common/Button";
import { TanstackTable } from "../../common/TanstackTable";
import CustomModal from "../../common/CustomModal";

import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";

import {
  Vocation,
  GetVacationsPayload,
  QueryOptionsRequest,
} from "@/utils/company";
import { setIsLoading } from "@/store/features/global/globalSlice";
import { AdminVocationColumns } from "@/utils/Columns/AdminVocationColumns";
import { getAllVacationsAPI } from "@/services/employeeService";
import ManagementView from "./ManagementView";
import CountBadge from "@/components/common/CountBadge";
import {
  nowBusiness,
  businessStartOfDayAsStoredTimestamp,
  businessEndOfDayAsStoredTimestamp,
} from "@/utils/timezone";

const VocationTable = () => {
  const [localData, setLocalData] = useState<Vocation[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<Vocation | null>(null);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);

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
  const [activeFilter, setActiveFilter] = useState<
    "all" | "Pending" | "Approved" | "Rejected"
  >("all");
  const [activeTimeFilter, setActiveTimeFilter] = useState<
    "daily" | "weekly" | "monthly" | "yearly"
  >("daily");

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
  );

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
      filtersRequest: [],
      sortRequest: [
        {
          field: "createdAt",
          direction: 1,
          priority: 1,
        },
      ],
      includes: ["leaveType", "requestedByUser", "leaveType.department"],
    };

    // Add date range filter if custom range is selected
    if (selectedRange.startDate && selectedRange.endDate) {
      filters.filtersRequest.push({
        field: "createdAt",
        operator: 1,
        matchMode: 10,
        rangeValues: {
          start: businessStartOfDayAsStoredTimestamp(selectedRange.startDate),
          end: businessEndOfDayAsStoredTimestamp(selectedRange.endDate),
        },
      });
    }

    // Add status filter
    if (selectedStatus && selectedStatus !== "") {
      filters.filtersRequest.push({
        field: "status",
        operator: 1,
        matchMode: 1,
        value: selectedStatus,
      });
    }

    // Add leave type filter
    if (selectedLeaveType && selectedLeaveType !== "") {
      filters.filtersRequest.push({
        field: "leaveType",
        operator: 1,
        matchMode: 1,
        value: selectedLeaveType,
      });
    }

    // Add search term filter
    // if (debouncedSearchTerm) {
    //   filters.filtersRequest.push({
    //     field: "name",
    //     operator: 1,
    //     matchMode: 1,
    //     value: debouncedSearchTerm,
    //   });
    // }

    // Apply time-based filter (daily, weekly, monthly, yearly). Each window is
    // "N days back through today (inclusive)" - daily/weekly/monthly/yearly are
    // strictly nested supersets of each other, so switching to a wider window can
    // only add rows, never remove them. (The previous "weekly" implementation
    // snapped to a fixed Sunday-aligned calendar week that could land entirely in
    // the past relative to today, making it show FEWER rows than "daily" - backwards.)
    const now = nowBusiness();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (activeTimeFilter === "daily") {
      startDate = new Date(now);
      endDate = new Date(now);
    } else if (activeTimeFilter === "weekly") {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 6); // last 7 days, inclusive of today
      endDate = new Date(now);
    } else if (activeTimeFilter === "monthly") {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
      endDate = new Date(now);
    } else if (activeTimeFilter === "yearly") {
      startDate = new Date(now.getFullYear(), 0, 1); // January 1st of the current year
      endDate = new Date(now);
    }

    if (startDate && endDate) {
      filters.filtersRequest.push({
        field: "createdAt",
        operator: 1,
        matchMode: 10,
        rangeValues: {
          // createdAt is a real timestamp column, but is populated via `new Date()`
          // in backend app code and written into a `timestamp` (no time zone)
          // column - Postgres silently drops the offset on insert, keeping only
          // the server OS's (Asia/Karachi) wall-clock digits. These helpers
          // re-express the business-day boundary in that same representation,
          // rather than as a true UTC instant (which would be off by the
          // NY<->Karachi offset for this column).
          start: businessStartOfDayAsStoredTimestamp(startDate),
          end: businessEndOfDayAsStoredTimestamp(endDate),
        },
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
    // debouncedSearchTerm,
    selectedRange,
    activeTimeFilter,
    refreshLeaves,
    fetchLeaves,
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

  const handleFilterChange = (
    filter: "all" | "Pending" | "Approved" | "Rejected"
  ) => {
    setActiveFilter(filter);
    setSelectedStatus(filter === "all" ? "" : filter.toUpperCase());
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
    <>
      <h2 className="flex sm:gap-4 font-semibold my-6">
        <button
          onClick={() => handleFilterChange("all")}
          className={`px-3 md:px-6 md:py-4 px-3 py-2 text-[14px] sm:text-base cursor-pointer rounded-[var(--g-radius-full)] ${activeFilter === "all"
            ? "bg-g-background-100 text-(--primary-dark-gray) border-[1px] border-(--genrel-light-stroke)"
            : "text-(--general-extra-light)"
            }`}
        >
          All
        </button>
        <button
          onClick={() => handleFilterChange("Pending")}
          className={`px-3 md:px-6 md:py-4 px-3 py-2 text-[14px] sm:text-base cursor-pointer rounded-[var(--g-radius-full)] ${activeFilter === "Pending"
            ? "bg-g-background-100 text-(--primary-dark-gray) border-[1px] border-(--genrel-light-stroke)"
            : "text-(--general-extra-light)"
            }`}
        >
          Pending
        </button>
        <button
          onClick={() => handleFilterChange("Approved")}
          className={`px-3 md:px-6 md:py-4 px-3 py-2 text-[14px] sm:text-base cursor-pointer rounded-[var(--g-radius-full)] ${activeFilter === "Approved"
            ? "bg-g-background-100 text-(--primary-dark-gray) border-[1px] border-(--genrel-light-stroke)"
            : "text-(--general-extra-light)"
            }`}
        >
          Approved
        </button>
        <button
          onClick={() => handleFilterChange("Rejected")}
          className={`px-3 md:px-6 md:py-4 px-3 py-2 cursor-pointer text-[14px] sm:text-base rounded-[var(--g-radius-full)] ${activeFilter === "Rejected"
            ? "bg-g-background-100 text-(--primary-dark-gray) border-[1px] border-(--genrel-light-stroke)"
            : "text-(--general-extra-light)"
            }`}
        >
          Rejected
        </button>
      </h2>
      <div className="border border-g-gray-alpha-400 mt-6 bg-g-background-100 py-6 rounded-[var(--g-radius-md)] mx-auto shadow-geist-card">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center px-6 mb-6 gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-heading-16 text-g-gray-1000">Leaves List</h3>
            <CountBadge count={totalItems} />
          </div>
          <ul className="inline-flex gap-1 border border-(--genrel-light-stroke) bg-(--primary-alpha-5) rounded-[var(--g-radius-full)] p-1">
            {(["daily", "weekly", "monthly", "yearly"] as const).map(
              (filter) => (
                <li
                  key={filter}
                  className={`px-4 py-3 ${activeTimeFilter === filter
                    ? "bg-(--primary-alpha-5) text-(--primary-blue-500)"
                    : "text-(--general-extra-light)"
                    } rounded-[var(--g-radius-full)] text-sm font-semibold cursor-pointer`}
                  onClick={() => setActiveTimeFilter(filter)}
                >
                  {filter.charAt(0).toUpperCase()}
                </li>
              )
            )}
          </ul>
        </div>

        <div className="relative">
          <TanstackTable
            columns={AdminVocationColumns}
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
          onClose={() => {
            setIsModalOpen(false);
            // Re-fetch leaves to update the table
            const filters = buildFilters();
            fetchLeaves(currentPage, filters);
          }}
          title="Leave Details"
          variant="bottom-full"
        >
          {selectedLeave && (
            <ManagementView leaveId={selectedLeave.createdById} />
          )}
        </CustomModal>
      </div>
    </>
  );
};

export default VocationTable;
