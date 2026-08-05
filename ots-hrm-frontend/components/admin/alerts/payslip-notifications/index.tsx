"use client";

import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { FiEye } from "react-icons/fi";
import { AppDispatch } from "@/store/store";
import CustomModal from "@/components/common/CustomModal";
import PayrollView from "@/components/admin/paystub/PayrollView";
import { Payroll, payrollToRow } from "@/components/admin/paystub/PayrollTable";
import { fetchPayrolls } from "@/services/payrollService";
import {
  nowBusiness,
  businessStartOfDayAsStoredTimestamp,
  businessEndOfDayAsStoredTimestamp,
} from "@/utils/timezone";

const monthLabel = (month: string) => {
  const [year, monthNum] = month.split("-");
  const date = new Date(Number(year), Number(monthNum) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

const PaySlipNotificationsPage = () => {
  const [sortOption, setSortOption] = useState<string>("");
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const dispatch = useDispatch<AppDispatch>();

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const res: any = await fetchPayrolls(dispatch, { page: 1, pageSize: 100 });
      let rows: Payroll[] = (res?.result?.data ?? []).map(payrollToRow);

      // "Last 7 Days" restricts to payslips generated (createdAt) in the last
      // 7 days - createdAt is populated via `new Date()` in backend app code
      // and stored as raw Asia/Karachi wall-clock digits in a `timestamp`
      // column, so the boundary must be expressed in that same
      // representation rather than as a true UTC instant.
      if (sortOption === "") {
        const today = nowBusiness();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6);
        const start = businessStartOfDayAsStoredTimestamp(sevenDaysAgo);
        const end = businessEndOfDayAsStoredTimestamp(today);
        rows = rows.filter((p) => {
          const raw = (res?.result?.data ?? []).find((r: any) => r.id === p.id);
          return raw?.createdAt >= start && raw?.createdAt <= end;
        });
      } else {
        rows = [...rows].sort((a, b) => a.employee.name.localeCompare(b.employee.name));
      }

      setPayrolls(rows);
    } catch (error) {
      console.error("Failed to fetch payslip notifications:", error);
      setPayrolls([]);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, sortOption]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

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
          {isLoading ? (
            <tr>
              <td colSpan={3} className="py-6 px-6 text-center text-copy-14 text-g-gray-700">
                Loading...
              </td>
            </tr>
          ) : payrolls.length === 0 ? (
            <tr>
              <td colSpan={3} className="py-6 px-6 text-center text-copy-14 text-g-gray-700">
                No payslip notifications found.
              </td>
            </tr>
          ) : (
            payrolls.map((item) => (
              <tr key={item.id} className="hover:bg-g-gray-100">
                <td className="py-4 px-6 whitespace-nowrap text-copy-14 text-g-gray-800">
                  {item.employee.name}
                </td>
                <td className="py-4 px-6 whitespace-nowrap">
                  <span className="px-3 py-1 inline-flex text-label-12 font-semibold rounded-full bg-g-gray-200 text-g-gray-900">
                    {monthLabel(item.month)}
                  </span>
                </td>
                <td className="py-4 px-6 whitespace-nowrap">
                  <button
                    className="cursor-pointer rounded-[var(--g-radius-sm)] focus-ring-geist text-g-gray-800 hover:text-g-blue-800"
                    onClick={() => setSelectedPayroll(item)}
                    title="View payslip"
                  >
                    <FiEye size={16} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <CustomModal
        isOpen={!!selectedPayroll}
        onClose={() => setSelectedPayroll(null)}
        title=""
        variant="bottom-full"
        className="h-full"
      >
        {selectedPayroll && <PayrollView payroll={selectedPayroll} readOnly />}
      </CustomModal>
    </div>
  );
};

export default PaySlipNotificationsPage;
