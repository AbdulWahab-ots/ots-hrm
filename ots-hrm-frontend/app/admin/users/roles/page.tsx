import React from "react";
import RolesPage from "@/components/admin/users/roles";

export const generateMetadata = () => ({
  title: "User Roles | SmartHR",
  description: "Manage and configure user roles with status tracking, creation dates, and permission settings.",
  keywords: [
    "user roles",
    "role management",
    "access control",
    "permission settings",
    "user permissions"
  ]
});

export default function UserRolesPage() {
  return (
    <RolesPage />
  );
}