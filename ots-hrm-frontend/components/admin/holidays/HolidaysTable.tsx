"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { ArrowUpToLine, Plus } from "lucide-react";
import DeleteConfirmationModal from "../../common/DeleteConfirmation";
import Button from "@/components/common/Button";
import { TanstackTable } from "../../common/TanstackTable";
import CustomModal from "../../common/CustomModal";
import SearchInput from "@/components/common/form/SearchInput";
import CustomDropdown from "@/components/common/form/DropDown";
import DateRangeField from "@/components/common/form/DateRangeField";
import DateRangePickerModal from "@/components/common/form/DateRangePickerModal";
import CreateHoliday from "./CeateHolidaysForm/CreateHoliday";
import SuccessConfirmation from "../../common/SuccessConfirmation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import {
  getAllHolidaysAPI,
  deleteHolidayAPI,
  updateHolidayAPI,
  createHolidayAPI,
  fetchAllDepartments,
  fetchAllLeaveTypes,
  fetchAllCountries,
} from "@/services/adminServices";
import {
  Holiday,
  GetHolidaysPayload,
  Department,
  LeaveType,
} from "@/utils/types";
import { setIsLoading } from "@/store/features/global/globalSlice";
import { holidayColumns } from "@/utils/Columns/holidayColumns";
import { FormikHelpers } from "formik";
import CountBadge from "@/components/common/CountBadge";

const HolidaysTable = () => {
  const [localData, setLocalData] = useState<Holiday[]>([]);
  const [selectedRows, setSelectedRows] = useState<Holiday[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [holidayToDelete, setHolidayToDelete] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [holidayToEdit, setHolidayToEdit] = useState<Holiday | null>(null);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
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
  const [hasInitialized, setHasInitialized] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const departments = useSelector(
    (state: RootState) => state.department.departmentData
  );
  const leaveTypes = useSelector(
    (state: RootState) => state.leaveType.leaveTypeData
  );
  const countries = useSelector(
    (state: RootState) => state.country.countryData
  );

  const departmentOptions = [
    { value: "", label: "All" },
    ...(departments?.map((dept: Department) => ({
      value: dept.id,
      label: dept.name,
    })) || []),
  ];

  const leaveTypeOptions = useMemo(() => {
    const options = [
      { value: "", label: "All" },
      { value: "NATIONAL", label: "National" },
      { value: "RELIGIOUS", label: "Religious" },
      { value: "CULTURAL", label: "Cultural" },
      { value: "REGIONAL", label: "Regional" },
      { value: "COMPANY", label: "Company" },
      { value: "OTHER", label: "Other" },
    ];
    return options;
  }, []);

  useEffect(() => {
    if (!hasInitialized) {
      if (!departments || departments.length === 0) {
        dispatch(fetchAllDepartments);
      }
      if (!countries?.data || countries.data.length === 0) {
        dispatch(fetchAllCountries);
      }
      setHasInitialized(true);
    }
  }, [dispatch, departments, leaveTypes, countries?.data, hasInitialized]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const fetchHolidays = useCallback(
    async (
      page: number,
      filters: GetHolidaysPayload["queryOptionsRequest"]
    ) => {
      const payload: GetHolidaysPayload = {
        pagedListRequest: {
          pageNo: page,
          pageSize: 5,
          getAllRecords: false,
        },
        queryOptionsRequest: {
          filtersRequest: filters.filtersRequest,
          sortRequest: [
            {
              field: "createdAt",
              direction: 1,
              priority: 1,
            },
          ],
          includes: ["department"],
        },
      };

      try {
        setLocalIsLoading(true);
        dispatch(setIsLoading(true));
        const response = await getAllHolidaysAPI(dispatch, payload);
        if (response && response.result) {
          setLocalData(
            response.result.data.map((holiday) => ({
              ...holiday,
              selected: false,
            }))
          );
          setTotalPages(response.result.numberOfPages);
          setTotalItems(response.result.total);
        } else {
          console.error("Failed to fetch holidays: No data available");
          setLocalData([]);
        }
      } catch (error: any) {
        console.error(
          error?.response?.data?.message || "Failed to fetch holidays"
        );
        setLocalData([]);
        console.error("Failed to fetch holidays:", error);
      } finally {
        setLocalIsLoading(false);
        dispatch(setIsLoading(false));
      }
    },
    [dispatch]
  );

  const handleDelete = async () => {
    try {
      setLocalIsLoading(true);
      dispatch(setIsLoading(true));
      if (isBulkDelete && selectedRows.length > 0) {
        const deletePromises = selectedRows.map((holiday) =>
          deleteHolidayAPI(dispatch, holiday.id)
        );
        const results = await Promise.all(deletePromises);
        if (results.every((result) => result)) {
          const filters = buildFilters();
          await fetchHolidays(currentPage, filters);
        }
      } else if (holidayToDelete) {
        const success = await deleteHolidayAPI(dispatch, holidayToDelete);
        if (success) {
          const filters = buildFilters();
          await fetchHolidays(currentPage, filters);
        }
      }
    } catch (error: any) {
      console.error(
        error?.response?.data?.message || "Failed to delete holiday(s)"
      );
      console.error("An error occurred during deletion:", error);
    } finally {
      setIsDeleteModalOpen(false);
      setHolidayToDelete(null);
      setIsBulkDelete(false);
      setSelectedRows([]);
      setLocalIsLoading(false);
      dispatch(setIsLoading(false));
    }
  };

  const buildFilters = useCallback(() => {
    const filters: GetHolidaysPayload["queryOptionsRequest"] = {
      filtersRequest: [],
      sortRequest: [
        {
          field: "createdAt",
          direction: 1,
          priority: 1,
        },
      ],
      includes: ["department"],
    };

    if (selectedRange.startDate && selectedRange.endDate) {
      filters.filtersRequest.push({
        field: "createdAt",
        operator: 1,
        matchMode: 10,
        rangeValues: {
          start: format(selectedRange.startDate, "yyyy-MM-dd"),
          end: format(selectedRange.endDate, "yyyy-MM-dd"),
        },
      });
    }

    if (selectedDepartment && selectedDepartment !== "") {
      filters.filtersRequest.push({
        field: "departmentId",
        operator: 1,
        matchMode: 1,
        value: selectedDepartment,
      });
    }

    if (selectedLeaveType && selectedLeaveType !== "") {
      filters.filtersRequest.push({
        field: "type",
        operator: 1,
        matchMode: 1,
        value: selectedLeaveType,
      });
    }

    if (debouncedSearchTerm) {
      filters.filtersRequest.push({
        field: "name",
        operator: 1,
        matchMode: 7,
        value: debouncedSearchTerm,
        ignoreCase: true,
      });
    }

    return filters;
  }, [
    selectedRange,
    selectedDepartment,
    selectedLeaveType,
    debouncedSearchTerm,
  ]);

  const memoizedSelectedRange = useMemo(
    () => ({
      startDate: selectedRange.startDate
        ? new Date(selectedRange.startDate)
        : null,
      endDate: selectedRange.endDate ? new Date(selectedRange.endDate) : null,
    }),
    [selectedRange.startDate?.getTime(), selectedRange.endDate?.getTime()]
  );

  const memoizedFilters = useMemo(
    () => buildFilters(),
    [
      buildFilters,
      memoizedSelectedRange,
      selectedDepartment,
      selectedLeaveType,
      debouncedSearchTerm,
    ]
  );

  useEffect(() => {
    if (hasInitialized) {
      fetchHolidays(currentPage, memoizedFilters);
    }
  }, [currentPage, memoizedFilters, fetchHolidays, hasInitialized]);

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
      prevData.map((holiday) =>
        holiday.id === id
          ? { ...holiday, selected: !holiday.selected }
          : holiday
      )
    );
  };
  const toggleAllRowsSelection = (selectAll: boolean) => {
    setLocalData((prevData) =>
      prevData.map((holiday) => ({
        ...holiday,
        selected: selectAll,
      }))
    );
  };

  const handleEdit = (holiday: Holiday) => {
    if (!holiday) {
      console.error("Attempted to edit undefined holiday");
      return;
    }
    if (!departments || departments.length === 0) {
      dispatch(fetchAllDepartments);
    }
    if (!leaveTypes || leaveTypes.length === 0) {
      dispatch(fetchAllLeaveTypes);
    }
    if (!countries?.data || countries.data.length === 0) {
      dispatch(fetchAllCountries);
    }
    setHolidayToEdit(holiday);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    if (!departments || departments.length === 0) {
      dispatch(fetchAllDepartments);
    }
    if (!leaveTypes || leaveTypes.length === 0) {
      dispatch(fetchAllLeaveTypes);
    }
    if (!countries?.data || countries.data.length === 0) {
      dispatch(fetchAllCountries);
    }
    setHolidayToEdit(null);
    setIsModalOpen(true);
  };

  const handleCreateOrEditHoliday = async (
    values: {
      name: string;
      dates: string[];
      isMultiple: boolean;
      type: string;
      description: string;
      whichCountryId: string;
      departmentId: string;
    },
    formikHelpers: FormikHelpers<any>
  ) => {
    try {
      dispatch(setIsLoading(true));
      const payload = {
        name: values.name,
        dates: values.dates,
        isMultiple: values.isMultiple,
        type: values.type,
        description: values.description || `${values.name} holiday`,
        whichCountryId: values.whichCountryId,
        departmentId: values.departmentId,
      };

      let response;
      if (holidayToEdit) {
        response = await updateHolidayAPI(dispatch, payload, holidayToEdit.id);
      } else {
        response = await createHolidayAPI(dispatch, payload);
      }

      if (response) {
        setSuccessMessage(
          `Holiday ${values.name} has been ${holidayToEdit ? "updated" : "created"
          } successfully!`
        );
        setIsSuccessModalOpen(true);
        setIsModalOpen(false);
        const filters = buildFilters();
        await fetchHolidays(currentPage, filters);
      } else {
        throw new Error("API returned false");
      }
    } catch (error: any) {
      console.error("Operation failed:", error);
      if (error?.errors && Array.isArray(error.errors)) {
        formikHelpers.setErrors(
          error.errors.reduce(
            (acc: any, err: { field: string; message: string }) => ({
              ...acc,
              [err.field]: err.message,
            }),
            {}
          )
        );
      } else {
        formikHelpers.setStatus(
          error?.response?.data?.message ||
          "An unexpected error occurred. Please try again."
        );
      }
      setIsSuccessModalOpen(false);
    } finally {
      dispatch(setIsLoading(false));
    }
  };

  useEffect(() => {
    const selected = localData.filter((holiday) => holiday.selected);
    setSelectedRows(selected);
  }, [localData]);

  useEffect(() => {
    if (
      isDeleteModalOpen ||
      isModalOpen ||
      isDateModalOpen ||
      isSuccessModalOpen
    ) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isDeleteModalOpen, isModalOpen, isDateModalOpen, isSuccessModalOpen]);

  return (
    <>
      <div className="flex justify-between items-center pb-4">
        <h2 className="text-g-gray-1000 text-xl sm:text-2xl md:text-3xl font-semibold">
          Holidays
        </h2>
        <div className="flex gap-4">
          <Button
            icon={ArrowUpToLine}
            variant="outline"
            iconPosition="center"
          />
          <Button
            icon={Plus}
            variant="filled"
            label="Add New"
            onClick={handleCreate}
          />
        </div>
      </div>
      <div className="border-[1px] bg-g-background-100 py-6 border-g-gray-alpha-400 rounded-[var(--g-radius-md)] shadow-geist-card mx-auto">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center px-6 mb-6 gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-heading-16 text-g-gray-1000">Holidays List</h3>
            <CountBadge count={totalItems} />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex gap-2">
              <CustomDropdown
                id="department-filter"
                name="department"
                options={departmentOptions}
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                placeholder="Department"
              />
              <CustomDropdown
                id="leave-type-filter"
                name="leaveType"
                options={leaveTypeOptions}
                value={selectedLeaveType}
                onChange={(e) => setSelectedLeaveType(e.target.value)}
                placeholder="Type"
              />
            </div>
            <div className="flex gap-2">
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
                placeholder="Holiday Name"
                id="holiday-search"
                name="holidaySearch"
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
            columns={holidayColumns}
            data={localData}
            className=""
            showCheckboxes={true}
            selectedRows={selectedRows}
            isLoading={isLoading}
            showBulkDelete={true}
            meta={{
              toggleRowSelection,
              selectedRows,
              toggleAllRowsSelection,
              setIsBulkDelete,
              setIsDeleteModalOpen,
              setHolidayToDelete,
              handleEdit,
              router,
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

        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onCancel={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          isLoading={isLoading}
          TextMessage="Holiday will be deleted, and unfortunately, you won't be able to get it back."
        />

        <CustomModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={holidayToEdit ? "Edit Holiday" : "Create Holiday"}
          variant="bottom-full"
        >
          <CreateHoliday
            initialValues={
              holidayToEdit
                ? {
                  name: holidayToEdit.name || "",
                  dates: holidayToEdit.dates || [],
                  isMultiple: holidayToEdit.isMultiple || false,
                  type: holidayToEdit.type || "",
                  description: holidayToEdit.description || "",
                  whichCountryId: holidayToEdit.whichCountryId || "",
                  departmentId: holidayToEdit.departmentId || "",
                }
                : {
                  name: "",
                  dates: [],
                  isMultiple: false,
                  type: "",
                  description: "",
                  whichCountryId: "",
                  departmentId: "",
                }
            }
            onSubmit={handleCreateOrEditHoliday}
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
    </>
  );
};

export default HolidaysTable;
