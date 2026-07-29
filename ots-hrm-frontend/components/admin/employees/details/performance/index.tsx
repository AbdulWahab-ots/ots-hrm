"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { Plus, Settings2, Pencil, Trash2, TrendingUp, TrendingDown, CalendarClock, ClipboardList, Gauge } from "lucide-react";
import { AppDispatch } from "@/store/store";
import Button from "@/components/common/Button";
import MetricCard from "@/components/common/MetricCard";
import CustomModal from "@/components/common/CustomModal";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmation";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { Assessment, AssessmentPayload, Skill } from "@/utils/performanceTypes";
import {
  getSkillsAPI,
  getEmployeeAssessmentsAPI,
  saveAssessmentAPI,
  deleteAssessmentAPI,
} from "@/services/performanceService";
import ProgressChart from "./ProgressChart";
import AssessmentModal from "./AssessmentModal";
import SkillsManagerModal from "./SkillsManagerModal";

interface PerformanceTabProps {
  employeeId: string;
  joinedDate?: string | null;
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

const tenure = (from?: string | null): string => {
  if (!from) return "—";
  const start = new Date(from);
  if (isNaN(start.getTime())) return "—";
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (months < 0) months = 0;
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y && m) return `${y}y ${m}m`;
  if (y) return `${y}y`;
  return `${m}m`;
};

const PerformanceTab = ({ employeeId, joinedDate }: PerformanceTabProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]); // ascending
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Assessment | null>(null);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    const [sk, as] = await Promise.all([
      getSkillsAPI(dispatch),
      getEmployeeAssessmentsAPI(dispatch, employeeId),
    ]);
    setSkills(sk);
    setAssessments(as);
  }, [dispatch, employeeId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refetch();
      setLoading(false);
    })();
  }, [refetch]);

  const activeSkills = useMemo(() => skills.filter((s) => s.active), [skills]);

  // Header stats
  const { latest, delta, baseline } = useMemo(() => {
    if (!assessments.length) return { latest: 0, delta: 0, baseline: 0 };
    const base = assessments[0].overall;
    const last = assessments[assessments.length - 1].overall;
    return { latest: last, delta: Math.round((last - base) * 10) / 10, baseline: base };
  }, [assessments]);

  // Columns for the history table = skills that appear in any assessment.
  const measuredSkills = useMemo(() => {
    const ids = new Set<string>();
    assessments.forEach((a) => a.scores.forEach((s) => ids.add(s.skillId)));
    return skills.filter((s) => ids.has(s.id));
  }, [assessments, skills]);

  const historyRows = useMemo(() => [...assessments].reverse(), [assessments]); // newest first

  const save = async (payload: AssessmentPayload) => {
    const ok = await saveAssessmentAPI(dispatch, payload);
    if (ok) {
      setFormOpen(false);
      setEditing(null);
      await refetch();
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const ok = await deleteAssessmentAPI(dispatch, deleteId);
    setDeleteId(null);
    setFormOpen(false);
    if (ok) await refetch();
  };

  if (loading) return <LoadingSpinner fullScreen={false} label="Loading performance..." />;

  const deltaUp = delta >= 0;
  const iconCls = "w-5 h-5 text-white";

  return (
    <div className="flex flex-col gap-6">
      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-heading-16 text-g-gray-1000">Performance</h3>
        <div className="flex items-center gap-3">
          <div className="w-44">
            <Button icon={Settings2} variant="outline" label="Manage skills" onClick={() => setSkillsOpen(true)} />
          </div>
          <div className="w-48">
            <Button
              icon={Plus}
              variant="filled"
              label="Add assessment"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            />
          </div>
        </div>
      </div>

      {assessments.length === 0 ? (
        <div className="bg-g-background-100 border border-g-gray-alpha-400 rounded-[var(--g-radius-md)] shadow-geist-card py-16 text-center">
          <p className="text-g-gray-1000 text-label-16 mb-1">No assessments yet</p>
          <p className="text-g-gray-700 text-label-14">
            Add the first one to start the progress chart.
          </p>
        </div>
      ) : (
        <>
          {/* Header strip */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Latest overall" value={`${latest}%`} isShowCradFooter={false} iconBgColor="bg-g-blue-700" icon={<Gauge className={iconCls} />} />
            <MetricCard
              title="Since baseline"
              value={`${deltaUp ? "+" : ""}${delta}%`}
              isShowCradFooter={false}
              iconBgColor={deltaUp ? "bg-[#3f8f5b]" : "bg-[#cf4b3a]"}
              icon={deltaUp ? <TrendingUp className={iconCls} /> : <TrendingDown className={iconCls} />}
            />
            <MetricCard title="Tenure" value={tenure(joinedDate)} isShowCradFooter={false} iconBgColor="bg-[#9c5cc4]" icon={<CalendarClock className={iconCls} />} />
            <MetricCard title="Assessments" value={assessments.length} isShowCradFooter={false} iconBgColor="bg-[#e08a2e]" icon={<ClipboardList className={iconCls} />} />
          </div>

          {/* Chart */}
          <div className="bg-g-background-100 border border-g-gray-alpha-400 rounded-[var(--g-radius-md)] shadow-geist-card p-4 sm:p-6">
            <h4 className="text-heading-14 text-g-gray-1000 mb-4">Progress over time</h4>
            <ProgressChart assessments={assessments} skills={skills} />
          </div>

          {/* History table */}
          <div className="bg-g-background-100 border border-g-gray-alpha-400 rounded-[var(--g-radius-md)] shadow-geist-card overflow-hidden">
            <h4 className="text-heading-14 text-g-gray-1000 px-5 pt-5 pb-3">Assessment history</h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-label-12 text-g-gray-700 border-y border-g-gray-alpha-400 bg-g-gray-alpha-100">
                    <th className="px-5 py-3 font-medium whitespace-nowrap">Date</th>
                    {measuredSkills.map((s) => (
                      <th key={s.id} className="px-4 py-3 font-medium whitespace-nowrap">{s.name}</th>
                    ))}
                    <th className="px-4 py-3 font-medium">Overall</th>
                    <th className="px-4 py-3 font-medium">Note</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map((a) => (
                    <tr key={a.id} className="border-b border-g-gray-alpha-400 last:border-0 hover:bg-g-gray-alpha-100 group">
                      <td className="px-5 py-3 text-label-14 text-g-gray-1000 whitespace-nowrap">{fmtDate(a.assessedOn)}</td>
                      {measuredSkills.map((s) => {
                        const sc = a.scores.find((x) => x.skillId === s.id);
                        return (
                          <td key={s.id} className="px-4 py-3 text-label-14 text-g-gray-800">
                            {sc ? sc.score : "—"}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-label-14 text-g-gray-1000 font-medium">{a.overall}%</td>
                      <td className="px-4 py-3 text-label-13 text-g-gray-700 max-w-[220px] truncate">{a.note || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditing(a);
                              setFormOpen(true);
                            }}
                            className="text-g-gray-700 hover:text-g-blue-700 cursor-pointer"
                          >
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => setDeleteId(a.id)} className="text-g-gray-700 hover:text-red-500 cursor-pointer">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Add / edit assessment */}
      <CustomModal
        isOpen={formOpen}
        variant="bottom-full"
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        title={editing ? "Edit assessment" : "Add assessment"}
      >
        <AssessmentModal
          employeeId={employeeId}
          skills={editing ? skills.filter((s) => s.active || editing.scores.some((x) => x.skillId === s.id)) : activeSkills}
          initial={editing}
          onSubmit={save}
          onCancel={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onDelete={editing ? () => setDeleteId(editing.id) : undefined}
        />
      </CustomModal>

      {/* Manage skills */}
      <CustomModal isOpen={skillsOpen} variant="bottom-full" onClose={() => setSkillsOpen(false)} title="Manage skills">
        <SkillsManagerModal skills={skills} onChanged={refetch} onCancel={() => setSkillsOpen(false)} />
      </CustomModal>

      <DeleteConfirmationModal
        isOpen={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        TextMessage="This assessment will be deleted, and you won't be able to get it back."
      />
    </div>
  );
};

export default PerformanceTab;
