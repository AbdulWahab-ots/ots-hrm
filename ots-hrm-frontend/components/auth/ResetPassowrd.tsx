"use client";

import { ResetPasswordValidationSchema } from "@/utils/validationSchema";
import { Form, Formik } from "formik";
import InputField from "../common/form/InputField";
import Button from "../common/Button";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { ResetFormProps } from "@/utils/types";
import { handleResetPassword } from "@/services/authServices";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "@/store/store";
import { ResetFormValues } from "@/utils/initialVals";
import Image from "next/image";

export default function ResetPassowrd() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const { user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const dispatch = useDispatch();
  console.log("User in Reset Password:", user);

  const handleSubmit = async (values: ResetFormProps) => {
    setIsLoading(true); // Set loading to true when submitting
    try {
      const code = localStorage.getItem("verifiedCode");
      const payload = {
        userId: user.id,
        code: code,
        newPassword: values.newPassword,
      };
      console.log("Reset Password Payload:", payload);
      const response = await handleResetPassword(dispatch, payload);
      if (response && response?.success) {
        router.push("/password-success");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
    } finally {
      setIsLoading(false); // Set loading to false when done
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
          />
          <div className="flex flex-col gap-4">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold ">
              Set a new password
            </h1>
            <p className="text-g-gray-900 text-sm md:text-base">
              Create a new password. Ensure it differs from previous ones for
              security
            </p>
          </div>
          <Formik
            initialValues={ResetFormValues}
            validationSchema={ResetPasswordValidationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, setFieldValue, isValid, dirty }) => (
              <Form className="space-y-4 w-full">
                <InputField
                  name="newPassword"
                  type={showPassword ? "text" : "password"}
                  label="Password"
                />
                <InputField
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  label="Confirm Password"
                />
                <Button
                  type="submit"
                  label="Update Password"
                  className="mt-2"
                  isLoading={isLoading} // Pass loading state to Button
                  disabled={!isValid || !dirty} // Disable button when loading
                />
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </>
  );
}
