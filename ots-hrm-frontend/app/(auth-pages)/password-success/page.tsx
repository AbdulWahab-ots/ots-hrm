// app/auth/signin/page.tsx
import AuthLayoutContent from "@/components/auth/AuthLayoutContent";
import PasswordSuccess from "@/components/auth/PasswordSuccess";
import AuthLayout from "@/components/layouts/AuthLayout";

export const generateMetadata = () => ({
  title: "Sign In | SmartHR",
  description:
    "Access your SmartHR account securely with email and password authentication.",
  keywords: [
    "SmartHR login",
    "employee portal",
    "HR system sign in",
    "workplace authentication",
    "secure HR access",
  ],
});

export default function SignInPage() {
  return <PasswordSuccess />;
}
