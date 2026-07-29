import React from "react";
import UsersPage from "@/components/admin/users";

export const generateMetadata = () => ({
  title: "Users | SmartHR",
  description: "Manage system users with role-based access control, status tracking, and comprehensive filtering options.",
  keywords: [
    "user management",
    "access control",
    "user roles",
    "active users",
    "employee portal"
  ]
});

export default function UserManagementPage() {
  return (
    <UsersPage />
  );
}