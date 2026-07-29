"use client";

import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { fetchAttendanceRange } from "@/services/employeeService";
import type { HeatRecord } from "@/utils/attendanceHeatmap";

/**
 * Fetch the logged-in employee's attendance rows for [from, to] (inclusive,
 * "YYYY-MM-DD"). Reuses the existing /attendance/get_all read + auth via
 * fetchAttendanceRange (which does NOT touch the shared attendance slice).
 */
export function useAttendanceRange(from: string, to: string) {
  const dispatch = useDispatch<AppDispatch>();
  const [records, setRecords] = useState<HeatRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchAttendanceRange(dispatch, from, to);
      const rows = (res?.result?.data ?? res?.data ?? []) as HeatRecord[];
      setRecords(rows);
    } catch (e) {
      console.error("useAttendanceRange failed", e);
      setError("Could not load attendance history.");
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  return { records, isLoading, error, refetch: load };
}
