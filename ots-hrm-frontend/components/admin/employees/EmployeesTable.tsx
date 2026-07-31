"use client";

import React, { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { ArrowUpToLine, Plus } from "lucide-react";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmation";
import Button from "@/components/common/Button";
import { TanstackTable } from "@/components/common/TanstackTable";
import CustomModal from "@/components/common/CustomModal";
import SearchInput from "@/components/common/form/SearchInput";
import CustomDropdown from "@/components/common/form/DropDown";
import DateRangeField from "@/components/common/form/DateRangeField";
import DateRangePickerModal from "@/components/common/form/DateRangePickerModal";
import SuccessConfirmation from "@/components/common/SuccessConfirmation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import {
  getAllEmployeesAPI,
  deleteEmployeeAPI,
  resignEmployeeAPI,
  updateEmployeeAPI,
  createEmployeeAPI,
  fetchAllDepartments,
  fetchAllDesignations,
  uploadProfileImageAPI,
} from "@/services/adminServices";
import ResignEmployeeModal from "./ResignEmployeeModal";
import {
  Employee,
  GetEmployeesPayload,
  Department,
  EmployeePayload,
} from "@/utils/types";
import { setIsLoading } from "@/store/features/global/globalSlice";
import { employeeColumns } from "@/utils/Columns/employeeColumns";
import { FormikHelpers } from "formik";
import CreateEmployee from "./add";
import { RequestColumns } from "@/utils/Columns/RequestColumns";
import CountBadge from "@/components/common/CountBadge";

const EmployeesTable = () => {
  const [localData, setLocalData] = useState<Employee[]>([]);
  const [selectedRows, setSelectedRows] = useState<Employee[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);
  const [isResignModalOpen, setIsResignModalOpen] = useState(false);
  const [employeeToResign, setEmployeeToResign] = useState<Employee | null>(null);
  const [isResignLoading, setIsResignLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
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
  const [sortConfig, setSortConfig] = useState<{
    field: string;
    direction: number;
  }>({
    field: "createdAt",
    direction: -1,
  });

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
      fetchAllDepartments(dispatch);
    }
    fetchAllDesignations(dispatch);
  }, [dispatch, departments]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const fetchEmployees = useCallback(
    async (
      page: number,
      filters: GetEmployeesPayload["queryOptionsRequest"]
    ) => {
      const payload: GetEmployeesPayload = {
        pagedListRequest: {
          pageNo: page,
          pageSize: itemsPerPage,
          getAllRecords: false,
        },
        queryOptionsRequest: {
          filtersRequest: filters.filtersRequest,
          sortRequest: [
            {
              field: sortConfig.field,
              direction: sortConfig.direction,
              priority: 1,
            },
          ],
          includes: ["user", "department", "designation"],
        },
      };

      try {
        setLocalIsLoading(true);
        dispatch(setIsLoading(true));
        const response = await getAllEmployeesAPI(dispatch, payload);
        if (response && response.result) {
          setLocalData(
            response.result.data.map((employee) => ({
              ...employee,
              selected: false,
            }))
          );
          setTotalPages(response.result.numberOfPages);
          setTotalItems(response.result.total);
        } else {
          console.error("Invalid API response: No result found");
        }
      } catch (error) {
        console.error("Failed to fetch employees:", error);
      } finally {
        setLocalIsLoading(false);
        dispatch(setIsLoading(false));
      }
    },
    [dispatch, sortConfig]
  );

  const handleDelete = async () => {
    try {
      setLocalIsLoading(true);
      dispatch(setIsLoading(true));
      if (isBulkDelete && selectedRows.length > 0) {
        const deletePromises = selectedRows.map((employee) =>
          deleteEmployeeAPI(dispatch, employee.id)
        );
        const results = await Promise.all(deletePromises);
        if (results.every((result) => result)) {
          const filters = buildFilters();
          fetchEmployees(currentPage, filters);
        }
      } else if (employeeToDelete) {
        const success = await deleteEmployeeAPI(dispatch, employeeToDelete);
        if (success) {
          const filters = buildFilters();
          fetchEmployees(currentPage, filters);
        }
      }
    } catch (error) {
      console.error("An error occurred during deletion:", error);
    } finally {
      setIsDeleteModalOpen(false);
      setEmployeeToDelete(null);
      setIsBulkDelete(false);
      setSelectedRows([]);
      setLocalIsLoading(false);
      dispatch(setIsLoading(false));
    }
  };

  const handleResign = (employee: Employee) => {
    setEmployeeToResign(employee);
    setIsResignModalOpen(true);
  };

  const handleConfirmResign = async (status: string, effectiveDate: string) => {
    if (!employeeToResign) return;
    try {
      setIsResignLoading(true);
      dispatch(setIsLoading(true));
      const success = await resignEmployeeAPI(dispatch, employeeToResign.id, {
        status,
        effectiveDate,
      });
      if (success) {
        setIsResignModalOpen(false);
        setEmployeeToResign(null);
        const filters = buildFilters();
        fetchEmployees(currentPage, filters);
      }
    } catch (error) {
      console.error("An error occurred while resigning the employee:", error);
    } finally {
      setIsResignLoading(false);
      dispatch(setIsLoading(false));
    }
  };

  const buildFilters = () => {
    const filters: GetEmployeesPayload["queryOptionsRequest"] = {
      filtersRequest: [],
      sortRequest: [
        {
          field: sortConfig.field,
          direction: sortConfig.direction,
          priority: 1,
        },
      ],
    };

    if (selectedRange.startDate && selectedRange.endDate) {
      filters.filtersRequest.push({
        field: "joiningDate",
        operator: 1,
        matchMode: 10,
        // toISOString() converts through UTC first, which silently rolls the date back
        // by a day for any timezone ahead of UTC (e.g. PKT) — format() reads the local
        // calendar date directly, so "This Month" etc. match the date actually selected.
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

    if (debouncedSearchTerm) {
      filters.filtersRequest.push({
        field: "employeeCode",
        operator: 1,
        matchMode: 7,
        value: debouncedSearchTerm,
      });
    }

    return filters;
  };

  useEffect(() => {
    const filters = buildFilters();
    fetchEmployees(currentPage, filters);
  }, [
    currentPage,
    selectedDepartment,
    debouncedSearchTerm,
    selectedRange,
    sortConfig,
    fetchEmployees,
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
      prevData.map((employee) =>
        employee.id === id
          ? { ...employee, selected: !employee.selected }
          : employee
      )
    );
  };

  const handleEdit = (employee: Employee) => {
    if (!employee) {
      console.error("Attempted to edit undefined employee");
      return;
    }
    fetchAllDepartments(dispatch);
    fetchAllDesignations(dispatch);
    setEmployeeToEdit(employee);
    setIsModalOpen(true);
  };

  const toggleAllRowsSelection = (selectAll: boolean) => {
    setLocalData((prevData) =>
      prevData.map((employee) => ({
        ...employee,
        selected: selectAll,
      }))
    );
  };

  const handleView = (employee: Employee) => {
    router.push(`/admin/employees/details?id=${employee.id}`);
  };

  const handleCreate = () => {
    fetchAllDepartments(dispatch);
    fetchAllDesignations(dispatch);
    setEmployeeToEdit(null);
    setIsModalOpen(true);
  };

  const handleCreateOrEditEmployee = async (
    values: EmployeePayload,
    formikHelpers: FormikHelpers<EmployeePayload>,
    profileImage: File | null
  ) => {
    try {
      dispatch(setIsLoading(true));
      let payload: any = {
        ...values,
      };
      delete payload.user?.pictureUrl; // Remove pictureUrl to avoid sending local URL to backend
      // Ensure salary is numeric
      if (typeof payload.salary === "string") {
        payload.salary = Number(payload.salary) || 0;
      }
      // Do not send benefitId on update (backend Employee has no benefitId)
      if (employeeToEdit) {
        const { benefitId, ...rest } = payload;
        payload = rest;
      }

      let response;
      let employeeId;
      if (employeeToEdit) {
        response = await updateEmployeeAPI(
          dispatch,
          payload,
          employeeToEdit.id
        );
        employeeId = response?.result?.user?.id;
      } else {
        response = await createEmployeeAPI(dispatch, payload);
        employeeId = response?.result?.user?.id;
      }

      if (response) {
        // Upload profile image if provided
        if (profileImage && employeeId) {
          await uploadProfileImageAPI(dispatch, employeeId, profileImage);
        }
        setSuccessMessage(
          `Employee ${values.user.firstName} has been ${employeeToEdit ? "updated" : "created"
          } successfully!`
        );
        setIsSuccessModalOpen(true);
        setIsModalOpen(false);
        const filters = buildFilters();
        await fetchEmployees(currentPage, filters);
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

  const handleSortChange = (
    columnId: string,
    isSorted: false | "asc" | "desc"
  ) => {
    if (isSorted) {
      setSortConfig({
        field: columnId,
        direction: isSorted === "asc" ? 1 : -1,
      });
    } else {
      setSortConfig({
        field: "createdAt",
        direction: -1,
      });
    }
  };

  useEffect(() => {
    const selected = localData.filter((employee) => employee.selected);
    setSelectedRows(selected);
  }, [localData]);

  useEffect(() => {
    if (
      isDeleteModalOpen ||
      isModalOpen ||
      isDateModalOpen ||
      isSuccessModalOpen ||
      isResignModalOpen
    ) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isDeleteModalOpen, isModalOpen, isDateModalOpen, isSuccessModalOpen, isResignModalOpen]);

  return (
    <>
      <div className="flex justify-between items-center pb-4">
        <h2 className="text-g-gray-1000 text-heading-24">
          Employees
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 mb-6 gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-g-gray-1000 text-heading-16">Employees List</h3>
            <CountBadge count={totalItems} />
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
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
              placeholder="Employee Id"
              id="employee-search"
              name="employeeSearch"
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
            columns={employeeColumns(true)}
            data={localData}
            className=""
            showCheckboxes={false}
            selectedRows={selectedRows}
            isLoading={isLoading}
            enableSorting={true}
            showBulkDelete={true}
            onRowClick={handleView}
            meta={{
              toggleRowSelection,
              toggleAllRowsSelection,
              selectedRows,
              setIsBulkDelete,
              setIsDeleteModalOpen,
              setEmployeeToDelete,
              handleEdit,
              handleView,
              handleResign,
              router,
              onSortChange: handleSortChange,
            }}
          />

          <div className="flex gap-4 justify-between px-6 items-center border-t border-g-gray-300 pt-4">
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
            <p className="text-g-gray-900 text-label-14">
              Page {currentPage} of {totalPages}
            </p>
          </div>
        </div>

        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onCancel={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          isLoading={isLoading}
          TextMessage="Employee will be deleted, and unfortunately, you won't be able to get it back."
        />

        <ResignEmployeeModal
          isOpen={isResignModalOpen}
          onCancel={() => {
            setIsResignModalOpen(false);
            setEmployeeToResign(null);
          }}
          onConfirm={handleConfirmResign}
          isLoading={isResignLoading}
        />

        <CustomModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={employeeToEdit ? "Edit Employee" : "Create Employee"}
          variant="bottom-full-no-rounded"
          className="h-full flex flex-col"
        >
          <CreateEmployee
            initialValues={
              employeeToEdit
                ? {
                  user: {
                    userName: employeeToEdit.user.userName || "",
                    firstName: employeeToEdit.user.firstName || "",
                    lastName: employeeToEdit.user.lastName || "",
                    email: employeeToEdit.user.email || "",
                    password: "",
                    pictureUrl: employeeToEdit.user.pictureUrl || "",
                  },
                  employeeCode: employeeToEdit.employeeCode || "",
                  departmentId: employeeToEdit.departmentId || "",
                  designationId: employeeToEdit.designationId || "",
                  shiftId: employeeToEdit.shiftId || "",
                  joiningDate: employeeToEdit.joiningDate || "",
                  status: employeeToEdit.status || "PERMANENT",
                  benefitId: employeeToEdit.benefitId || "",
                  salary: employeeToEdit.salary ?? "",
                  phoneNumber: employeeToEdit.phoneNumber || "",
                  bankName: employeeToEdit.bankName || "",
                  ibanNumber: employeeToEdit.ibanNumber || "",
                  accountNumber: employeeToEdit.accountNumber || "",
                }
                : undefined
            }
            onSubmit={handleCreateOrEditEmployee}
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

export default EmployeesTable;
