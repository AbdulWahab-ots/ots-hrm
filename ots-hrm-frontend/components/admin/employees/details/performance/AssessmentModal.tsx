"use client";

import React from "react";
import { Formik, Form } from "formik";
import { Trash2 } from "lucide-react";
import Button from "@/components/common/Button";
import InputField from "@/components/common/form/InputField";
import TextArea from "@/components/common/form/TextArea";
import { Assessment, AssessmentPayload, Skill } from "@/utils/performanceTypes";

interface AssessmentModalProps {
  employeeId: string;
  skills: Skill[]; // active skills → dynamic inputs
  initial?: Assessment | null;
  onSubmit: (payload: AssessmentPayload) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => void;
}

const scoreField = (skillId: string) => `score_${skillId}`;

const AssessmentModal = ({ employeeId, skills, initial, onSubmit, onCancel, onDelete }: AssessmentModalProps) => {
  const isEdit = !!initial?.id;

  const initialValues: Record<string, string> = {
    assessedOn: initial?.assessedOn ? String(initial.assessedOn).slice(0, 10) : "",
    assessor: initial?.assessor || "",
    note: initial?.note || "",
  };
  skills.forEach((sk) => {
    const existing = initial?.scores.find((s) => s.skillId === sk.id);
    initialValues[scoreField(sk.id)] = existing ? String(existing.score) : "";
  });

  return (
    <div className="flex flex-col justify-between w-[800px] max-w-full">
      <Formik
        initialValues={initialValues}
        onSubmit={async (values, helpers) => {
          const scores = skills
            .map((sk) => ({ skillId: sk.id, raw: values[scoreField(sk.id)] }))
            .filter((x) => x.raw !== "" && x.raw != null)
            .map((x) => ({ skillId: x.skillId, score: Number(x.raw) }));

          if (!values.assessedOn) {
            helpers.setFieldError("assessedOn", "Assessment date is required");
            helpers.setSubmitting(false);
            return;
          }
          if (!scores.length) {
            helpers.setStatus("Enter at least one skill score.");
            helpers.setSubmitting(false);
            return;
          }
          // client-side scale check for a clear inline message
          for (const sk of skills) {
            const v = values[scoreField(sk.id)];
            if (v !== "" && (Number(v) < sk.scaleMin || Number(v) > sk.scaleMax)) {
              helpers.setFieldError(scoreField(sk.id), `Must be ${sk.scaleMin}–${sk.scaleMax}`);
              helpers.setSubmitting(false);
              return;
            }
          }

          await onSubmit({
            employeeId,
            assessedOn: values.assessedOn,
            assessor: values.assessor || undefined,
            note: values.note || undefined,
            scores,
          });
          helpers.setSubmitting(false);
        }}
      >
        {({ isSubmitting, status }) => (
          <Form>
            <div className="p-6 bg-g-background-100 rounded-[var(--g-radius-md)] border border-g-gray-alpha-400 shadow-geist-card">
              <div className="grid lg:grid-cols-2 gap-5">
                <InputField name="assessedOn" label="Assessment date *" type="date" />
                <InputField name="assessor" label="Assessor" type="text" placeholder="Trainer / lead" />
              </div>

              <div className="border-t border-g-gray-alpha-400 my-6" />
              <h3 className="text-heading-14 text-g-gray-1000 mb-4">Skill scores</h3>

              {skills.length === 0 ? (
                <p className="text-label-14 text-g-gray-700">
                  No active skills. Add skills first from “Manage skills”.
                </p>
              ) : (
                <div className="grid lg:grid-cols-2 gap-5">
                  {skills.map((sk) => (
                    <InputField
                      key={sk.id}
                      name={scoreField(sk.id)}
                      label={`${sk.name} (${sk.scaleMin}–${sk.scaleMax})`}
                      type="number"
                      placeholder={`${sk.scaleMin}–${sk.scaleMax}`}
                    />
                  ))}
                </div>
              )}

              <div className="mt-5">
                <TextArea name="note" label="Note" placeholder="Optional note about this assessment" />
              </div>

              {status && <p className="mt-3 text-label-13 text-red-500">{status}</p>}
            </div>

            <div
              className="rounded-[var(--g-radius-md)] mt-4 py-6 px-4 shadow-geist-card"
              style={{ background: "linear-gradient(to right, #171717BD, #0023598C)" }}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <button type="button" className="text-white cursor-pointer hover:underline focus-ring-geist" onClick={onCancel}>
                    Cancel
                  </button>
                  {isEdit && onDelete && (
                    <button type="button" onClick={onDelete} className="flex items-center gap-1 text-red-300 hover:text-red-200 cursor-pointer">
                      <Trash2 size={16} /> Delete
                    </button>
                  )}
                </div>
                <div className="w-[220px]">
                  <Button
                    type="submit"
                    variant="filled"
                    label={isEdit ? "Save assessment" : "Add assessment"}
                    isLoading={isSubmitting}
                    disabled={isSubmitting || skills.length === 0}
                  />
                </div>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default AssessmentModal;
