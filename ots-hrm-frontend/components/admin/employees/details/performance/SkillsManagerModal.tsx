"use client";

import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Plus, Trash2 } from "lucide-react";
import { AppDispatch } from "@/store/store";
import Button from "@/components/common/Button";
import { Skill } from "@/utils/performanceTypes";
import { createSkillAPI, updateSkillAPI, deleteSkillAPI } from "@/services/performanceService";

interface SkillsManagerModalProps {
  skills: Skill[];
  onChanged: () => Promise<void> | void;
  onCancel: () => void;
}

const SkillsManagerModal = ({ skills, onChanged, onCancel }: SkillsManagerModalProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const [name, setName] = useState("");
  const [scaleMin, setScaleMin] = useState("0");
  const [scaleMax, setScaleMax] = useState("10");
  const [weight, setWeight] = useState("1");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!name.trim()) return;
    setBusy(true);
    const ok = await createSkillAPI(dispatch, {
      name: name.trim(),
      scaleMin: Number(scaleMin),
      scaleMax: Number(scaleMax),
      weight: Number(weight),
      sortOrder: skills.length + 1,
    });
    setBusy(false);
    if (ok) {
      setName("");
      await onChanged();
    }
  };

  const toggleActive = async (sk: Skill) => {
    await updateSkillAPI(dispatch, { active: !sk.active }, sk.id);
    await onChanged();
  };

  const remove = async (sk: Skill) => {
    await deleteSkillAPI(dispatch, sk.id);
    await onChanged();
  };

  const inputCls =
    "w-full h-10 px-3 rounded-[var(--g-radius-sm)] bg-g-background-100 border border-g-gray-alpha-400 text-g-gray-1000 text-label-14 focus-ring-geist outline-none";

  return (
    <div className="w-[800px] max-w-full">
      <div className="p-6 bg-g-background-100 rounded-[var(--g-radius-md)] border border-g-gray-alpha-400 shadow-geist-card">
        {/* Existing skills */}
        <h3 className="text-heading-14 text-g-gray-1000 mb-4">Skills</h3>
        <div className="flex flex-col divide-y divide-g-gray-alpha-400 mb-6">
          {skills.length === 0 && <p className="text-label-14 text-g-gray-700 py-3">No skills yet.</p>}
          {skills.map((sk) => (
            <div key={sk.id} className="flex items-center justify-between py-3 gap-3">
              <div className="min-w-0">
                <p className="text-label-14 text-g-gray-1000 truncate">
                  {sk.name}{" "}
                  {!sk.active && (
                    <span className="text-label-12 text-g-gray-600">(inactive)</span>
                  )}
                </p>
                <p className="text-label-12 text-g-gray-700">
                  scale {sk.scaleMin}–{sk.scaleMax} · weight {sk.weight}
                </p>
              </div>
              <div className="flex items-center gap-4 flex-none">
                <button
                  onClick={() => toggleActive(sk)}
                  className="text-label-13 text-g-blue-700 hover:underline cursor-pointer"
                >
                  {sk.active ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => remove(sk)}
                  className="text-g-gray-700 hover:text-red-500 cursor-pointer"
                  title="Delete (kept as inactive if already used)"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add new skill */}
        <div className="border-t border-g-gray-alpha-400 pt-5">
          <h3 className="text-heading-14 text-g-gray-1000 mb-3">Add skill</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div className="col-span-2 lg:col-span-1">
              <label className="text-label-13 text-g-gray-900 block mb-1">Name</label>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Listening" />
            </div>
            <div>
              <label className="text-label-13 text-g-gray-900 block mb-1">Min</label>
              <input className={inputCls} type="number" value={scaleMin} onChange={(e) => setScaleMin(e.target.value)} />
            </div>
            <div>
              <label className="text-label-13 text-g-gray-900 block mb-1">Max</label>
              <input className={inputCls} type="number" value={scaleMax} onChange={(e) => setScaleMax(e.target.value)} />
            </div>
            <div>
              <label className="text-label-13 text-g-gray-900 block mb-1">Weight</label>
              <input className={inputCls} type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
          </div>
          <div className="mt-4 w-40">
            <Button icon={Plus} variant="filled" label="Add skill" onClick={add} isLoading={busy} disabled={busy || !name.trim()} />
          </div>
        </div>
      </div>

      <div
        className="rounded-[var(--g-radius-md)] mt-4 py-6 px-4 shadow-geist-card"
        style={{ background: "linear-gradient(to right, #171717BD, #0023598C)" }}
      >
        <div className="flex justify-end">
          <button type="button" className="text-white cursor-pointer hover:underline focus-ring-geist" onClick={onCancel}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SkillsManagerModal;
