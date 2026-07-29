// app/admin/layout.tsx
import React from "react";
import AdminLayout from "@/components/layouts/AdminLayout";

export default function AdminPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
