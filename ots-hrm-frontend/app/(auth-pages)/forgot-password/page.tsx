import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
// import AuthLayoutContent from "@/components/auth/AuthLayoutContent";

export const generateMetadata = () => ({
  title: "Forgot Password | SmartHR",
  description:
    "Reset your SmartHR account password. Enter your email address to receive password reset instructions",
  keywords: [
    "forgot password",
    "password reset",
    "SmartHR login",
    "HR management",
    "account recovery",
  ],
});

export default function ForgotPasswordPage() {
  return (
    <ForgotPasswordForm />
  );
}
