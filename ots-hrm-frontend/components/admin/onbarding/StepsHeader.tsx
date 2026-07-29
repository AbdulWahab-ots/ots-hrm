"use client";

import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { getCompanyStats } from "@/services/adminServices";
import { onboardingSteps, OnboardingStepKey } from "./steps";

interface StepsHeaderProps {
  currentStepKey: OnboardingStepKey;
}

const StepsHeader: React.FC<StepsHeaderProps> = ({ currentStepKey }) => {
  const dispatch = useDispatch();
  const [completedStatKeys, setCompletedStatKeys] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    let cancelled = false;
    getCompanyStats(dispatch).then((response: any) => {
      if (cancelled || !response?.success) return;
      const stats = response.result;
      const completed = new Set<string>();
      onboardingSteps.forEach((step) => {
        if (stats?.[step.statKey] > 0) completed.add(step.statKey);
      });
      setCompletedStatKeys(completed);
    });
    return () => {
      cancelled = true;
    };
  }, [dispatch, currentStepKey]);

  const currentIndex = onboardingSteps.findIndex(
    (step) => step.key === currentStepKey
  );
  const progressPercentage =
    ((currentIndex + 1) / onboardingSteps.length) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto mb-10">
      <div className="flex items-center justify-between">
        {onboardingSteps.map((step, index) => {
          const isCompleted = completedStatKeys.has(step.statKey);
          const isCurrent = step.key === currentStepKey;

          return (
            <div
              key={step.key}
              className="flex flex-1 flex-col items-center gap-2"
            >
              <span
                className={`text-label-12 font-medium transition-colors duration-300 ${
                  isCurrent
                    ? "text-g-blue-700"
                    : isCompleted
                    ? "text-g-gray-900"
                    : "text-g-gray-700"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 w-full h-1 bg-g-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-g-blue-700 rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
};

export default StepsHeader;
