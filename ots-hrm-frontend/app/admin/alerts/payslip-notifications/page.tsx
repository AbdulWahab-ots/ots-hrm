import React from "react";
import PaySlipNotificationsPage from "@/components/admin/alerts/payslip-notifications";

export const generateMetadata = () => ({
    title: "Payslip Notifications | SmartHR",
    description:
        "Notify employees when their monthly payslips are available. Track notification history and delivery status.",
    keywords: [
        "payslip notifications",
        "salary slips",
        "employee payslips",
        "HR payroll",
        "SmartHR",
    ],
});

function Page() {
    return (
        <PaySlipNotificationsPage />
    );
}

export default Page;
