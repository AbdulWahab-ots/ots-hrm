"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
import CreateBenefit from "./add";
import SuccessConfirmation from "@/components/common/SuccessConfirmation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import {
  getAllBenefitsAPI,
  deleteBenefitAPI,
  updateBenefitAPI,
  createBenefitAPI,
  fetchAllDepartments,
} from "@/services/adminServices";
import {
  Benefit,
  GetBenefitsPayload,
  Department,
  BenefitPayload,
} from "@/utils/types";
import { setIsLoading } from "@/store/features/global/globalSlice";
import { benefitColumns } from "@/utils/Columns/benefitColumns";
import { FormikHelpers } from "formik";
import CountBadge from "@/components/common/CountBadge";
import { FiTrash2 } from "react-icons/fi";

const BenefitsTable = () => {
  const [localData, setLocalData] = useState<Benefit[]>([]);
  const [selectedRows, setSelectedRows] = useState<Benefit[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [benefitToDelete, setBenefitToDelete] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [benefitToEdit, setBenefitToEdit] = useState<Benefit | null>(null);
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
    field: "value",
    direction: 1, // Default: descending
  });
  // const tableBodyRef = useRef<HTMLTableSectionElement>(null);
  // const [tableBodyHeight, setTableBodyHeight] = useState(0);

  const departments = useSelector(
    (state: RootState) => state.department.departmentData
  );
  const itemsPerPage = 5;

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const departmentOptions = [
    { value: "", label: "All Departments" },
    ...(Array.isArray(departments)
      ? departments.map((dept: Department) => ({
        value: dept.id,
        label: dept.name,
      }))
      : []),
  ];

  useEffect(() => {
    if (!Array.isArray(departments) || departments.length === 0) {
      fetchAllDepartments(dispatch);
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

  // useEffect(() => {
  //   if (tableBodyRef.current) {
  //     setTableBodyHeight(tableBodyRef.current.offsetHeight);
  //   }
  // }, [localData, isLoading]);

  const fetchBenefits = useCallback(
    async (
      page: number,
      filters: GetBenefitsPayload["queryOptionsRequest"]
    ) => {
      const payload: GetBenefitsPayload = {
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
          includes: ["department"],
        },
      };

      try {
        setLocalIsLoading(true);
        dispatch(setIsLoading(true));
        const response = await getAllBenefitsAPI(dispatch, payload);
        if (response && response.result) {
          setLocalData(
            response.result.data.map((benefit) => ({
              ...benefit,
              selected: false,
            }))
          );
          setTotalPages(response.result.numberOfPages);
          setTotalItems(response.result.total);
        } else {
          console.error("Invalid API response: No result found");
        }
      } catch (error) {
        console.error("Failed to fetch benefits:", error);
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
        const deletePromises = selectedRows.map((benefit) =>
          deleteBenefitAPI(dispatch, benefit.id)
        );
        const results = await Promise.all(deletePromises);
        if (results.every((result) => result)) {
          const filters = buildFilters();
          fetchBenefits(currentPage, filters);
        }
      } else if (benefitToDelete) {
        const success = await deleteBenefitAPI(dispatch, benefitToDelete);
        if (success) {
          const filters = buildFilters();
          fetchBenefits(currentPage, filters);
        }
      }
    } catch (error) {
      console.error("An error occurred during deletion:", error);
    } finally {
      setIsDeleteModalOpen(false);
      setBenefitToDelete(null);
      setIsBulkDelete(false);
      setSelectedRows([]);
      setLocalIsLoading(false);
      dispatch(setIsLoading(false));
    }
  };

  const buildFilters = () => {
    const filters: GetBenefitsPayload["queryOptionsRequest"] = {
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
        field: "createdAt",
        operator: 1,
        matchMode: 10,
        rangeValues: {
          start: selectedRange.startDate.toISOString().split("T")[0],
          end: selectedRange.endDate.toISOString().split("T")[0],
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
        field: "name",
        operator: 1,
        matchMode: 6,
        value: debouncedSearchTerm,
      });
    }

    return filters;
  };

  useEffect(() => {
    const filters = buildFilters();
    fetchBenefits(currentPage, filters);
  }, [
    currentPage,
    selectedDepartment,
    debouncedSearchTerm,
    selectedRange,
    sortConfig,
    fetchBenefits,
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
      prevData.map((benefit) =>
        benefit.id === id
          ? { ...benefit, selected: !benefit.selected }
          : benefit
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

  const handleEdit = (benefit: Benefit) => {
    if (!benefit) {
      console.error("Attempted to edit undefined benefit");
      return;
    }
    fetchAllDepartments(dispatch);
    setBenefitToEdit(benefit);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    fetchAllDepartments(dispatch);
    setBenefitToEdit(null);
    setIsModalOpen(true);
  };

  const handleCreateOrEditBenefit = async (
    values: BenefitPayload,
    formikHelpers: FormikHelpers<BenefitPayload>
  ) => {
    try {
      dispatch(setIsLoading(true));
      const payload = {
        name: values.name,
        code: values.name.toLowerCase().replace(/\s+/g, ""),
        description: values.description || `${values.name} benefit`,
        type: values.type,
        value: values.value,
        valueType: values.valueType,
        frequency: values.frequency,
        departmentId: values.departmentId,
      };

      let response;
      if (benefitToEdit) {
        response = await updateBenefitAPI(dispatch, payload, benefitToEdit.id);
      } else {
        response = await createBenefitAPI(dispatch, payload);
      }

      if (response) {
        setSuccessMessage(
          `Benefit ${values.name} has been ${benefitToEdit ? "updated" : "created"
          } successfully!`
        );
        setIsSuccessModalOpen(true);
        setIsModalOpen(false);
        const filters = buildFilters();
        await fetchBenefits(currentPage, filters);
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
        direction: isSorted === "asc" ? 0 : 1,
      });
    } else {
      setSortConfig({
        field: "value",
        direction: 1,
      });
    }
  };

  useEffect(() => {
    const selected = localData.filter((benefit) => benefit.selected);
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
          Benefits
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
      <div className="border-[1px] bg-g-background-100 py-6 border-g-gray-alpha-400 rounded-[var(--g-radius-md)] shadow-geist-card mx-auto relative">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center px-6 mb-6 gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-g-gray-1000 text-heading-16">
              Benefits List
            </h3>{" "}
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
              placeholder="Benefit Name"
              id="benefit-search"
              name="benefitSearch"
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
            columns={benefitColumns}
            data={localData}
            className=""
            showCheckboxes={true}
            selectedRows={selectedRows}
            isLoading={isLoading}
            enableSorting={true}
            showBulkDelete={true}
            meta={{
              toggleRowSelection,
              toggleAllRowsSelection,
              selectedRows,
              setIsBulkDelete,
              setIsDeleteModalOpen,
              setBenefitToDelete,
              handleEdit,
              router,
              onSortChange: handleSortChange,
            }}
          // ref={tableBodyRef} // Assumes TanstackTable forwards ref to tbody
          />

          {/* Floating bulk delete section for table body only */}
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
          TextMessage="Benefit will be deleted, and unfortunately, you won't be able to get it back."
        />

        <CustomModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={benefitToEdit ? "Edit Benefit" : "Create Benefit"}
          variant="bottom-full"
        >
          <CreateBenefit
            initialValues={
              benefitToEdit
                ? {
                  name: benefitToEdit.name || "",
                  description: benefitToEdit.description || "",
                  type: benefitToEdit.type || "",
                  value: Number(benefitToEdit.value) || 0,
                  valueType: benefitToEdit.valueType || "",
                  frequency: benefitToEdit.frequency || "",
                  departmentId: benefitToEdit.departmentId || "",
                }
                : {
                  name: "",
                  description: "",
                  type: "",
                  value: 0,
                  valueType: "",
                  frequency: "",
                  departmentId: "",
                }
            }
            onSubmit={handleCreateOrEditBenefit}
            onCancel={() => setIsModalOpen(false)}
          />
        </CustomModal>

        <SuccessConfirmation
          isOpen={isSuccessModalOpen}
          onClose={() => setIsSuccessModalOpen(false)}
          title="Success!"
          message={successMessage}
          variant="fullscreen"
        />
      </div>
    </>
  );
};

export default BenefitsTable;
