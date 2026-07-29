"use client";
import { signInInitialVals } from "@/utils/initialVals";
import { SignInFormValues } from "@/utils/types";
import { signInValidationSchema } from "@/utils/validationSchema";
import { Form, Formik } from "formik";
import InputField from "../common/form/InputField";
import { Mail } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import Button from "../common/Button";
import Image from "next/image";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { handleSignIn } from "@/services/authServices";
import CustomCheckbox from "../common/form/CustomCheckbox";
import { getCompanyStats } from "@/services/adminServices";

export default function SignInForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  const handleSubmit = async (values: SignInFormValues) => {
    setIsLoading(true);
    const payload = { ...values, rememberMe };

    try {
      const response = await handleSignIn(dispatch, payload);
      if (response && response?.success) {
        const role = response.result.role.code;

        if (role === "employee") {
          router.push("/employee/dashboard");
        } else if (role === "admin") {
          const statsResponse = await getCompanyStats(dispatch);
          if (statsResponse && statsResponse.success) {
            const { departments, shifts, leaveTypes, designations, benefits } =
              statsResponse.result;
            const isOnboardingComplete = [
              departments,
              shifts,
              leaveTypes,
              designations,
              benefits,
            ].every((value) => value > 0);
            const allStatsZero = [
              departments,
              shifts,
              leaveTypes,
              designations,
              benefits,
            ].every((value) => value === 0);

            if (!isOnboardingComplete) {
              if (allStatsZero) {
                router.push("/admin/onboarding");
              } else if (departments === 0) {
                router.push("/admin/onboarding/department");
              } else if (benefits === 0) {
                router.push("/admin/onboarding/benefit");
              } else if (designations === 0) {
                router.push("/admin/onboarding/designation");
              } else if (leaveTypes === 0) {
                router.push("/admin/onboarding/leave-type");
              } else if (shifts === 0) {
                router.push("/admin/onboarding/shift");
              }
            } else {
              router.push("/admin/dashboard");
            }
          } else {
            router.push("/admin/dashboard");
          }
        } else {
          router.push("/superadmin/dashboard");
        }
      }
    } catch (error) {
      console.error("Sign-in error:", error);
      // Handle error (e.g., show toast)
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Image
        src="/HRM.svg"
        alt="HRM"
        width={150}
        height={60}
        className="pt-2 md:pt-6 lg:pt-10 h-20 w-auto mr-auto"
      />
      <div className="flex-grow flex flex-col justify-center items-start mx-auto w-full max-w-md space-y-8">
        <div className="text-left flex flex-col gap-4 items-start w-full">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold">
            Sign In
          </h1>
          <p className="text-g-gray-900 text-sm md:text-base">
            Please enter your details to sign in
          </p>
        </div>
        <Formik
          initialValues={signInInitialVals}
          validationSchema={signInValidationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue, isValid, dirty, isSubmitting }) => (
            <Form className="space-y-4 w-full">
              <InputField
                name="userName"
                type="text"
                label="Username"
                leftIcon={Mail}
              />
              <InputField name="password" type="password" label="Password" />
              <div className="flex items-start justify-between mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <CustomCheckbox
                    checked={rememberMe}
                    onChange={(checked) => setRememberMe(checked)}
                    id="rememberMe"
                  />
                  <span className="text-xs md:text-sm text-primary-light-gray">
                    Remember me
                  </span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs md:text-sm text-primary-navy-blue hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Button
                type="submit"
                label="Sign In"
                disabled={!isValid || !dirty || isSubmitting} // Add isSubmitting
                isLoading={isLoading || isSubmitting}
              />
            </Form>
          )}
        </Formik>
        <p className="text-center w-full text-xs md:text-sm text-primary-light-gray">
          Don't have an account?{" "}
          <Link
            href="/sign-up"
            className="text-xs md:text-sm text-primary-navy-blue"
          >
            Create Account
          </Link>
        </p>
      </div>
    </>
  );
}
