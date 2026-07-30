"use client";
import { SetPasswordValidationSchema } from "@/utils/validationSchema";
import { Form, Formik, FormikHelpers } from "formik";
import InputField from "../common/form/InputField";
import Button from "../common/Button";
import Image from "next/image";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { setPasswordViaToken } from "@/services/authServices";

interface SetPasswordFormValues {
  newPassword: string;
  confirmPassword: string;
}

const initialValues: SetPasswordFormValues = {
  newPassword: "",
  confirmPassword: "",
};

export default function SetNewPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const handleSubmit = async (
    values: SetPasswordFormValues,
    helpers: FormikHelpers<SetPasswordFormValues>
  ) => {
    if (!token) {
      helpers.setStatus(
        "This link is missing its token. Please use the link from your welcome email."
      );
      return;
    }

    setIsLoading(true);
    try {
      const success = await setPasswordViaToken(dispatch, {
        token,
        newPassword: values.newPassword,
      });
      if (success) {
        router.push("/password-success");
      } else {
        helpers.setStatus(
          "This link is invalid or has expired. Please ask your admin to resend it."
        );
      }
    } finally {
      setIsLoading(false);
      helpers.setSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex justify-start pr-10 pt-10">
        <Image src="/logo.png" alt="logo" width={271} height={65} className="h-20 w-auto mr-auto" />
      </div>
      <div className="flex flex-col items-center w-full max-w-md mx-auto flex-1 justify-center">
        <div className="space-y-14 w-full">
          <Button isArrowButton={true} onClick={() => router.push("/sign-in")} />
          <div className="flex flex-col gap-4">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold ">
              Set a new password
            </h1>
            <p className="text-g-gray-900 text-sm md:text-base">
              Create a password to activate your account.
            </p>
          </div>
          <Formik
            initialValues={initialValues}
            validationSchema={SetPasswordValidationSchema}
            onSubmit={handleSubmit}
          >
            {({ isValid, dirty, status }) => (
              <Form className="space-y-4 w-full">
                {status && (
                  <p className="text-label-14 text-g-red-700">{status}</p>
                )}
                <InputField
                  name="newPassword"
                  type="password"
                  label="Password"
                />
                <InputField
                  name="confirmPassword"
                  type="password"
                  label="Confirm Password"
                />
                <Button
                  type="submit"
                  label={isLoading ? "Saving..." : "Update Password"}
                  className="mt-2"
                  isLoading={isLoading}
                  disabled={!isValid || !dirty || isLoading}
                />
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </>
  );
}
