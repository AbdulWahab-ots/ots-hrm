import React from "react";
import AnnouncementsPage from "@/components/admin/alerts/announcements";

export const generateMetadata = () => ({
    title: "HR Announcements | SmartHR",
    description:
        "Post and manage organization-wide announcements such as holidays, policy updates, and important messages.",
    keywords: [
        "HR announcements",
        "company news",
        "employee updates",
        "holiday notices",
        "SmartHR",
    ],
});

function Page() {
    return (
        <AnnouncementsPage />
    );
}

export default Page;
