import React from 'react'
import { employeeMetrics, statsCards } from '@/utils/constants'
import MetricCard from '@/components/common/MetricCard'
import ExportButton from '@/components/common/ExportButton'
import EmployeeChart from './EmployeeChart'

const EmployeeCards = () => {
    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h1 className="text-heading-24">Employee Report</h1>
                <div className="w-auto">
                    <ExportButton />
                </div>
            </div>
            <div className="flex flex-col gap-6 xl:flex-row">
                <div className="w-full xl:w-1/2 bg-g-background-100 p-4 sm:p-6 rounded-[var(--g-radius-md)] shadow-geist-card">
                    <div className="h-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4">
                        {employeeMetrics.map((card, index) => (
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
                <EmployeeChart />
                </div>
            </div></>
    )
}

export default EmployeeCards