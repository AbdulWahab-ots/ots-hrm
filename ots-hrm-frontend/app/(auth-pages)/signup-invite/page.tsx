import { Suspense } from "react";

import SignUpInviteForm from "@/components/auth/SignupInviteForm";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export const generateMetadata = () => ({
  title: "Invite SignUp| SmartHR",
  description:
    "Register for a new SmartHR account with secure authentication and terms agreement.",
  keywords: [
    "SmartHR sign up invite",
    "admin registration",
    "HR system account",
    "workplace onboarding",
    "secure HR portal",
  ],
});

export default function SignUpInivite() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SignUpInviteForm />
    </Suspense>
  );
}
