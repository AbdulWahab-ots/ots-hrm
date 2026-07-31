"use client";

import React, { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { useRouter, useParams } from "next/navigation";
import { ArrowUpToLine, Plus } from "lucide-react";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmation";
import Button from "@/components/common/Button";
import { TanstackTable } from "@/components/common/TanstackTable";
import CustomModal from "@/components/common/CustomModal";
import CustomDropdown from "@/components/common/form/DropDown";
import DateRangeField from "@/components/common/form/DateRangeField";
import DateRangePickerModal from "@/components/common/form/DateRangePickerModal";
import AddAdminForm from "./AddAdmin/AddAdminForm";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import {
  getAllCompaniesAPI,
  getAllInvitesAPI,
  deleteUserAPI,
  deleteInviteAPI,
} from "@/services/superAdminServices";
import { setIsLoading } from "@/store/features/global/globalSlice";
import { userColumns, inviteColumns } from "@/utils/userColumns";
import {
  GetCompaniesPayload,
  GetInvitesPayload,
  Users,
  InvitedUser,
  TableMeta,
} from "@/utils/company";

const AdminTable = () => {
  const [localDataUsers, setLocalDataUsers] = useState<Users[]>([]);
  const [localDataInvites, setLocalDataInvites] = useState<InvitedUser[]>([]);
  const [selectedRows, setSelectedRows] = useState<(Users | InvitedUser)[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedRange, setSelectedRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: null,
    endDate: null,
  });
  const [userToEdit, setUserToEdit] = useState<Users | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setLocalIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"users" | "invites">("users");
  const [companyName, setCompanyName] = useState("");
  const itemsPerPage = 5;

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const params = useParams();
  const companyId = params.admin as string | undefined;

  const statusOptions =
    viewMode === "users"
      ? [
          { value: "", label: "All Statuses" },
          { value: "Active", label: "Active" },
          { value: "Inactive", label: "Inactive" },
        ]
      : [
          { value: "", label: "All Statuses" },
          { value: "PENDING", label: "Pending" },
          { value: "ACCEPTED", label: "Accepted" },
          { value: "EXPIRED", label: "Expired" },
        ];

  const fetchUsers = useCallback(
    async (
      page: number,
      filters: GetCompaniesPayload["queryOptionsRequest"]
    ) => {
      if (!companyId) {
        console.error(
          "Company ID is missing. Please ensure you're accessing the correct company page."
        );
        setLocalDataUsers([]);
        setLocalIsLoading(false);
        dispatch(setIsLoading(false));
        return;
      }

      const payload: GetCompaniesPayload = {
        pagedListRequest: {
          pageNo: page,
          pageSize: itemsPerPage,
          getAllRecords: false,
        },
        queryOptionsRequest: {
          filtersRequest: [
            {
              field: "id",
              operator: 1,
              matchMode: 1,
              value: companyId,
            },
            ...filters.filtersRequest,
          ],
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
          const company = response.result.data[0];
          if (company && company.users) {
            setCompanyName(company.name || "Company");
            setLocalDataUsers(
              company.users.map((user) => ({
                ...user,
                selected: false,
              }))
            );
            setTotalPages(response.result.numberOfPages);
            setTotalItems(response.result.total);
          } else {
            console.error("No users found in company data");
            setLocalDataUsers([]);
          }
        } else {
          console.error("Invalid API response: No result found");
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLocalIsLoading(false);
        dispatch(setIsLoading(false));
      }
    },
    [dispatch, companyId]
  );

  const fetchInvites = useCallback(
    async (page: number, filters: GetInvitesPayload["queryOptionsRequest"]) => {
      if (!companyId) {
        console.error(
          "Company ID is missing. Please ensure you're accessing the correct company page."
        );
        setLocalDataInvites([]);
        setLocalIsLoading(false);
        dispatch(setIsLoading(false));
        return;
      }

      const payload: GetInvitesPayload = {
        pagedListRequest: {
          pageNo: page,
          pageSize: itemsPerPage,
          getAllRecords: false,
        },
        queryOptionsRequest: {
          filtersRequest: [
            {
              field: "companyId",
              operator: 1,
              matchMode: 1,
              value: companyId,
            },
            ...filters.filtersRequest,
          ],
          sortRequest: [
            {
              field: "createdAt",
              direction: 1,
              priority: 1,
            },
          ],
          includes: [],
        },
      };

      try {
        setLocalIsLoading(true);
        dispatch(setIsLoading(true));
        const response = await getAllInvitesAPI(dispatch, payload);
        if (response && response.result) {
          const invites = response.result.data;
          if (invites) {
            setLocalDataInvites(
              invites.map((invite) => ({
                ...invite,
                selected: false,
              }))
            );
            setTotalPages(response.result.numberOfPages);
            setTotalItems(response.result.total);
          } else {
            console.error("No invites found");
            setLocalDataInvites([]);
          }
        } else {
          console.error("Invalid API response: No result found");
        }
      } catch (error) {
        console.error("Failed to fetch invites:", error);
      } finally {
        setLocalIsLoading(false);
        dispatch(setIsLoading(false));
      }
    },
    [dispatch, companyId]
  );

  const handleDelete = async () => {
    try {
      setLocalIsLoading(true);
      dispatch(setIsLoading(true));
      if (isBulkDelete && selectedRows.length > 0) {
        const deletePromises = selectedRows.map((item) =>
          viewMode === "users"
            ? deleteUserAPI(dispatch, item.id)
            : deleteInviteAPI(dispatch, item.id)
        );
        const results = await Promise.all(deletePromises);
        if (results.every((result) => result)) {
          const filters = buildFilters();
          viewMode === "users"
            ? fetchUsers(currentPage, filters)
            : fetchInvites(currentPage, filters);
        }
      } else if (itemToDelete) {
        const success =
          viewMode === "users"
            ? await deleteUserAPI(dispatch, itemToDelete)
            : await deleteInviteAPI(dispatch, itemToDelete);
        if (success) {
          const filters = buildFilters();
          viewMode === "users"
            ? fetchUsers(currentPage, filters)
            : fetchInvites(currentPage, filters);
        }
      }
    } catch (error) {
      console.error("An error occurred during deletion:", error);
    } finally {
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
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
      includes: viewMode === "users" ? ["users"] : [],
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

    if (selectedStatus) {
      filters.filtersRequest.push({
        field: viewMode === "users" ? "active" : "status",
        operator: 1,
        matchMode: 1,
        value:
          viewMode === "users"
            ? selectedStatus === "Active"
              ? "true"
              : "false"
            : selectedStatus,
      });
    }

    return filters;
  };

  useEffect(() => {
    const filters = buildFilters();
    if (viewMode === "users") {
      fetchUsers(currentPage, filters);
    } else {
      fetchInvites(currentPage, filters);
    }
  }, [
    currentPage,
    selectedStatus,
    selectedRange,
    viewMode,
    fetchUsers,
    fetchInvites,
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

  const toggleRowSelectionUsers = (id: string) => {
    setLocalDataUsers((prevData) =>
      prevData.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const toggleRowSelectionInvites = (id: string) => {
    setLocalDataInvites((prevData) =>
      prevData.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleEdit = (item: Users) => {
    setUserToEdit(item);
    setIsAddUserModalOpen(true);
  };

  const handleSuccess = () => {
    const filters = buildFilters();
    viewMode === "users"
      ? fetchUsers(currentPage, filters)
      : fetchInvites(currentPage, filters);
    // Removed setting isSuccessModalOpen to prevent opening AdminTable's SuccessConfirmation
  };

  useEffect(() => {
    const selected =
      viewMode === "users"
        ? localDataUsers.filter((item) => item.selected)
        : localDataInvites.filter((item) => item.selected);
    setSelectedRows(selected);
  }, [localDataUsers, localDataInvites, viewMode]);

  useEffect(() => {
    if (isDeleteModalOpen || isAddUserModalOpen || isDateModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isDeleteModalOpen, isAddUserModalOpen, isDateModalOpen]);

  return (
    <>
      <div className="flex justify-between items-center pb-4">
        <h2 className="flex gap-4 font-semibold">
          <button
            onClick={() => setViewMode("users")}
            className={`px-3 py-3 text-base rounded-[var(--g-radius-sm)] focus-ring-geist ${
              viewMode === "users"
                ? "bg-g-blue-100 text-g-gray-1000 border-[1px] border-g-blue-100 text-base"
                : "text-g-gray-700"
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setViewMode("invites")}
            className={`px-3 py-3 text-base rounded-[var(--g-radius-sm)] focus-ring-geist ${
              viewMode === "invites"
                ? "bg-g-blue-100 text-g-gray-1000 border-[1px] border-g-blue-100 text-base"
                : "text-g-gray-700"
            }`}
          >
            Invites
          </button>
        </h2>
        <div className="flex gap-4">
          {viewMode === "users" && (
            <Button
              icon={ArrowUpToLine}
              variant="outline"
              iconPosition="center"
            />
          )}

          <Button
            icon={Plus}
            variant="filled"
            label={viewMode === "users" ? "Add User" : "Invite User"}
            onClick={() => {
              setUserToEdit(null);
              setIsAddUserModalOpen(true);
            }}
          />
        </div>
      </div>
      <div className="border-[1px] bg-g-background-100 py-6 border-g-gray-alpha-400 rounded-[var(--g-radius-md)] shadow-geist-card mx-auto">
        <CustomModal
          isOpen={isAddUserModalOpen}
          onClose={() => {
            setIsAddUserModalOpen(false);
            setUserToEdit(null);
          }}
          title={
            viewMode === "users" && userToEdit
              ? "Edit User"
              : viewMode === "users"
              ? "Add User"
              : "Invite User"
          }
        >
          <AddAdminForm
            onClose={() => {
              setIsAddUserModalOpen(false);
              setUserToEdit(null);
            }}
            companyData={{
              name: companyName,
              email: "",
              companyId: companyId || "",
            }}
            viewMode={viewMode}
            onSuccess={handleSuccess}
            initialValues={
              userToEdit
                ? {
                    userName: userToEdit.userName,
                    email: userToEdit.email,
                    firstName: userToEdit.firstName || "",
                    lastName: userToEdit.lastName || "",
                    password: "",
                    confirmPassword: "",
                  }
                : undefined
            }
            userId={userToEdit?.id}
          />
        </CustomModal>
        <div className="flex justify-between items-center px-6 mb-6">
          <h3 className="text-heading-16 text-g-gray-1000">
            {companyName} {viewMode === "users" ? "Users" : "Invites"}
          </h3>
          <div className="flex items-center gap-4">
            <CustomDropdown
              id="status-filter"
              name="status"
              options={statusOptions}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
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
        </div>

        <DateRangePickerModal
          isOpen={isDateModalOpen}
          onClose={handleCloseDateModal}
          onSave={handleSaveRange}
          initialRange={selectedRange}
        />

        <div className="relative">
          {viewMode === "users" ? (
            <TanstackTable
              columns={userColumns}
              data={localDataUsers}
              className=""
              showCheckboxes={true}
              selectedRows={selectedRows}
              isLoading={isLoading}
              meta={
                {
                  toggleRowSelection: toggleRowSelectionUsers,
                  selectedRows,
                  setIsBulkDelete,
                  setIsDeleteModalOpen,
                  setDepartmentToDelete: setItemToDelete,
                  handleEdit,
                  router,
                  refreshData: () => {
                    const filters = buildFilters();
                    fetchUsers(currentPage, filters);
                  },
                } as TableMeta<Users>
              }
            />
          ) : (
            <TanstackTable
              columns={inviteColumns}
              data={localDataInvites}
              className=""
              showCheckboxes={true}
              selectedRows={selectedRows}
              isLoading={isLoading}
              meta={
                {
                  toggleRowSelection: toggleRowSelectionInvites,
                  selectedRows,
                  setIsBulkDelete,
                  setIsDeleteModalOpen,
                  setDepartmentToDelete: setItemToDelete,
                  handleEdit: () => {}, // No edit for invites
                  router,
                  refreshData: () => {
                    const filters = buildFilters();
                    fetchInvites(currentPage, filters);
                  },
                } as TableMeta<InvitedUser>
              }
            />
          )}

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
          isLoading={isLoading}
          TextMessage="Item will be deleted, and unfortunately, you won't be able to get it back."
        />
      </div>
    </>
  );
};

export default AdminTable;
