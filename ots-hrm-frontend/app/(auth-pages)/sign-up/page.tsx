// app/auth/signup/page.tsx

import SignUpForm from "@/components/auth/SignUpForm";

export const generateMetadata = () => ({
  title: "Create Account | SmartHR",
  description:
    "Register for a new SmartHR account with secure authentication and terms agreement.",
  keywords: [
    "SmartHR sign up",
    "employee registration",
    "HR system account",
    "workplace onboarding",
    "secure HR portal",
  ],
});

export default function SignUpPage() {
  return <SignUpForm />;
}
