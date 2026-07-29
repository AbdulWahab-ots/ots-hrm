import React from "react";
import PayrollPage from "@/components/admin/reports/payroll";

export const generateMetadata = () => ({
    title: "Payroll Items | SmartHR",
    description: "Manage payroll components including additions, overtime, and deductions for employee compensation.",
    keywords: [
        "payroll items",
        "salary additions",
        "payroll deductions",
        "overtime management",
        "compensation components"
    ]
});

function Page() {
    return (
        <PayrollPage />
    );
}

export default Page;
