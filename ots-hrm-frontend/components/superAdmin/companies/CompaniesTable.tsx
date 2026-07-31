"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { ArrowUpToLine, Plus } from "lucide-react";
import DeleteConfirmationModal from "../../common/DeleteConfirmation";
import Button from "@/components/common/Button";
import { TanstackTable } from "../../common/TanstackTable";
import CustomModal from "../../common/CustomModal";
import CreateCompanyForm from "./createComapny/CreateCompanyForm";
import SearchInput from "@/components/common/form/SearchInput";
import CustomDropdown from "@/components/common/form/DropDown";
import AddUserForm from "./createComapny/AddUserForm";
import DateRangeField from "@/components/common/form/DateRangeField";
import DateRangePickerModal from "@/components/common/form/DateRangePickerModal";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import {
  getAllCompaniesAPI,
  deleteCompanyAPI,
  updateCompanyAPI,
  uploadCompanyLogoAPI,
} from "@/services/superAdminServices";
import { Company, GetCompaniesPayload } from "@/utils/types";
import { setIsLoading } from "@/store/features/global/globalSlice";
import { companyColumns } from "@/utils/companyColumns";
import { FiTrash2 } from "react-icons/fi";
import BulkDeleteButton from "@/components/common/BulkDeleteButton";
import CountBadge from "@/components/common/CountBadge";

const CompaniesTable = () => {
  const [localData, setLocalData] = useState<Company[]>([]);
  const [selectedRows, setSelectedRows] = useState<Company[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedValue, setSelectedValue] = useState("");
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);
  const [tableBodyHeight, setTableBodyHeight] = useState(0);

  useEffect(() => {
    if (tableBodyRef.current) {
      setTableBodyHeight(tableBodyRef.current.offsetHeight);
    }
  }, [localData]);


  const [selectedRange, setSelectedRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: null,
    endDate: null,
  });
  const [companyDataForUsers, setCompanyDataForUsers] = useState<{
    name: string;
    email: string;
    logo?: File;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setLocalIsLoading] = useState(false);
  const itemsPerPage = 5;

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const options = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const fetchCompanies = useCallback(
    async (
      page: number,
      filters: GetCompaniesPayload["queryOptionsRequest"]
    ) => {
      const payload: GetCompaniesPayload = {
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
          includes: ["users"],
        },
      };

      try {
        setLocalIsLoading(true);
        dispatch(setIsLoading(true));
        const response = await getAllCompaniesAPI(dispatch, payload);
        if (response && response.result) {
          setLocalData(
            response.result.data.map((company) => ({
              ...company,
              selected: false,
            }))
          );
          setTotalPages(response.result.numberOfPages);
          setTotalItems(response.result.total);
        }
      } catch (error) {
        console.error("Failed to fetch companies");
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
        const deletePromises = selectedRows.map((company) =>
          deleteCompanyAPI(dispatch, company.id)
        );
        const results = await Promise.all(deletePromises);
        if (results.every((result) => result)) {
          const filters = buildFilters();
          fetchCompanies(currentPage, filters);
        }
      } else if (companyToDelete) {
        const success = await deleteCompanyAPI(dispatch, companyToDelete);
        if (success) {
          const filters = buildFilters();
          fetchCompanies(currentPage, filters);
        }
      }
    } catch (error) {
      console.error("An error occurred during deletion");
    } finally {
      setIsDeleteModalOpen(false);
      setCompanyToDelete(null);
      setIsBulkDelete(false);
      setSelectedRows([]);
      setLocalIsLoading(false);
      dispatch(setIsLoading(false));
    }
  };

  const buildFilters = () => {
    const filters: GetCompaniesPayload["queryOptionsRequest"] = {
      filtersRequest: [],
      sortRequest: [
        {
          field: "createdAt",
          direction: 1,
          priority: 1,
        },
      ],
      includes: ["users"],
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

    if (selectedValue) {
      filters.filtersRequest.push({
        field: "active",
        operator: 1,
        matchMode: 1,
        value: selectedValue === "active",
      });
    }

    if (debouncedSearchTerm) {
      const isEmailSearch = debouncedSearchTerm.includes("@");

      filters.filtersRequest.push({
        field: isEmailSearch ? "email" : "name",
        operator: 1,
        matchMode: 1,
        value: debouncedSearchTerm,
      });
    }

    return filters;
  };

  useEffect(() => {
    const filters = buildFilters();
    fetchCompanies(currentPage, filters);
  }, [
    currentPage,
    selectedValue,
    debouncedSearchTerm,
    selectedRange,
    fetchCompanies,
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
      prevData.map((company) =>
        company.id === id
          ? { ...company, selected: !company.selected }
          : company
      )
    );
  };

  const handleEdit = (company: Company) => {
    setCompanyToEdit(company);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setCompanyToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditCompany = async (companyData: {
    id: string;
    name: string;
    email: string;
    logo?: File | null;
  }) => {
    if (!companyData.id) return;

    try {
      dispatch(setIsLoading(true));

      const payload = {
        name: companyData.name,
        email: companyData.email,
      };

      // Trigger both APIs in parallel
      const updatePromise = updateCompanyAPI(dispatch, payload, companyData.id);
      const logoPromise = companyData.logo
        ? uploadCompanyLogoAPI(dispatch, companyData.id, companyData.logo)
        : Promise.resolve(true);

      const [updateSuccess, logoSuccess] = await Promise.all([
        updatePromise,
        logoPromise,
      ]);

      if (updateSuccess || logoSuccess) {
        const filters = buildFilters();
        await fetchCompanies(currentPage, filters);
      }
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      dispatch(setIsLoading(false));
      setIsModalOpen(false);
    }
  };

  useEffect(() => {
    const selected = localData.filter((company) => company.selected);
    setSelectedRows(selected);
  }, [localData]);

  const toggleAllRowsSelection = (selectAll: boolean) => {
    setLocalData((prevData) =>
      prevData.map((company) => ({
        ...company,
        selected: selectAll,
      }))
    );
  };

  useEffect(() => {
    if (
      isDeleteModalOpen ||
      isModalOpen ||
      isAddUserModalOpen ||
      isDateModalOpen
    ) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isDeleteModalOpen, isModalOpen, isAddUserModalOpen, isDateModalOpen]);

  return (
    <>
      <div className="flex justify-between items-center pb-4">
        <h2 className="text-g-gray-1000 text-lg sm:text-2xl md:text-3xl font-semibold">
          Child Companies
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
            <h3 className="text-heading-16 text-g-gray-1000">Companies List</h3>
            <CountBadge count={totalItems} />
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <CustomDropdown
                id="status-filter"
                name="status"
                options={options}
                value={selectedValue}
                onChange={(e) => setSelectedValue(e.target.value)}
                placeholder="Status"
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
              placeholder="Search"
              id="user-search"
              name="userSearch"
            />
          </div>
        </div>

        <CustomModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={companyToEdit ? "Edit Company" : "Create Company"}
        >
          <CreateCompanyForm
            onClose={() => setIsModalOpen(false)}
            onAddUserClick={
              companyToEdit
                ? undefined
                : (data) => {
                  setCompanyDataForUsers(data);
                  setIsModalOpen(false);
                  setIsAddUserModalOpen(true);
                }
            }
            onEditCompanyClick={companyToEdit ? handleEditCompany : undefined}
            companyToEdit={companyToEdit}
          />
        </CustomModal>

        <CustomModal
          isOpen={isAddUserModalOpen}
          onClose={() => {
            setIsAddUserModalOpen(false);
            setIsModalOpen(true);
          }}
          title="Add Users to Company"
        >
          {companyDataForUsers && (
            <AddUserForm
              onClose={() => {
                setIsAddUserModalOpen(false);
                setIsModalOpen(true);
              }}
              companyData={companyDataForUsers}
            />
          )}
        </CustomModal>
        <DateRangePickerModal
          isOpen={isDateModalOpen}
          onClose={handleCloseDateModal}
          onSave={handleSaveRange}
          initialRange={selectedRange}
        />

        <div className="relative">
          <TanstackTable
            columns={companyColumns}
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
              setCompanyToDelete,
              handleEdit,
              router,
            }}
            ref={tableBodyRef}
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
          {/* <BulkDeleteButton
            selectedRowsLength={selectedRows.length}
            tableBodyHeight={tableBodyHeight}
            onDeleteClick={() => {
              setIsBulkDelete(true);
              setIsDeleteModalOpen(true);
            }}
          /> */}


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
            <p className="text-copy-14 text-g-gray-900">
              Page {currentPage} of {totalPages}
            </p>
          </div>
        </div>

        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onCancel={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          isBulkDelete={isBulkDelete}
          isLoading={isLoading}
          TextMessage="Company will be deleted, and unfortunately, you won't be able to get it back"
        />
      </div>
    </>
  );
};

export default CompaniesTable;
