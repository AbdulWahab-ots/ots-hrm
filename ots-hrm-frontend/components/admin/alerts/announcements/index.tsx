"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { ColumnDef } from "@tanstack/react-table";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { Plus, Trash2, Pencil } from "lucide-react";
import { AppDispatch } from "@/store/store";
import { TanstackTable } from "@/components/common/TanstackTable";
import Button from "@/components/common/Button";
import CountBadge from "@/components/common/CountBadge";
import CustomModal from "@/components/common/CustomModal";
import InputField from "@/components/common/form/InputField";
import TextArea from "@/components/common/form/TextArea";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmation";
import {
  getAllAnnouncementsAPI,
  createAnnouncementAPI,
  updateAnnouncementAPI,
  deleteAnnouncementAPI,
} from "@/services/adminServices";

interface Announcement {
  id: string;
  title: string;
  description: string;
  createdBy?: string;
  createdAt?: string;
}

const fmtDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

const AnnouncementsPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [items, setItems] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [toEdit, setToEdit] = useState<Announcement | null>(null);
  const [toDelete, setToDelete] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAllAnnouncementsAPI(dispatch);
      setItems((res?.result?.data ?? res?.data ?? []) as Announcement[]);
    } catch (e) {
      console.error("Failed to fetch announcements", e);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const ok = await deleteAnnouncementAPI(dispatch, toDelete.id);
      if (ok) await fetchItems();
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  };

  const columns = useMemo<ColumnDef<Announcement, any>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Announcement",
        cell: (info) => (
          <span className="font-medium text-copy-14 text-g-gray-1000">
            {info.getValue()}
          </span>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: (info) => (
          <span className="text-copy-14 text-g-gray-900 line-clamp-1 max-w-md block">
            {info.getValue()}
          </span>
        ),
      },
      {
        accessorKey: "createdBy",
        header: "Posted By",
        cell: (info) => (
          <span className="text-copy-14 text-g-gray-900">
            {info.getValue() || "—"}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Date",
        cell: (info) => (
          <span className="text-copy-14 text-g-gray-900">
            {fmtDate(info.getValue())}
          </span>
        ),
      },
      {
        id: "action",
        header: () => <div className="text-right">Actions</div>,
        cell: (info) => (
          <div className="flex justify-end gap-1">
            <button
              aria-label="Edit announcement"
              onClick={() => setToEdit(info.row.original)}
              className="flex items-center justify-center w-9 h-9 rounded-[var(--g-radius-sm)] text-g-gray-800 hover:bg-g-blue-100 hover:text-g-blue-700 transition-colors focus-ring-geist"
            >
              <Pencil size={17} />
            </button>
            <button
              aria-label="Delete announcement"
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
        <h2 className="text-g-gray-1000 text-heading-24">Announcements</h2>
        <Button
          icon={Plus}
          variant="filled"
          label="New Announcement"
          onClick={() => setIsCreateOpen(true)}
        />
      </div>

      <div className="border border-g-gray-alpha-400 bg-g-background-100 py-6 rounded-[var(--g-radius-md)] shadow-geist-card">
        <div className="flex items-center gap-2 px-6 mb-6">
          <h3 className="text-g-gray-1000 text-heading-16">Announcements List</h3>
          <CountBadge count={items.length} />
        </div>

        <TanstackTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          showTdBottomBorder
          emptyText="No announcements yet. Post one to notify your team."
        />
      </div>

      {/* Create modal */}
      <CustomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Announcement"
      >
        <Formik
          initialValues={{ title: "", description: "" }}
          validationSchema={Yup.object({
            title: Yup.string().required("Title is required").max(255),
            description: Yup.string().required("Description is required"),
          })}
          onSubmit={async (values, helpers) => {
            const res = await createAnnouncementAPI(dispatch, values);
            helpers.setSubmitting(false);
            if (res) {
              setIsCreateOpen(false);
              helpers.resetForm();
              await fetchItems();
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form className="flex flex-col gap-4 p-1">
              <InputField label="Title" name="title" placeholder="e.g. Office closed on Friday" />
              <TextArea
                label="Description"
                name="description"
                rows={4}
                placeholder="Write the announcement details…"
              />
              <div className="flex justify-end gap-3 mt-2">
                <Button
                  label="Cancel"
                  variant="outline"
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                />
                <Button
                  label={isSubmitting ? "Posting…" : "Post"}
                  type="submit"
                  disabled={isSubmitting}
                />
              </div>
            </Form>
          )}
        </Formik>
      </CustomModal>

      {/* Edit modal */}
      <CustomModal
        isOpen={!!toEdit}
        onClose={() => setToEdit(null)}
        title="Edit Announcement"
      >
        {toEdit && (
          <Formik
            initialValues={{ title: toEdit.title, description: toEdit.description }}
            validationSchema={Yup.object({
              title: Yup.string().required("Title is required").max(255),
              description: Yup.string().required("Description is required"),
            })}
            onSubmit={async (values, helpers) => {
              const res = await updateAnnouncementAPI(dispatch, toEdit.id, values);
              helpers.setSubmitting(false);
              if (res) {
                setToEdit(null);
                await fetchItems();
              }
            }}
          >
            {({ isSubmitting }) => (
              <Form className="flex flex-col gap-4 p-1">
                <InputField label="Title" name="title" placeholder="e.g. Office closed on Friday" />
                <TextArea
                  label="Description"
                  name="description"
                  rows={4}
                  placeholder="Write the announcement details…"
                />
                <div className="flex justify-end gap-3 mt-2">
                  <Button
                    label="Cancel"
                    variant="outline"
                    type="button"
                    onClick={() => setToEdit(null)}
                  />
                  <Button
                    label={isSubmitting ? "Saving…" : "Save"}
                    type="submit"
                    disabled={isSubmitting}
                  />
                </div>
              </Form>
            )}
          </Formik>
        )}
      </CustomModal>

      <DeleteConfirmationModal
        isOpen={!!toDelete}
        onCancel={() => setToDelete(null)}
        onConfirm={handleDelete}
        isLoading={deleting}
        TextMessage="This announcement will be permanently deleted."
      />
    </>
  );
};

export default AnnouncementsPage;
