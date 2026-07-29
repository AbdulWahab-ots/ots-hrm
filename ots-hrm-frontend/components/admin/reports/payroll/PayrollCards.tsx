"use client"
import MetricCard from '@/components/common/MetricCard'
import { payrollChartdata, payrollMetrics, statsCards } from '@/utils/constants'
import React from 'react'
import ExportButton from '@/components/common/ExportButton'
import Linechart from '@/components/auth/Linechart'

const PayrollCards = () => {
    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h1 className="text-heading-24">Payslip Report</h1>
                <div className="w-auto">
                    <ExportButton />
                </div>
            </div>
            <div className="flex flex-col gap-6 xl:flex-row">
                <div className="w-full xl:w-1/2 bg-g-background-100 p-4 sm:p-6 rounded-[var(--g-radius-md)] shadow-geist-card">
                    <div className="h-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4">
                        {payrollMetrics.map((card, index) => (
                            <MetricCard
                                key={`metric-${index}`}
                                title={card.title}
                                value={card.value}
                                icon={card.icon}
                                textColor={card.iconColor}
                                iconBgColor={card.iconBgColor}
                                isShowCradFooter={false}
                            />
                        ))}
                    </div>
                </div>
                <div className="w-full xl:w-1/2 bg-g-background-100 p-4 sm:p-6 rounded-[var(--g-radius-md)] shadow-geist-card">
                    <Linechart data={payrollChartdata}  />
                </div>
            </div></>
    )
}

export default PayrollCards