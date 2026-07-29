import React from "react";
import LeavePage from "@/components/admin/reports/leave";

export const generateMetadata = () => ({
    title: "Leaves | SmartHR",
    description: "Track and manage employee leaves with status overview, filtering options, and approval workflows.",
    keywords: [
        "leave management",
        "employee leaves",
        "leave tracker",
        "HR system",
        "leave approval"
    ]
});

function Page() {
    return (
        <LeavePage />
    );
}

export default Page;
