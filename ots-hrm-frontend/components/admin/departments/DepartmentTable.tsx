"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import CreateDepartment from "./createDepartment/createDepartmentForm";
import SuccessConfirmation from "../../common/SuccessConfirmation";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import {
  getAllDepartmentAPI,
  deleteDepartmentAPI,
  updateDepartmentAPI,
  createDepartmentAPI,
} from "@/services/adminServices";
import { Department, GetDepartmentsPayload } from "@/utils/types";
import { setIsLoading } from "@/store/features/global/globalSlice";
import { departmentColumns } from "@/utils/departmentColumns";
import CountBadge from "@/components/common/CountBadge";
import {
  businessStartOfDayAsStoredTimestamp,
  businessEndOfDayAsStoredTimestamp,
} from "@/utils/timezone";

const DepartmentTable = () => {
  const [localData, setLocalData] = useState<Department[]>([]);
  const [selectedRows, setSelectedRows] = useState<Department[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<string | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [departmentToEdit, setDepartmentToEdit] = useState<Department | null>(
    null
  );
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedRange, setSelectedRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: null,
    endDate: null,
  });
  const [departmentDataForUsers, setDepartmentDataForUsers] = useState<{
    name: string;
    code: string;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setLocalIsLoading] = useState(false);
  const itemsPerPage = 5;

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const [departmentOptions, setDepartmentOptions] = useState<
    { value: string; label: string }[]
  >([]);

  const daysOfWeek = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ];

  // Debouncing search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const fetchDepartments = useCallback(
    async (
      page: number,
      filters: GetDepartmentsPayload["queryOptionsRequest"]
    ) => {
      const payload: GetDepartmentsPayload = {
        pagedListRequest: {
          pageNo: page,
          pageSize: itemsPerPage,
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
          includes: ["workingDays"],
        },
      };

      try {
        setLocalIsLoading(true);
        dispatch(setIsLoading(true));
        const response = await getAllDepartmentAPI(dispatch, payload);
        if (response && response.result) {
          // Ensure workingDays is always an array
          setLocalData(
            response.result.data.map((department) => ({
              ...department,
              workingDays: Array.isArray(department.workingDays)
                ? department.workingDays
                : daysOfWeek.map((day, index) => ({
                  dayOfWeek: index + 1,
                  dayName: day,
                  isWorkingDay: false,
                  notes: null,
                })),
              selected: false,
            }))
          );
          setTotalPages(response.result.numberOfPages);
          setTotalItems(response.result.total);
        } else {
          console.error("Invalid API response: No result found");
        }
      } catch (error) {
        console.error("Failed to fetch departments:", error);
      } finally {
        setLocalIsLoading(false);
        dispatch(setIsLoading(false));
      }
    },
    [dispatch]
  );

  const fetchDepartmentOptions = useCallback(async () => {
    const payload: GetDepartmentsPayload = {
      pagedListRequest: { pageNo: 1, pageSize: 1000, getAllRecords: true },
      queryOptionsRequest: { filtersRequest: [], sortRequest: [], includes: [] },
    };
    try {
      const response = await getAllDepartmentAPI(dispatch, payload);
      if (response?.result) {
        setDepartmentOptions(
          response.result.data.map((department) => ({
            value: department.name,
            label: department.name,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch department options:", error);
    }
  }, [dispatch]);

  const handleDelete = async () => {
    try {
      setLocalIsLoading(true);
      dispatch(setIsLoading(true));
      if (isBulkDelete && selectedRows.length > 0) {
        const deletePromises = selectedRows.map((department) =>
          deleteDepartmentAPI(dispatch, department.id)
        );
        const results = await Promise.all(deletePromises);
        if (results.every((result) => result)) {
          const filters = buildFilters();
          fetchDepartments(currentPage, filters);
          fetchDepartmentOptions();
        }
      } else if (departmentToDelete) {
        const success = await deleteDepartmentAPI(dispatch, departmentToDelete);
        if (success) {
          const filters = buildFilters();
          fetchDepartments(currentPage, filters);
          fetchDepartmentOptions();
        }
      }
    } catch (error) {
      console.error("An error occurred during deletion:", error);
    } finally {
      setIsDeleteModalOpen(false);
      setDepartmentToDelete(null);
      setIsBulkDelete(false);
      setSelectedRows([]);
      setLocalIsLoading(false);
      dispatch(setIsLoading(false));
    }
  };

  const buildFilters = () => {
    const filters: GetDepartmentsPayload["queryOptionsRequest"] = {
      filtersRequest: [],
      sortRequest: [
        {
          field: "createdAt",
          direction: 1,
          priority: 1,
        },
      ],
      includes: ["workingDays"],
    };

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

    if (selectedDepartment) {
      filters.filtersRequest.push({
        field: "name",
        operator: 1,
        matchMode: 1,
        value: selectedDepartment,
      });
    }

    if (debouncedSearchTerm) {
      filters.filtersRequest.push({
        field: "name",
        operator: 1,
        matchMode: 7,
        ignoreCase: true,
        value: debouncedSearchTerm,
      });
    }

    return filters;
  };

  useEffect(() => {
    const filters = buildFilters();
    fetchDepartments(currentPage, filters);
  }, [
    currentPage,
    selectedDepartment,
    debouncedSearchTerm,
    selectedRange,
    fetchDepartments,
  ]);

  useEffect(() => {
    fetchDepartmentOptions();
  }, [fetchDepartmentOptions]);

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
      prevData.map((department) =>
        department.id === id
          ? { ...department, selected: !department.selected }
          : department
      )
    );
  };

  const toggleAllRowsSelection = (selectAll: boolean) => {
    setLocalData((prevData) =>
      prevData.map((benefit) => ({
        ...benefit,
        selected: selectAll,
      }))
    );
  };

  const handleEdit = (department: Department) => {
    if (!department) {
      console.error("Attempted to edit undefined department");
      return;
    }
    setDepartmentToEdit(department);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setDepartmentToEdit(null);
    setIsModalOpen(true);
  };

  const handleCreateOrEditDepartment = async (values: {
    name: string;
    workingDays: { dayName: string; isWorkingDay: boolean }[];
  }) => {
    try {
      dispatch(setIsLoading(true));
      let success = false;

      const payload = {
        name: values.name,
        code: values.name.toLowerCase().replace(/\s+/g, "-"),
        description: values.name + " department",
        workingDays: values.workingDays,
      };

      if (departmentToEdit) {
        success = await updateDepartmentAPI(
          dispatch,
          payload,
          departmentToEdit.id
        );
      } else {
        success = await createDepartmentAPI(dispatch, payload);
      }

      if (success) {
        setSuccessMessage(
          `Department ${values.name} has been ${departmentToEdit ? "updated" : "created"
          } successfully!`
        );
        setIsSuccessModalOpen(true);
        const filters = buildFilters();
        fetchDepartments(currentPage, filters);
        fetchDepartmentOptions();
      }
    } catch (error) {
      // Error will be shown through other means (toast, etc.)
      console.error("Operation failed:", error);
      setIsSuccessModalOpen(false);
    } finally {
      dispatch(setIsLoading(false));
      setIsModalOpen(false);
      // setIsSuccessModalOpen(false);
    }
  };
  useEffect(() => {
    const selected = localData.filter((department) => department.selected);
    setSelectedRows(selected);
  }, [localData]);

  useEffect(() => {
    if (
      isDeleteModalOpen ||
      isModalOpen ||
      isAddUserModalOpen ||
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
  }, [
    isDeleteModalOpen,
    isModalOpen,
    isAddUserModalOpen,
    isDateModalOpen,
    isSuccessModalOpen,
  ]);

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4">
        <h2 className="text-g-gray-1000 text-xl sm:text-2xl md:text-3xl font-semibold">
          Departments
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
      <div className="border bg-g-background-100 py-6 border-g-gray-alpha-400 rounded-[var(--g-radius-md)] shadow-geist-card mx-auto">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center px-6 mb-6 gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-heading-16 text-g-gray-1000">
              Department List
            </h3>
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
            </div>
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Department Name"
              id="department-search"
              name="departmentSearch"
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
            columns={departmentColumns}
            data={localData}
            className=""
            showCheckboxes={true}
            selectedRows={selectedRows}
            isLoading={isLoading}
            showTdBottomBorder={true}
            showBulkDelete={true}
            meta={{
              toggleRowSelection,
              toggleAllRowsSelection,
              selectedRows,
              setIsBulkDelete,
              setIsDeleteModalOpen,
              setDepartmentToDelete,
              handleEdit,
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

        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onCancel={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          isLoading={isLoading}
          TextMessage="Department will be deleted, and unfortunately, you won't be able to get it back."
        />

        <CustomModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={departmentToEdit ? "Edit Department" : "Create Department"}
        >
          <CreateDepartment
            initialValues={
              departmentToEdit
                ? {
                  name: departmentToEdit.name || "",
                  workingDays: daysOfWeek.map((day, index) => ({
                    dayName: day,
                    isWorkingDay:
                      Array.isArray(departmentToEdit.workingDays) &&
                        departmentToEdit.workingDays.find(
                          (d) => d.dayName === day
                        )?.isWorkingDay
                        ? true
                        : false,
                  })),
                }
                : {
                  name: "",
                  workingDays: daysOfWeek.map((day) => ({
                    dayName: day,
                    isWorkingDay: false,
                  })),
                }
            }
            onSubmit={handleCreateOrEditDepartment}
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

export default DepartmentTable;
