"use client";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { StatsCard } from "./StatCard";
import { fetchLeaveStats } from "@/services/employeeService";

interface LeaveStats {
  pending: number;
  approved: number;
  rejected: number;
}

const LeavesRequestsView = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [stats, setStats] = useState<LeaveStats>({
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      const response = await fetchLeaveStats(dispatch);
      if (response?.result) {
        setStats(response.result);
      }
    };
    loadStats();
  }, [dispatch]);

  return (
    <div>
      <div className="pb-6 flex justify-between items-center">
        <p className="text-base font-medium text-(--genrel-text-light)">
          Total Leaves
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard title="Decline" value={stats.rejected} />
        <StatsCard title="Approved" value={stats.approved} />
        <StatsCard title="Pending" value={stats.pending} />
      </div>
    </div>
  );
};

export default LeavesRequestsView;
