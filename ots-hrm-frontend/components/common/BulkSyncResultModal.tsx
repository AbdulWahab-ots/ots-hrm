"use client";

import React, { useState } from "react";
import Image from "next/image";
import CrossIcon from "../../public/Cross-icon.svg";
import { RefreshCw, AlertCircle } from "lucide-react";

export interface BiometricBulkSyncEmployeeResult {
  employeeId: string;
  employeeName: string;
  outcome: "synced" | "no_record" | "not_enrolled" | "failed";
  message: string;
}

export interface BiometricBulkSyncResult {
  date: string;
  totalEmployees: number;
  syncedCount: number;
  noRecordCount: number;
  notEnrolledCount: number;
  failedCount: number;
  results: BiometricBulkSyncEmployeeResult[];
}

interface BulkSyncResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRun: (date: string) => Promise<BiometricBulkSyncResult | null>;
}

const OUTCOME_STYLES: Record<BiometricBulkSyncEmployeeResult["outcome"], string> = {
  synced: "text-g-green-800 bg-g-green-100",
  no_record: "text-g-gray-900 bg-g-gray-100",
  not_enrolled: "text-g-gray-900 bg-g-gray-100",
  failed: "text-g-red-800 bg-g-red-100",
};

const OUTCOME_LABELS: Record<BiometricBulkSyncEmployeeResult["outcome"], string> = {
  synced: "Synced",
  no_record: "No record",
  not_enrolled: "Not enrolled",
  failed: "Failed",
};

const todayIso = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const BulkSyncResultModal: React.FC<BulkSyncResultModalProps> = ({
  isOpen,
  onClose,
  onRun,
}) => {
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BiometricBulkSyncResult | null>(null);

  const runSync = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await onRun(selectedDate);
      if (!data) {
        setError("Unable to reach the attendance system. Please try again.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Unable to reach the attendance system. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bg-[var(--g-overlay)] inset-0 flex items-center justify-center z-100">
      <div className="bg-g-background-100 rounded-[var(--g-radius-md)] overflow-hidden w-[375px] sm:w-[520px] relative shadow-geist-modal max-h-[85vh] flex flex-col">
        <div
          className="absolute top-[0px] right-0 cursor-pointer focus-ring-geist rounded-[var(--g-radius-sm)]"
          onClick={onClose}
        >
          <Image src={CrossIcon} alt="close icon" />
        </div>
        <div className="p-6 overflow-y-auto">
          <h2 className="text-heading-20 text-g-gray-1000">
            Sync All Employees
          </h2>
          <p className="text-copy-14 text-g-gray-800 mt-1">
            Fetches the latest attendance for every active employee from the
            biometric device. One employee failing won&apos;t stop the rest.
          </p>

          <div className="mt-4 flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-label-14 font-medium text-g-gray-900 mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                max={todayIso()}
                onChange={(e) => setSelectedDate(e.target.value)}
                disabled={isLoading}
                className="block w-full h-10 px-3 border border-g-gray-alpha-400 rounded-[var(--g-radius-sm)] focus:outline-none focus-ring-geist bg-g-background-100 text-g-gray-1000 disabled:opacity-60"
              />
            </div>
            <button
              onClick={runSync}
              disabled={isLoading}
              className="h-10 px-4 rounded-[var(--g-radius-sm)] bg-g-blue-700 text-white text-button-14 cursor-pointer hover:bg-g-blue-800 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? "Syncing…" : "Start Sync"}
            </button>
          </div>

          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-10">
              <RefreshCw size={24} className="text-g-blue-700 animate-spin" />
              <p className="text-copy-14 text-g-gray-800">
                Syncing every active employee — this can take a little while…
              </p>
            </div>
          )}

          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <AlertCircle size={24} className="text-g-red-700" />
              <p className="text-copy-14 text-g-red-800">{error}</p>
            </div>
          )}

          {!isLoading && !error && result && (
            <div className="mt-4">
              <p className="text-copy-14 text-g-gray-900 font-medium">
                {result.syncedCount} synced successfully
                {result.notEnrolledCount > 0 &&
                  `, ${result.notEnrolledCount} not enrolled on the device`}
                {result.noRecordCount > 0 &&
                  `, ${result.noRecordCount} no record for this date`}
                {result.failedCount > 0 && `, ${result.failedCount} failed`}
                {" "}
                out of {result.totalEmployees} employees.
              </p>

              <div className="mt-3 border border-g-gray-alpha-400 rounded-[var(--g-radius-md)] divide-y divide-g-gray-alpha-400 max-h-[320px] overflow-y-auto">
                {result.results.map((r) => (
                  <div
                    key={r.employeeId}
                    className="flex items-center justify-between gap-3 px-4 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-copy-14 font-medium text-g-gray-1000 truncate">
                        {r.employeeName}
                      </p>
                      <p className="text-label-13 text-g-gray-800 truncate">
                        {r.message}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-[2px] rounded-full text-xs font-medium ${OUTCOME_STYLES[r.outcome]}`}
                    >
                      {OUTCOME_LABELS[r.outcome]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-6 p-6 pt-0">
          <button
            onClick={onClose}
            className="text-g-gray-800 text-button-14 cursor-pointer hover:text-g-gray-1000 focus-ring-geist rounded-[var(--g-radius-sm)] px-2 py-1"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkSyncResultModal;
