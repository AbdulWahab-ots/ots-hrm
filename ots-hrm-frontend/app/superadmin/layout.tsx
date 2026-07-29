import React from "react";
import SuperAdminLayout from "@/components/layouts/SuperAdminLayout";

export default function AdminPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SuperAdminLayout>{children}</SuperAdminLayout>;
}
