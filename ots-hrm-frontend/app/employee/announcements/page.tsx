import React from "react";
import EmployeeAnnouncements from "@/components/employee/announcements";

export const generateMetadata = () => ({
  title: "Announcements | SmartHR",
  description: "Company-wide announcements and updates for employees.",
});

export default function EmployeeAnnouncementsPage() {
  return <EmployeeAnnouncements />;
}
