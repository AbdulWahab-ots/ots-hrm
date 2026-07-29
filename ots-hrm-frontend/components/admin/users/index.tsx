"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Trash2 } from "lucide-react";
import { AppDispatch } from "@/store/store";
import { TanstackTable, Avatar } from "@/components/common/TanstackTable";
import Button from "@/components/common/Button";
import CountBadge from "@/components/common/CountBadge";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmation";
import { getAllUsersAPI, deleteUserAPI } from "@/services/adminServices";

interface UserRow {
  id: string;
  firstName?: string;
  lastName?: string;
  userName?: string;
  email?: string;
  active?: boolean;
  role?: { name?: string; code?: string };
  createdAt?: string;
}

const RoleBadge = ({ role }: { role?: UserRow["role"] }) => {
  const code = role?.code;
  const cls =
    code === "superAdmin"
      ? "bg-g-purple-100 text-g-purple-700"
      : code === "admin"
      ? "bg-g-blue-100 text-g-blue-700"
      : "bg-g-gray-alpha-200 text-g-gray-900";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-label-12 font-medium ${cls}`}>
      {role?.name || role?.code || "—"}
    </span>
  );
};

const StatusBadge = ({ active }: { active?: boolean }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label-12 font-medium ${
      active ? "bg-g-green-100 text-g-green-900" : "bg-g-gray-alpha-200 text-g-gray-900"
    }`}
  >
    <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-g-green-700" : "bg-g-gray-600"}`} />
    {active ? "Active" : "Inactive"}
  </span>
);

const UsersPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toDelete, setToDelete] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAllUsersAPI(dispatch);
      // This endpoint returns the paged result unwrapped ({ data: [...] });
      // fall back to the wrapped shape just in case.
      const rows = res?.data ?? res?.result?.data ?? [];
      setUsers(rows as UserRow[]);
    } catch (e) {
      console.error("Failed to fetch users", e);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const ok = await deleteUserAPI(dispatch, toDelete.id);
      if (ok) await fetchUsers();
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  };

  const columns = useMemo<ColumnDef<UserRow, any>[]>(
    () => [
      {
        id: "user",
        header: "User",
        cell: (info) => {
          const u = info.row.original;
          const name = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.userName || "—";
          return (
            <div className="flex items-center gap-3">
              <Avatar name={name} size="md" />
              <div>
                <div className="font-medium text-copy-14 text-g-gray-1000">{name}</div>
                {u.userName && (
                  <div className="text-label-13 text-g-gray-700">@{u.userName}</div>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: (info) => (
          <span className="text-copy-14 text-g-gray-900">{info.getValue() || "—"}</span>
        ),
      },
      {
        id: "role",
        header: "Role",
        cell: (info) => <RoleBadge role={info.row.original.role} />,
      },
      {
        id: "status",
        header: "Status",
        cell: (info) => <StatusBadge active={info.row.original.active} />,
      },
      {
        id: "action",
        header: () => <div className="text-right">Action</div>,
        cell: (info) => (
          <div className="flex justify-end">
            <button
              aria-label="Delete user"
              onClick={() => setToDelete(info.row.original)}
              className="flex items-center justify-center w-9 h-9 rounded-[var(--g-radius-sm)] text-g-gray-800 hover:bg-g-red-100 hover:text-g-red-700 transition-colors focus-ring-geist"
            >
              <Trash2 size={17} />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <>
      <div className="flex justify-between items-center pb-4">
        <h2 className="text-g-gray-1000 text-heading-24">Users</h2>
        <Button
          icon={Plus}
          variant="filled"
          label="Add New User"
          onClick={() => router.push("/admin/users/add")}
        />
      </div>

      <div className="border border-g-gray-alpha-400 bg-g-background-100 py-6 rounded-[var(--g-radius-md)] shadow-geist-card">
        <div className="flex items-center gap-2 px-6 mb-6">
          <h3 className="text-g-gray-1000 text-heading-16">User List</h3>
          <CountBadge count={users.length} />
        </div>

        <TanstackTable
          columns={columns}
          data={users}
          isLoading={isLoading}
          showTdBottomBorder
          emptyText="No users yet. Click “Add New User” to create one."
        />
      </div>

      <DeleteConfirmationModal
        isOpen={!!toDelete}
        onCancel={() => setToDelete(null)}
        onConfirm={handleDelete}
        isLoading={deleting}
        TextMessage="This user will be deleted and won't be able to sign in anymore."
      />
    </>
  );
};

export default UsersPage;
