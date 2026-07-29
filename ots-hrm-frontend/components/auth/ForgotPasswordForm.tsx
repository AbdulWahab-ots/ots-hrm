"use client";
import { forgotPasswordInitialVals } from "@/utils/initialVals";
import { ForgotPasswordFormValues } from "@/utils/types";
import { ForgotPasswordValidationSchema } from "@/utils/validationSchema";
import { Form, Formik } from "formik";
import InputField from "../common/form/InputField";
import Button from "../common/Button";
import Image from "next/image";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { handleForgotPassword } from "@/services/authServices";
import { Mail } from "lucide-react";
import { useState } from "react";

export default function ForgotPasswordForm() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false); // Loading state

  const handleSubmit = async (values: ForgotPasswordFormValues) => {
    setIsLoading(true); // Start loading
    try {
      const response = await handleForgotPassword(dispatch, values.email);
      if (response && response?.success) {
        router.push("/verify-code");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
    } finally {
      setIsLoading(false); // End loading
    }
  };

  return (
    <>
      <div className="flex justify-start pr-10 pt-10">
        <Image src="/logo.png" alt="logo" width={271} height={65} className="h-20 w-auto mr-auto" />
      </div>
      <div className="flex flex-col items-center w-full max-w-md mx-auto flex-1 justify-center">
        <div className="space-y-14 w-full">
          <Button
            isArrowButton={true}
            onClick={() => router.push("/sign-in")}
            // disabled={isLoading} // Disable back button during submission
          />
          <div className="flex flex-col gap-4">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold">
              Forget Password
            </h1>
            <p className="text-g-gray-900 text-sm md:text-base">
              Please enter your email to reset the password
            </p>
          </div>
          <Formik
            initialValues={forgotPasswordInitialVals}
            validationSchema={ForgotPasswordValidationSchema}
            onSubmit={handleSubmit}
          >
            {({ isValid, dirty }) => (
              <Form className="space-y-5 w-full">
                <InputField
                  name="email"
                  type="email"
                  label="Email Address"
                  placeholder="olivia@untitledui.com"
                />

                <Button
                  type="submit"
                  label="Submit"
                  className="mt-2"
                  isLoading={isLoading}
                  disabled={!isValid || isLoading} // Disable when invalid, pristine, or loading
                />
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </>
  );
}
