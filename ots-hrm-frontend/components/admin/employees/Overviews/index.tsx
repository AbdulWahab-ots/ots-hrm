"use client";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { UserCheck, UserX, UserPlus } from "lucide-react";
import { StatsCard } from "./StatsCard";
import CompositionDonut from "./CompositionDonut";
import { fetchEmployeeStats } from "@/services/adminServices";

interface EmployeeStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  newJoinings: number;
}

const Overviews = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchEmployeeStats(dispatch);
        if (mounted && res?.result) setStats(res.result as EmployeeStats);
      } catch (e) {
        console.error("Failed to fetch employee stats", e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [dispatch]);

  const total = stats?.totalEmployees ?? 0;
  const active = stats?.activeEmployees ?? 0;
  const inactive = stats?.inactiveEmployees ?? 0;
  const newJoinings = stats?.newJoinings ?? 0;
  const pctOf = (n: number) => (total > 0 ? `${Math.round((n / total) * 100)}% of total` : "—");

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="h-[300px] rounded-[var(--g-radius-md)] border border-g-gray-alpha-400 bg-g-background-100 animate-pulse" />
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-[140px] rounded-[var(--g-radius-md)] border border-g-gray-alpha-400 bg-g-background-100 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Workforce composition chart */}
      <div className="bg-g-background-100 p-6 rounded-[var(--g-radius-md)] shadow-geist-card border border-g-gray-alpha-400">
        <h3 className="text-heading-16 text-g-gray-1000 mb-2">Workforce</h3>
        <p className="text-label-13 text-g-gray-700 mb-4">Active vs inactive</p>
        <CompositionDonut active={active} inactive={inactive} />
      </div>

      {/* KPI tiles */}
      <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatsCard
          title="Active"
          value={active}
          sublabel={pctOf(active)}
          accent="green"
          icon={<UserCheck size={18} />}
          tooltip="Employees currently marked active"
        />
        <StatsCard
          title="Inactive"
          value={inactive}
          sublabel={pctOf(inactive)}
          accent="gray"
          icon={<UserX size={18} />}
          tooltip="Employees marked inactive"
        />
        <StatsCard
          title="New Hires"
          value={newJoinings}
          sublabel="last 30 days"
          accent="blue"
          icon={<UserPlus size={18} />}
          tooltip="Employees who joined in the last 30 days"
        />
      </div>
    </div>
  );
};

export default Overviews;
