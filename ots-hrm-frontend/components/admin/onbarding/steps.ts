export type OnboardingStepKey =
  | "department"
  | "benefit"
  | "designation"
  | "leave-type"
  | "shift";

export const onboardingSteps: {
  key: OnboardingStepKey;
  label: string;
  statKey: "departments" | "benefits" | "designations" | "leaveTypes" | "shifts";
}[] = [
  { key: "department", label: "Department", statKey: "departments" },
  { key: "benefit", label: "Benefits", statKey: "benefits" },
  { key: "designation", label: "Designation", statKey: "designations" },
  { key: "leave-type", label: "Leave Type", statKey: "leaveTypes" },
  { key: "shift", label: "Shift", statKey: "shifts" },
];
