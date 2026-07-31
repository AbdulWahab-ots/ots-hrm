"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import CreateLeave from "./createLeaveType/createLeaveForm";
import SuccessConfirmation from "../../common/SuccessConfirmation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import {
  getAllLeaveTypesAPI,
  deleteLeaveTypeAPI,
  updateLeaveTypeAPI,
  createLeaveTypeAPI,
  fetchAllDepartments,
} from "@/services/adminServices";
import { LeaveType, GetLeaveTypesPayload, Department } from "@/utils/types";
import { setIsLoading } from "@/store/features/global/globalSlice";
import { leaveColumns } from "@/utils/leaveColumns";
import { FormikHelpers } from "formik";
import CountBadge from "@/components/common/CountBadge";

const LeavesTable = () => {
  const [localData, setLocalData] = useState<LeaveType[]>([]);
  const [selectedRows, setSelectedRows] = useState<LeaveType[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [leaveToDelete, setLeaveToDelete] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaveToEdit, setLeaveToEdit] = useState<LeaveType | null>(null);
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setLocalIsLoading] = useState(false);
  const departments = useSelector(
    (state: RootState) => state.department.departmentData
  );
  const itemsPerPage = 5;

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const departmentOptions = [
    { value: "", label: "All Departments" },
    ...(departments?.map((dept: Department) => ({
      value: dept.id,
      label: dept.name,
    })) || []),
  ];

  useEffect(() => {
    if (!departments || departments.length === 0) {
      dispatch(fetchAllDepartments);
    }
  }, [dispatch, departments]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const fetchLeaveTypes = useCallback(
    async (
      page: number,
      filters: GetLeaveTypesPayload["queryOptionsRequest"]
    ) => {
      const payload: GetLeaveTypesPayload = {
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
          includes: ["department"],
        },
      };

      try {
        setLocalIsLoading(true);
        dispatch(setIsLoading(true));
        const response = await getAllLeaveTypesAPI(dispatch, payload);
        if (response && response.result) {
          setLocalData(
            response.result.data.map((leave) => ({
              ...leave,
              selected: false,
            }))
          );
          setTotalPages(response.result.numberOfPages);
          setTotalItems(response.result.total);
        } else {
          console.error("Invalid API response: No result found");
        }
      } catch (error) {
        console.error("Failed to fetch leave types:", error);
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
        const deletePromises = selectedRows.map((leave) =>
          deleteLeaveTypeAPI(dispatch, leave.id)
        );
        const results = await Promise.all(deletePromises);
        if (results.every((result) => result)) {
          const filters = buildFilters();
          fetchLeaveTypes(currentPage, filters);
        }
      } else if (leaveToDelete) {
        const success = await deleteLeaveTypeAPI(dispatch, leaveToDelete);
        if (success) {
          const filters = buildFilters();
          fetchLeaveTypes(currentPage, filters);
        }
      }
    } catch (error) {
      console.error("An error occurred during deletion:", error);
    } finally {
      setIsDeleteModalOpen(false);
      setLeaveToDelete(null);
      setIsBulkDelete(false);
      setSelectedRows([]);
      setLocalIsLoading(false);
      dispatch(setIsLoading(false));
    }
  };

  const buildFilters = () => {
    const filters: GetLeaveTypesPayload["queryOptionsRequest"] = {
      filtersRequest: [],
      sortRequest: [
        {
          field: "createdAt",
          direction: 1,
          priority: 1,
        },
      ],
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

    if (selectedDepartment && selectedDepartment !== "ALL") {
      filters.filtersRequest.push({
        field: "departmentId",
        operator: 1,
        matchMode: 1,
        value: selectedDepartment,
      });
    }

    if (debouncedSearchTerm) {
      filters.filtersRequest.push({
        field: "name",
        operator: 1,
        matchMode: 1,
        value: debouncedSearchTerm,
      });
    }

    return filters;
  };

  useEffect(() => {
    const filters = buildFilters();
    fetchLeaveTypes(currentPage, filters);
  }, [
    currentPage,
    selectedDepartment,
    debouncedSearchTerm,
    selectedRange,
    fetchLeaveTypes,
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
      prevData.map((leave) =>
        leave.id === id ? { ...leave, selected: !leave.selected } : leave
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

  const handleEdit = (leave: LeaveType) => {
    if (!leave) {
      console.error("Attempted to edit undefined leave type");
      return;
    }
    dispatch(fetchAllDepartments);
    setLeaveToEdit(leave);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    dispatch(fetchAllDepartments);
    setLeaveToEdit(null);
    setIsModalOpen(true);
  };

  const handleCreateOrEditLeave = async (
    values: {
      name: string;
      maxDaysPerYear: number | string;
      maxConsecutiveDays: number | string;
      isPaid: boolean;
      requiresApproval: boolean;
      description: string;
      departmentId: string;
    },
    formikHelpers: FormikHelpers<any>
  ) => {
    try {
      dispatch(setIsLoading(true));
      const payload = {
        name: values.name,
        code: values.name.toLowerCase().replace(/\s+/g, ""),
        description: values.description || `${values.name} leave type`,
        maxDaysPerYear: values.maxDaysPerYear,
        maxConsecutiveDays: values.maxConsecutiveDays,
        isPaid: values.isPaid,
        requiresApproval: values.requiresApproval,
        departmentId: values.departmentId,
      };

      let response;
      if (leaveToEdit) {
        response = await updateLeaveTypeAPI(dispatch, payload, leaveToEdit.id);
      } else {
        response = await createLeaveTypeAPI(dispatch, payload);
      }

      if (response) {
        setSuccessMessage(
          `Leave type ${values.name} has been ${leaveToEdit ? "updated" : "created"
          } successfully!`
        );
        setIsSuccessModalOpen(true);
        setIsModalOpen(false); // Close modal on success
        const filters = buildFilters();
        await fetchLeaveTypes(currentPage, filters);
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
          "An unexpected error occurred. Please try again."
        );
      }
      setIsSuccessModalOpen(false);
    } finally {
      dispatch(setIsLoading(false));
    }
  };

  useEffect(() => {
    const selected = localData.filter((leave) => leave.selected);
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
          Leave Types
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
      <div className="border border-g-gray-alpha-400 bg-g-background-100 py-6 rounded-[var(--g-radius-md)] mx-auto shadow-geist-card">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center px-6 mb-6 gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-heading-16 text-g-gray-1000">
              Leave Types List
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
              placeholder="Leave Type Name"
              id="leave-search"
              name="leaveSearch"
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
            columns={leaveColumns}
            data={localData}
            className=""
            showCheckboxes={true}
            selectedRows={selectedRows}
            isLoading={isLoading}
            showBulkDelete={true}
            meta={{
              toggleRowSelection,
              toggleAllRowsSelection,
              selectedRows,
              setIsBulkDelete,
              setIsDeleteModalOpen,
              setLeaveToDelete,
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
          TextMessage="Leave type will be deleted, and unfortunately, you won't be able to get it back."
        />

        <CustomModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={leaveToEdit ? "Edit Leave Type" : "Create Leave Type"}
          variant="bottom-full"
        >
          <CreateLeave
            initialValues={
              leaveToEdit
                ? {
                  name: leaveToEdit.name || "",
                  maxDaysPerYear: leaveToEdit.maxDaysPerYear || "",
                  maxConsecutiveDays: leaveToEdit.maxConsecutiveDays || "",
                  isPaid: leaveToEdit.isPaid ?? false,
                  requiresApproval: leaveToEdit.requiresApproval ?? false,
                  description: leaveToEdit.description || "",
                  departmentId: leaveToEdit.departmentId || "",
                }
                : {
                  name: "",
                  maxDaysPerYear: 0,
                  maxConsecutiveDays: 0,
                  isPaid: false,
                  requiresApproval: false,
                  description: "",
                  departmentId: "",
                }
            }
            onSubmit={handleCreateOrEditLeave}
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

export default LeavesTable;
