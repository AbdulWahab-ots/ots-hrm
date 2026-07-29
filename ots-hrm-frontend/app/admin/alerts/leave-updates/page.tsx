import React from "react";
import LeaveUpdatesPage from "@/components/admin/alerts/leave-updates";

export const generateMetadata = () => ({
    title: "Leave Approval Status | SmartHR",
    description:
        "View and manage employee leave requests including status updates, types of leave, and approval actions.",
    keywords: [
        "leave approval",
        "employee leave requests",
        "leave status",
        "HR management",
        "SmartHR",
    ],
});

function Page() {
    return (
        <LeaveUpdatesPage />
    );
}

export default Page;
