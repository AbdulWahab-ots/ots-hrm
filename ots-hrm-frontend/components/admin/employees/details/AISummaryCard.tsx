"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import Button from "@/components/common/Button";
import { Employee } from "@/utils/types";

interface AISummaryCardProps {
  employee: Employee;
}

const SWIRL_DURATION_MS = 2600;

function buildSummary(employee: Employee): string {
  const fullName = `${employee.user.firstName} ${employee.user.lastName}`.trim();
  const designation = employee.designation?.title || "their role";
  const department = employee.department?.name || "the company";
  const status = (employee.status || "").toLowerCase() || "active";
  const joinDate = employee.joiningDate
    ? new Date(employee.joiningDate).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })
    : null;

  const tenure = joinDate
    ? `, joining in ${joinDate}`
    : "";

  return `${fullName || "This employee"} works as ${designation} in ${department}${tenure}. Their current status is ${status}, with an on-file employee code of ${employee.employeeCode || "-"
    }. No performance flags or open requests stand out for this profile.`;
}

const AISummaryCard = ({ employee }: AISummaryCardProps) => {
  const [status, setStatus] = useState<"idle" | "animating" | "done">("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleGenerate = () => {
    setStatus("animating");
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    timeoutRef.current = setTimeout(
      () => setStatus("done"),
      prefersReducedMotion ? 0 : SWIRL_DURATION_MS
    );
  };

  return (
    <div className="bg-g-background-100 border-[1px] border-g-gray-alpha-400 rounded-[var(--g-radius-md)] shadow-geist-card p-4 sm:p-6 w-full sm:w-72 aspect-[3/4] relative overflow-hidden flex flex-col">
      <h3 className="text-heading-14 text-g-gray-1000 mb-3">AI Summary</h3>

      <div className="flex-1 flex flex-col">
        {status === "idle" && (
          <div className="flex-1 flex items-center justify-center">
            <Button
              icon={Sparkles}
              variant="outline"
              label="AI Summary"
              onClick={handleGenerate}
            />
          </div>
        )}

        {status === "done" && (
          <p className="animate-ai-summary-reveal text-label-14 text-g-gray-900">
            {buildSummary(employee)}
          </p>
        )}
      </div>

      {status === "animating" && (
        <div
          aria-hidden="true"
          className="animate-ai-summary-swirl absolute inset-0 rounded-[var(--g-radius-md)]"
          style={{
            backgroundImage:
              "linear-gradient(115deg, oklch(35% 0.18 260), oklch(32% 0.16 150), oklch(30% 0.19 25), oklch(34% 0.17 60), oklch(35% 0.18 260), oklch(32% 0.16 150))",
            backgroundSize: "400% 400%",
          }}
        />
      )}
    </div>
  );
};

export default AISummaryCard;
