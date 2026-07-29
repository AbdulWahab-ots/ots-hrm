"use client"

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { FiEdit } from "react-icons/fi";
import { IoTrashOutline } from "react-icons/io5";

const PaySlipNotificationsPage = () => {
    const [sortOption, setSortOption] = useState<string>("");
    return (
        <div className="overflow-x-auto bg-g-background-100 rounded-[var(--g-radius-md)] p-4 flex flex-col gap-4 shadow-geist-card">
            <div className="flex flex-wrap justify-between items-start md:items-center gap-4">
                <h2 className="text-heading-16">
                    Payslip Notifications List
                </h2>
                    <div className="relative w-full sm:w-44">
                        <select
                            id="sort"
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                            className="block w-full pl-3 pr-7 py-2 text-label-14 border border-g-gray-alpha-400 focus-ring-geist rounded-[var(--g-radius-sm)] appearance-none bg-g-background-100"
                        >
                            <option value="">Sort By : Last 7 Days</option>
                            <option value="ascending">A-Z</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-g-gray-800 pointer-events-none" />
                    </div>
            </div>

            {/* Table */}
            <table className="min-w-full divide-y divide-g-gray-alpha-400">
                <thead>
                    <tr className="bg-g-gray-200">
                        <th className="py-3 px-6 text-left text-label-13 font-semibold text-g-gray-900 tracking-wider border-b border-g-gray-alpha-400">
                            Employee
                        </th>
                        <th className="py-3 px-6 text-left text-label-13 font-semibold text-g-gray-900 tracking-wider border-b border-g-gray-alpha-400">
                            Month
                        </th>
                        <th className="py-3 px-6 text-left text-label-13 font-semibold text-g-gray-900 tracking-wider border-b border-g-gray-alpha-400">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-g-gray-alpha-400">
                    {[
                        { id: 1, employee: "John Doe", month: "March, 2025" },
                        { id: 2, employee: "Sarah Smith", month: "March, 2025" },
                        { id: 3, employee: "Michael Johnson", month: "March, 2025" },
                        { id: 4, employee: "Emily Davis", month: "March, 2025" }
                    ].map((item) => (
                        <tr key={item.id} className="hover:bg-g-gray-100">
                            <td className="py-4 px-6 whitespace-nowrap text-copy-14 text-g-gray-800">
                                {item.employee}
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                                <span className={`px-3 py-1 inline-flex text-label-12 font-semibold rounded-full bg-g-gray-200 text-g-gray-900`}>
                                    {item.month}
                                </span>
                            </td>
                            <td className="py-4 px-6 whitespace-nowrap">
                                <div className="flex gap-4">
                                    <button className="cursor-pointer rounded-[var(--g-radius-sm)] focus-ring-geist">
                                        <FiEdit size={16} />
                                    </button>
                                    <button className="cursor-pointer rounded-[var(--g-radius-sm)] focus-ring-geist">
                                        <IoTrashOutline size={16} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
};

export default PaySlipNotificationsPage;