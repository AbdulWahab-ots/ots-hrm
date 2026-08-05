"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { getAllVacationsAPI } from "@/services/employeeService";
import { GetVacationsPayload, Vocation } from "@/utils/company";
import {
  nowBusiness,
  businessStartOfDayAsStoredTimestamp,
  businessEndOfDayAsStoredTimestamp,
} from "@/utils/timezone";

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const formatDateRange = (fromDate: string | null, toDate: string | null) => {
  if (!fromDate || !toDate) return "N/A";
  const start = formatDate(fromDate);
  if (fromDate === toDate) return start;
  return `${start} - ${formatDate(toDate)}`;
};

const statusLabel: Record<Vocation["status"], string> = {
  APPROVED: "Approved",
  PENDING: "Pending",
  REJECTED: "Rejected",
};

const statusBadgeClass: Record<Vocation["status"], string> = {
  APPROVED: "bg-g-green-100 text-g-green-800",
  REJECTED: "bg-g-red-100 text-g-red-800",
  PENDING: "bg-g-amber-100 text-g-amber-800",
};

const LeaveUpdatesPage = () => {
  const [sortOption, setSortOption] = useState<string>("");
  const [leaves, setLeaves] = useState<Vocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  const fetchLeaves = useCallback(async () => {
    const filtersRequest: GetVacationsPayload["queryOptionsRequest"]["filtersRequest"] =
      [
        { field: "requestType", operator: 1, matchMode: 1, value: "LEAVE" },
      ];

    // "Last 7 Days" restricts to leave requests created in the last 7 days.
    // createdAt is a real timestamp column, but is populated via `new Date()`
    // in backend app code and written into a `timestamp` (no time zone)
    // column - Postgres silently drops the offset on insert, keeping only
    // the server OS's (Asia/Karachi) wall-clock digits. These helpers
    // re-express the business-day boundary in that same representation
    // instead of as a true UTC instant.
    if (sortOption === "") {
      const today = nowBusiness();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);
      filtersRequest.push({
        field: "createdAt",
        operator: 1,
        matchMode: 10,
        rangeValues: {
          start: businessStartOfDayAsStoredTimestamp(sevenDaysAgo),
          end: businessEndOfDayAsStoredTimestamp(today),
        },
      });
    }

    const payload: GetVacationsPayload = {
      pagedListRequest: { pageNo: 1, pageSize: 100, getAllRecords: false },
      queryOptionsRequest: {
        filtersRequest,
        sortRequest: [{ field: "createdAt", direction: -1, priority: 1 }],
        includes: ["leaveType", "requestedByUser"],
      },
    };

    try {
      setIsLoading(true);
      const response = await getAllVacationsAPI(dispatch, payload);
      let data = response?.result?.data ?? [];
      // "requestedByUser.firstName" is a relation field - the generic backend
      // sort builder only supports direct columns, so A-Z is sorted client-side.
      if (sortOption === "ascending") {
        data = [...data].sort((a, b) =>
          (a.requestedByUser?.firstName ?? "").localeCompare(
            b.requestedByUser?.firstName ?? ""
          )
        );
      }
      setLeaves(data);
    } catch (error) {
      console.error("Failed to fetch leave updates:", error);
      setLeaves([]);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, sortOption]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  return (
    <div className="overflow-x-auto bg-g-background-100 rounded-[var(--g-radius-md)] p-4 flex flex-col gap-4 shadow-geist-card">
      <div className="flex flex-wrap gsp-4 justify-between items-start md:items-center gap-4">
        <h2 className="text-heading-16">
          Leave Updates List
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
              Leave Type
            </th>
            <th className="py-3 px-6 text-left text-label-13 font-semibold text-g-gray-900 tracking-wider border-b border-g-gray-alpha-400">
              Requested Dates
            </th>
            <th className="py-3 px-6 text-left text-label-13 font-semibold text-g-gray-900 tracking-wider border-b border-g-gray-alpha-400">
              Status
            </th>
            <th className="py-3 px-6 text-left text-label-13 font-semibold text-g-gray-900 tracking-wider border-b border-g-gray-alpha-400">
              Last Updated
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-g-gray-alpha-400">
          {isLoading ? (
            <tr>
              <td colSpan={5} className="py-6 px-6 text-center text-copy-14 text-g-gray-700">
                Loading...
              </td>
            </tr>
          ) : leaves.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-6 px-6 text-center text-copy-14 text-g-gray-700">
                No leave updates found.
              </td>
            </tr>
          ) : (
            leaves.map((item) => (
              <tr key={item.id} className="hover:bg-g-gray-100">
                <td className="py-4 px-6 whitespace-nowrap text-copy-14 text-g-gray-800">
                  {`${item.requestedByUser?.firstName ?? ""} ${item.requestedByUser?.lastName ?? ""}`.trim() || "—"}
                </td>
                <td className="py-4 px-6 whitespace-nowrap text-copy-14 text-g-gray-800">
                  {item.leaveType?.name ?? "—"}
                </td>
                <td className="py-4 px-6 whitespace-nowrap text-copy-14 text-g-gray-800">
                  {formatDateRange(item.fromDate, item.toDate)}
                </td>
                <td className="py-4 px-6 whitespace-nowrap">
                  <span
                    className={`px-3 py-1 inline-flex text-label-12 font-semibold rounded-full ${statusBadgeClass[item.status]}`}
                  >
                    {statusLabel[item.status]}
                  </span>
                </td>
                <td className="py-4 px-6 whitespace-nowrap text-copy-14 text-g-gray-800">
                  {formatDate(item.actionAt ?? item.createdAt)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default LeaveUpdatesPage;
