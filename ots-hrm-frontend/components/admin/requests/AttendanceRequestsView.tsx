"use client";
import React, { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { useDispatch } from "react-redux";
import { StatsCard } from "./StatCard";
import SegmentedTabs from "@/components/common/SegmentedTabs";
import { AppDispatch } from "@/store/store";
import { fetchAllRequests } from "@/services/adminServices";
import { GetRequestsPayload } from "@/utils/types";
import { nowBusiness } from "@/utils/timezone";

const PERIOD_OPTIONS: {
  value: "daily" | "weekly" | "monthly" | "yearly";
  label: string;
}[] = [
  { value: "daily", label: "D" },
  { value: "weekly", label: "W" },
  { value: "monthly", label: "M" },
  { value: "yearly", label: "Y" },
];

const AttendanceRequestsView = () => {
  const [activeFilter, setActiveFilter] = useState<
    "daily" | "weekly" | "monthly" | "yearly"
  >("daily");
  const [counts, setCounts] = useState({ approved: 0, pending: 0, rejected: 0 });
  const dispatch = useDispatch<AppDispatch>();

  const fetchCounts = useCallback(async () => {
    const today = nowBusiness();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    switch (activeFilter) {
      case "weekly":
        startDate.setDate(today.getDate() - 7);
        break;
      case "monthly":
        startDate.setMonth(today.getMonth() - 1);
        break;
      case "yearly":
        startDate.setFullYear(today.getFullYear() - 1);
        break;
    }

    const payload: GetRequestsPayload = {
      pagedListRequest: { pageNo: 1, pageSize: 1000, getAllRecords: true },
      queryOptionsRequest: {
        filtersRequest: [
          {
            field: "date",
            operator: 1,
            matchMode: 10,
            rangeValues: {
              start: format(startDate, "yyyy-MM-dd"),
              end: format(endDate, "yyyy-MM-dd"),
            },
          },
        ],
      },
    };

    try {
      const response = await fetchAllRequests(dispatch, payload);
      const requests: any[] = response?.result?.data ?? [];
      setCounts({
        approved: requests.filter((r) => r.status === "APPROVED").length,
        pending: requests.filter((r) => r.status === "PENDING").length,
        rejected: requests.filter((r) => r.status === "REJECTED").length,
      });
    } catch (error) {
      console.error("Failed to fetch request stats:", error);
      setCounts({ approved: 0, pending: 0, rejected: 0 });
    }
  }, [dispatch, activeFilter]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const total = counts.approved + counts.pending + counts.rejected;

  return (
    <div>
      <div className="pb-6 flex justify-between items-center">
        <p className="text-copy-14 text-(--genrel-text-light)">
          Total Requests
        </p>
        <SegmentedTabs
          options={PERIOD_OPTIONS}
          value={activeFilter}
          onChange={setActiveFilter}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Decline"
          value={counts.rejected}
          activeValue={counts.rejected}
          inactiveValue={total - counts.rejected}
        />
        <StatsCard
          title="Approved"
          value={counts.approved}
          activeValue={counts.approved}
          inactiveValue={total - counts.approved}
        />
        <StatsCard
          title="Pending"
          value={counts.pending}
          activeValue={counts.pending}
          inactiveValue={total - counts.pending}
        />
      </div>
    </div>
  );
};

export default AttendanceRequestsView;
