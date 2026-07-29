"use client";
import React, { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";
import ExportButton from "@/components/common/ExportButton";
import Button from "@/components/common/Button";
import DateRangeDropdown from "@/components/common/form/DateRangeDropdown";
import { BiEdit } from "react-icons/bi";
import { GoShieldLock } from "react-icons/go";
import DeleteConfirmation from "@/components/common/DeleteConfirmation";
import { deleteRoleById, fetchAllRoles } from "@/services/adminServices";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import NoDataFound from "@/components/common/NoDataFound";

const RolesPage = () => {
  const [dateRangeFilter, setDateRangeFilter] = useState<string>(
    "04/26/2025 - 05/02/2025"
  );
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [rolesData, setRolesData] = useState<any>(null);
  const dispatch = useDispatch();
  const isFetchedRoles = useRef(false);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const fetchRoles = async () => {
    const response = await fetchAllRoles(dispatch);
    if (response && response.success) {
      setRolesData(response.result);
    } else {
      setRolesData(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isFetchedRoles.current) {
      fetchRoles();
      isFetchedRoles.current = true;
    }
  }, []);

  const handleEdit = async (item: any) => {
    router.push(`/admin/users/roles/${item.id}/edit`);
  };

  const handleDelete = async (id: string) => {
    await deleteRoleById(dispatch, id).finally(async () => {
      setTimeout(() => {
        fetchRoles();
      }, 1500);
    });
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h1 className="text-heading-24 text-g-gray-1000">Roles</h1>
        <div className="flex flex-row items-stretch gap-3 w-auto">
          <ExportButton />
          <Link href="/admin/users/roles/add" className="cursor-pointer">
            <Button label="Add New Role" icon={Plus}></Button>
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto bg-g-background-100 rounded-[var(--g-radius-md)] flex flex-col gap-4 p-4 shadow-geist-card">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-heading-16 text-g-gray-1000">Roles List</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <DateRangeDropdown
              value={dateRangeFilter}
              onChange={setDateRangeFilter}
            />

            <div className="w-full sm:w-40">
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 border border-gray-300 text-sm rounded-[var(--g-radius-sm)] focus-ring-geist"
              >
                <option value="All">Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-200">
              <th className="py-3 px-6 text-left text-label-13 text-gray-900 tracking-wider border-b border-gray-300">
                Name
              </th>
              <th className="py-3 px-6 text-left text-label-13 text-gray-900 tracking-wider border-b border-gray-300">
                Created Date
              </th>
              <th className="py-3 px-6 text-left text-label-13 text-gray-900 tracking-wider border-b border-gray-300">
                Status
              </th>
              <th className="py-3 px-6 text-left text-label-13 text-gray-900 tracking-wider border-b border-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {!isLoading && rolesData && rolesData?.data?.length > 0 ? (
              rolesData?.data?.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-500">
                    {item.name}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-500">
                    {item.createdAt}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-500">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.active
                          ? "bg-g-green-100 text-g-green-800"
                          : "bg-g-red-100 text-g-red-800"
                      }`}
                    >
                      {item.active ? "Active" : "In-Active"}
                    </span>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/users/permissions?role=${item.name.toLowerCase()}`}
                      >
                        <GoShieldLock className="w-5 h-5 rounded-[var(--g-radius-sm)] focus-ring-geist" />
                      </Link>
                      <BiEdit
                        className="w-5 h-5 cursor-pointer rounded-[var(--g-radius-sm)] focus-ring-geist"
                        onClick={() => handleEdit(item)}
                      />
                      {/* <DeleteConfirmation 
                                            onConfirm={() => handleDelete(item.id)}
                                            itemType="role"
                                        /> */}
                    </div>
                  </td>
                </tr>
              ))
            ) : isLoading ? (
              <tr>
                <td colSpan={4}>
                  <LoadingSpinner fullScreen={false} />
                </td>
              </tr>
            ) : (
              <tr>
                <td colSpan={4} className="">
                  <NoDataFound />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default RolesPage;
