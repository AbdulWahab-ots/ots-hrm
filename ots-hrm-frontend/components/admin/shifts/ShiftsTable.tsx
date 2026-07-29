"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
import CreateShift from "./add";
import SuccessConfirmation from "../../common/SuccessConfirmation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import {
  getAllShiftsAPI,
  deleteShiftAPI,
  updateShiftAPI,
  createShiftAPI,
  fetchAllDepartments,
} from "@/services/adminServices";
import { Shift, GetShiftsPayload, Department } from "@/utils/types";
import { setIsLoading } from "@/store/features/global/globalSlice";
import { shiftColumns } from "@/utils/Columns/shiftColumns";
import { FormikHelpers } from "formik";
import { FiTrash2 } from "react-icons/fi";
import CountBadge from "@/components/common/CountBadge";

const ShiftsTable = () => {
  const [localData, setLocalData] = useState<Shift[]>([]);
  const [selectedRows, setSelectedRows] = useState<Shift[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shiftToEdit, setShiftToEdit] = useState<Shift | null>(null);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedShiftType, setSelectedShiftType] = useState("");
  const [tableBodyHeight, setTableBodyHeight] = useState(0);
  const [selectedRange, setSelectedRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: null,
    endDate: null,
  });
  // const tableBodyRef = useRef<HTMLTableSectionElement>(null);
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

  const shiftTypeOptions = [
    { value: "", label: "All Shift Types" },
    { value: "MORNING", label: "Morning" },
    { value: "EVENING", label: "Evening" },
    { value: "NIGHT", label: "Night" },
    { value: "FLEXIBLE", label: "Flexible" },
    { value: "ROTATIONAL", label: "Rotational" },
  ];

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

  // useEffect(() => {
  //   if (tableBodyRef.current) {
  //     setTableBodyHeight(tableBodyRef.current.offsetHeight);
  //   }
  // }, [localData, isLoading]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const fetchShifts = useCallback(
    async (page: number, filters: GetShiftsPayload["queryOptionsRequest"]) => {
      const payload: GetShiftsPayload = {
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
        const response = await getAllShiftsAPI(dispatch, payload);
        if (response && response.result) {
          setLocalData(
            response.result.data.map((shift) => ({
              ...shift,
              selected: false,
            }))
          );
          setTotalPages(response.result.numberOfPages);
          setTotalItems(response.result.total);
        } else {
          console.error("Invalid API response: No result found");
        }
      } catch (error) {
        console.error("Failed to fetch shifts:", error);
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
        const deletePromises = selectedRows.map((shift) =>
          deleteShiftAPI(dispatch, shift.id)
        );
        const results = await Promise.all(deletePromises);
        if (results.every((result) => result)) {
          const filters = buildFilters();
          fetchShifts(currentPage, filters);
        }
      } else if (shiftToDelete) {
        const success = await deleteShiftAPI(dispatch, shiftToDelete);
        if (success) {
          const filters = buildFilters();
          fetchShifts(currentPage, filters);
        }
      }
    } catch (error) {
      console.error("An error occurred during deletion:", error);
    } finally {
      setIsDeleteModalOpen(false);
      setShiftToDelete(null);
      setIsBulkDelete(false);
      setSelectedRows([]);
      setLocalIsLoading(false);
      dispatch(setIsLoading(false));
    }
  };

  const buildFilters = () => {
    const filters: GetShiftsPayload["queryOptionsRequest"] = {
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
          start: selectedRange.startDate.toISOString().split("T")[0],
          end: selectedRange.endDate.toISOString().split("T")[0],
        },
      });
    }

    if (selectedShiftType && selectedShiftType !== "") {
      filters.filtersRequest.push({
        field: "shiftType",
        operator: 1,
        matchMode: 1,
        value: selectedShiftType,
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
    fetchShifts(currentPage, filters);
  }, [
    currentPage,
    selectedShiftType,
    debouncedSearchTerm,
    selectedRange,
    fetchShifts,
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
  // const toggleRowSelection = (id: string) => {
  //   setLocalData((prevData) =>
  //     prevData.map((shift) =>
  //       shift.id === id
  //         ? { ...shift, selected: !shift.selected }
  //         : shift
  //     )
  //   );
  // };
  // const toggleAllRowsSelection = (selectAll: boolean) => {
  //   setLocalData((prevData) =>
  //     prevData.map((shift) => ({
  //       ...shift,
  //       selected: selectAll,
  //     }))
  //   );
  // };

  const toggleRowSelection = (id: string) => {
    setLocalData((prevData) =>
      prevData.map((shift) =>
        shift.id === id
          ? { ...shift, selected: !shift.selected }
          : shift
      )
    );
  };

  const toggleAllRowsSelection = (selectAll: boolean) => {
    setLocalData((prevData) =>
      prevData.map((shift) => ({
        ...shift,
        selected: selectAll,
      }))
    );
  };

  const handleEdit = (shift: Shift) => {
    if (!shift) {
      console.error("Attempted to edit undefined shift");
      return;
    }
    dispatch(fetchAllDepartments);
    setShiftToEdit(shift);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    dispatch(fetchAllDepartments);
    setShiftToEdit(null);
    setIsModalOpen(true);
  };

  const handleCreateOrEditShift = async (
    values: {
      name: string;
      shiftType: string;
      startTime: string;
      endTime: string;
      breakDuration: number | string;
      departmentId: string;
    },
    formikHelpers: FormikHelpers<any>
  ) => {
    try {
      dispatch(setIsLoading(true));
      const payload = {
        name: values.name,
        code: values.name.toLowerCase().replace(/\s+/g, ""),
        shiftType: values.shiftType,
        startTime: values.startTime,
        endTime: values.endTime,
        breakDuration: values.breakDuration,
        departmentId: values.departmentId,
      };

      let response;
      if (shiftToEdit) {
        response = await updateShiftAPI(dispatch, payload, shiftToEdit.id);
      } else {
        response = await createShiftAPI(dispatch, payload);
      }

      if (response) {
        setSuccessMessage(
          `Shift ${values.name} has been ${shiftToEdit ? "updated" : "created"
          } successfully!`
        );
        setIsSuccessModalOpen(true);
        setIsModalOpen(false);
        const filters = buildFilters();
        await fetchShifts(currentPage, filters);
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
    const selected = localData.filter((shift) => shift.selected);
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
      <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4">
        <h2 className="text-g-gray-1000 text-xl sm:text-2xl md:text-3xl font-semibold">
          Available Shifts
        </h2>
        <div className="flex gap-4 items-center">
          <Button
            icon={ArrowUpToLine}
            variant="outline"
            label="Export"
            iconPosition="center"
          />

          <p className="w-[1px] h-[22px] bg-g-gray-alpha-400"></p>

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
            <h3 className="text-heading-16 text-g-gray-1000">Shifts List</h3>
            <CountBadge count={totalItems} />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex gap-2">
              <CustomDropdown
                id="shift-type-filter"
                name="shiftType"
                options={shiftTypeOptions}
                value={selectedShiftType}
                onChange={(e) => setSelectedShiftType(e.target.value)}
                placeholder="Shift Type"
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
              placeholder="Shift Name"
              id="shift-search"
              name="shiftSearch"
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
            columns={shiftColumns}
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
              setShiftToDelete,
              handleEdit,
              router,
            }}
          // ref={tableBodyRef}
          />

          {/* {selectedRows.length > 0 && (
            <div
              className="absolute top-[48px] right-0 flex items-center justify-center bg-g-background-100 border-l border-g-gray-alpha-400 shadow-md z-10"
              style={{
                height: `${tableBodyHeight}px`, // Dynamic table body height
                width: "88px", // Adjust width as needed
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsBulkDelete(true);
                  setIsDeleteModalOpen(true);
                }}
                className="text-[#475467] cursor-pointer border flex items-center justify-center border-[var(--error-50)] rounded-[8px] bg-[var(--error-100)]  w-[52px] h-[52px]"
              >
                <FiTrash2 color="red" size={16} />
              </button>
            </div>
          )} */}

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
          TextMessage="Shift will be deleted, and unfortunately, you won't be able to get it back."
        />

        <CustomModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={shiftToEdit ? "Edit Shift" : "Create Shift"}
          variant="bottom-full"
        >
          <CreateShift
            initialValues={
              shiftToEdit
                ? {
                  name: shiftToEdit.name || "",
                  shiftType: shiftToEdit.shiftType || "",
                  startTime: shiftToEdit.startTime || "",
                  endTime: shiftToEdit.endTime || "",
                  breakDuration: shiftToEdit.breakDuration || "",
                  departmentId: shiftToEdit.departmentId || "",
                }
                : {
                  name: "",
                  shiftType: "",
                  startTime: "",
                  endTime: "",
                  breakDuration: "",
                  departmentId: "",
                }
            }
            onSubmit={handleCreateOrEditShift}
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

export default ShiftsTable;
