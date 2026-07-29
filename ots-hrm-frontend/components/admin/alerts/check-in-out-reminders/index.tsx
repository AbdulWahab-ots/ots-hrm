"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Bell, RefreshCw, LogIn, LogOut } from "lucide-react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { TanstackTable, Avatar } from "@/components/common/TanstackTable";
import Button from "@/components/common/Button";
import CountBadge from "@/components/common/CountBadge";
import {
  getCheckInOutReminders,
  sendCheckInOutReminders,
} from "@/services/adminServices";

interface Reminder {
  id: string; // = userId (one pending reminder per employee)
  userId: string;
  employeeName: string;
  reminderType: "Check-in" | "Check-out";
  shiftName?: string;
  dueTime?: string;
  date: string;
}

const ReminderBadge = ({ type }: { type: Reminder["reminderType"] }) => {
  const isCheckIn = type === "Check-in";
  const cls = isCheckIn
    ? "bg-g-amber-100 text-g-amber-900"
    : "bg-g-blue-100 text-g-blue-700";
  const Icon = isCheckIn ? LogIn : LogOut;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label-12 font-medium ${cls}`}
    >
      <Icon size={13} />
      {type}
    </span>
  );
};

const CheckInOutRemindersPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null); // "ALL" or a userId

  const fetchReminders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getCheckInOutReminders(dispatch);
      const list = (res?.result ?? []) as Omit<Reminder, "id">[];
      setReminders(list.map((r) => ({ ...r, id: r.userId })));
    } catch (e) {
      console.error("Failed to fetch reminders", e);
      setReminders([]);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const handleSend = async (userIds?: string[]) => {
    setBusyId(userIds ? userIds[0] : "ALL");
    try {
      await sendCheckInOutReminders(dispatch, userIds);
      await fetchReminders();
    } finally {
      setBusyId(null);
    }
  };

  const columns = useMemo<ColumnDef<Reminder, any>[]>(
    () => [
      {
        accessorKey: "employeeName",
        header: "Employee",
        cell: (info) => {
          const r = info.row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar name={r.employeeName} size="md" />
              <span className="font-medium text-copy-14 text-g-gray-1000">
                {r.employeeName}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "reminderType",
        header: "Reminder",
        cell: (info) => <ReminderBadge type={info.getValue()} />,
      },
      {
        accessorKey: "shiftName",
        header: "Shift",
        cell: (info) => (
          <span className="text-copy-14 text-g-gray-900">
            {info.getValue() || "—"}
          </span>
        ),
      },
      {
        accessorKey: "dueTime",
        header: "Due Time",
        cell: (info) => (
          <span className="text-copy-14 text-g-gray-900">
            {info.getValue() || "—"}
          </span>
        ),
      },
      {
        id: "action",
        header: () => <div className="text-right">Action</div>,
        cell: (info) => {
          const r = info.row.original;
          return (
            <div className="flex justify-end">
              <Button
                label="Send"
                variant="outline"
                icon={Bell}
                disabled={busyId !== null}
                onClick={() => handleSend([r.userId])}
              />
            </div>
          );
        },
      },
    ],
    // handleSend/busyId intentionally captured on each render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [busyId]
  );

  return (
    <div className="bg-g-background-100 border border-g-gray-alpha-400 rounded-[var(--g-radius-md)] shadow-geist-card py-6">
      <div className="px-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-heading-16 text-g-gray-1000">
              Check-In/Out Reminders
            </h2>
            <CountBadge count={reminders.length} />
          </div>
          <p className="text-label-13 text-g-gray-700 mt-1">
            Employees who haven&rsquo;t checked in or out yet today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            icon={RefreshCw}
            iconPosition="center"
            onClick={fetchReminders}
            disabled={isLoading || busyId !== null}
          />
          <Button
            label={busyId === "ALL" ? "Sending…" : "Send all reminders"}
            variant="filled"
            icon={Bell}
            onClick={() => handleSend()}
            disabled={busyId !== null || reminders.length === 0 || isLoading}
          />
        </div>
      </div>

      <TanstackTable
        columns={columns}
        data={reminders}
        isLoading={isLoading}
        showTdBottomBorder
        emptyText="No pending reminders — everyone has checked in and out."
      />
    </div>
  );
};

export default CheckInOutRemindersPage;
