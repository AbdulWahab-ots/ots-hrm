import { Suspense } from "react";

import SetNewPassword from "@/components/auth/SetNewPassword";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export const generateMetadata = () => ({
  title: "Set Password | SmartHR",
  description: "Set your password to activate your OTS HRM account.",
  keywords: [
    "SmartHR set password",
    "employee onboarding",
    "HR system account activation",
  ]
});

export default function SetNewPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SetNewPassword />
    </Suspense>
  );
}
