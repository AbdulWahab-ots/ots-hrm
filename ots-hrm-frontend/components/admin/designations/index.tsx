"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpToLine, Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import {
  getAllDesignationAPI,
  createDesignationAPI,
  updateDesignationAPI,
  deleteDesignationAPI,
  fetchAllDepartments,
} from "@/services/adminServices";
import { setIsLoading } from "@/store/features/global/globalSlice";
import { Designation, DesignationPayload, Department } from "@/utils/types";
import { designationColumns } from "@/utils/Columns/designationColumns";
import Button from "@/components/common/Button";
import CustomModal from "@/components/common/CustomModal";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmation";
import SuccessConfirmation from "@/components/common/SuccessConfirmation";
import SearchInput from "@/components/common/form/SearchInput";
import CustomDropdown from "@/components/common/form/DropDown";
import { TanstackTable } from "@/components/common/TanstackTable";
import CreateDesignation from "./add";
import CountBadge from "@/components/common/CountBadge";
import { FiTrash2 } from "react-icons/fi";

const DesignationTable = () => {
  const [localData, setLocalData] = useState<Designation[]>([]);
  const [selectedRows, setSelectedRows] = useState<Designation[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [designationToDelete, setDesignationToDelete] = useState<string | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [designationToEdit, setDesignationToEdit] =
    useState<Designation | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  // const [tableBodyHeight, setTableBodyHeight] = useState(0);
  // const tableBodyRef = useRef<HTMLTableSectionElement>(null);
  const itemsPerPage = 10;

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const departments = useSelector(
    (state: RootState) => state.department.departmentData
  );
  const isDeleting = useSelector((state: RootState) => state.global.isLoading);

  // useEffect(() => {
  //   if (tableBodyRef.current) {
  //     setTableBodyHeight(tableBodyRef.current.offsetHeight);
  //   }
  // }, [localData]);

  // Fetch departments on mount
  useEffect(() => {
    if (!departments?.length) {
      dispatch(fetchAllDepartments);
    }
  }, [dispatch, departments]);

  const departmentOptions = [
    { value: "", label: "All Department" },
    ...(departments?.map((dept: Department) => ({
      value: dept.id,
      label: dept.name,
    })) || []),
  ];

  useEffect(() => {
    const handler = setTimeout(() => {
      setCurrentPage(1);
    }, 1000);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchDesignations = useCallback(
    async (page: number, departmentId: string, search: string) => {
      const payload = {
        pagedListRequest: {
          pageNo: page,
          pageSize: itemsPerPage,
          getAllRecords: false,
        },
        queryOptionsRequest: {
          filtersRequest: [
            ...(departmentId
              ? [
                {
                  field: "departmentId",
                  operator: 1,
                  matchMode: 1,
                  value: departmentId,
                },
              ]
              : []),
            ...(search
              ? [{ field: "title", operator: 1, matchMode: 6, value: search }]
              : []),
          ],
          sortRequest: [{ field: "createdAt", direction: 1, priority: 1 }],
          includes: ["department"],
        },
      };

      try {
        dispatch(setIsLoading(true));
        const response = await getAllDesignationAPI(dispatch, payload);
        if (response?.result) {
          setLocalData(response.result.data);
          setTotalPages(response.result.numberOfPages);
          setTotalItems(response.result.total);
        }
      } catch (error) {
      } finally {
        dispatch(setIsLoading(false));
      }
    },
    [dispatch]
  );

  useEffect(() => {
    fetchDesignations(currentPage, selectedDepartment, searchTerm);
  }, [currentPage, selectedDepartment, searchTerm, fetchDesignations]);

  const handleDelete = async () => {
    try {
      dispatch(setIsLoading(true));
      if (isBulkDelete && selectedRows.length > 0) {
        const results = await Promise.all(
          selectedRows.map((designation) =>
            deleteDesignationAPI(dispatch, designation.id!)
          )
        );
        if (results.every((result) => result)) {
        } else {
        }
      } else if (designationToDelete) {
        const success = await deleteDesignationAPI(
          dispatch,
          designationToDelete
        );
        if (success) {
        } else {
          console.error("Failed to delete designation");
        }
      }
      fetchDesignations(currentPage, selectedDepartment, searchTerm);
    } catch (error) {
      console.error("An error occurred during deletion");
    } finally {
      setIsDeleteModalOpen(false);
      setDesignationToDelete(null);
      setIsBulkDelete(false);
      setSelectedRows([]);
      dispatch(setIsLoading(false));
    }
  };

  const handleCreate = () => {
    setDesignationToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (designation: Designation) => {
    if (!designation) {
      console.error("Invalid designation selected for editing");
      return;
    }
    setDesignationToEdit(designation);
    setIsModalOpen(true);
  };

  const handleCreateOrEditDesignation = async (values: DesignationPayload) => {
    try {
      dispatch(setIsLoading(true));
      const payload = {
        title: values.title,
        departmentId: values.departmentId,
      };
      const success = designationToEdit
        ? await updateDesignationAPI(dispatch, payload, designationToEdit.id!)
        : await createDesignationAPI(dispatch, payload);

      if (success) {
        setSuccessMessage(
          `Designation ${values.title} has been ${designationToEdit ? "updated" : "created"
          } successfully!`
        );
        setIsSuccessModalOpen(true);
        fetchDesignations(currentPage, selectedDepartment, searchTerm);
      } else {
        console.error(
          `Failed to ${designationToEdit ? "update" : "create"} designation`
        );
      }
    } catch (error: any) {
      console.error(
        error?.response?.data?.message ||
        `An error occurred while ${designationToEdit ? "updating" : "creating"
        } designation`
      );
    } finally {
      dispatch(setIsLoading(false));
      setIsModalOpen(false);
    }
  };

  const toggleRowSelection = (id: string) => {
    setLocalData((prevData) =>
      prevData.map((designation) =>
        designation.id === id
          ? { ...designation, selected: !designation.selected }
          : designation
      )
    );
  };

  const toggleAllRowsSelection = (selectAll: boolean) => {
    setLocalData((prevData) =>
      prevData.map((designation) => ({
        ...designation,
        selected: selectAll,
      }))
    );
  };

  useEffect(() => {
    setSelectedRows(localData.filter((designation) => designation.selected));
  }, [localData]);

  // Handle modal body overflow
  useEffect(() => {
    document.body.style.overflow =
      isDeleteModalOpen || isModalOpen || isSuccessModalOpen
        ? "hidden"
        : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isDeleteModalOpen, isModalOpen, isSuccessModalOpen]);

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
        <h2 className="text-g-gray-1000 text-xl sm:text-2xl md:text-3xl font-semibold">
          Designations
        </h2>
        <div className="flex items-center gap-4">
          <Button
            icon={Plus}
            variant="filled"
            label="Add New"
            onClick={handleCreate}
          />
          <div className="w-[1px] h-7 bg-g-blue-400 py-3"></div>
          <Button
            icon={ArrowUpToLine}
            variant="outline"
            iconPosition="center"
            label="Export"
          />
        </div>
      </div>
      <div className="border bg-g-background-100 py-6 border-g-gray-alpha-400 rounded-[var(--g-radius-md)] shadow-geist-card mx-auto relative">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center px-6 mb-6 gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-heading-16 text-g-gray-1000">
              Designations List
            </h3>{" "}
            <CountBadge count={totalItems} />
          </div>
          <div className="flex sm:items-center gap-4 flex-col sm:flex-row">
            <CustomDropdown
              id="department-filter"
              name="department"
              options={departmentOptions}
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              placeholder="Select Department"
            />
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Designation Title"
              id="designation-search"
              name="designationSearch"
            />
          </div>
        </div>
        <div className="relative">
          <TanstackTable
            columns={designationColumns}
            data={localData}
            showCheckboxes={true}
            selectedRows={selectedRows}
            isLoading={false}
            showTdBottomBorder={true}
            showBulkDelete={true}
            meta={{
              toggleRowSelection,
              toggleAllRowsSelection, // Add the new function to meta
              selectedRows,
              setIsBulkDelete,
              setIsDeleteModalOpen,
              setDesignationToDelete,
              handleEdit,
              router,
            }}
          // ref={tableBodyRef}
          />

          {/* {selectedRows.length > 0 && (
            <div
              className="absolute top-[48px] right-0 flex items-center justify-center bg-g-background-100 border-l border-g-gray-alpha-400 shadow-md z-10"
              style={{
                height: `${tableBodyHeight}px`, // Adjust dynamically if needed
                width: "88px",
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
                disabled={currentPage === 1}
              />
              <Button
                label="Next"
                variant="outline"
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={currentPage >= totalPages}
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
          isLoading={isDeleting}
          TextMessage="Designation will be deleted, and unfortunately, you won't be able to get it back."
        />
        <CustomModal
          isOpen={isModalOpen}
          variant="bottom-full"
          className=""
          onClose={() => setIsModalOpen(false)}
          title={designationToEdit ? "Edit Designation" : "Create Designation"}
        >
          <CreateDesignation
            initialValues={designationToEdit || undefined}
            onSubmit={handleCreateOrEditDesignation}
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

export default DesignationTable;
