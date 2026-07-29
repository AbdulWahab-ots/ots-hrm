"use client"
import React from "react";
import { attendanceChartData, attendanceMetrics } from "@/utils/constants";
import MetricCard from "@/components/common/MetricCard";
import ExportButton from "@/components/common/ExportButton";
import Link from "next/link";
import Button from "@/components/common/Button";
import { Plus } from "lucide-react";
import Linechart from "@/components/auth/Linechart";

function AttendanceReportsCards() {
    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h1 className="text-heading-24">Attendance Reports</h1>
                <div className="w-auto">
                    <ExportButton />
                </div>
            </div>
            <div className="flex flex-col gap-6 xl:flex-row">
                <div className="w-full xl:w-1/2 bg-g-background-100 p-4 sm:p-6 rounded-[var(--g-radius-md)] shadow-geist-card">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4">
                        {attendanceMetrics.map((metric, index) => (
                            <MetricCard
                                key={`metric-${index}`}
                                title={metric.title}
                                value={metric.value}
                                icon={metric.icon}
                                percentage={metric.percent}
                                percentageColor={metric.percentColor}
                                textColor={metric.textColor}
                                iconBgColor={metric.iconBgColor}
                                footerText="From last month"
                            />
                        ))}
                    </div>
                </div>

                <div className="w-full xl:w-1/2 bg-g-background-100 p-4 sm:p-6 rounded-[var(--g-radius-md)] shadow-geist-card">
                    <Linechart data={attendanceChartData}/>
                </div>
            </div>
        </>
    );
}

export default AttendanceReportsCards;
