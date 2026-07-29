// components/SignUpInviteForm.tsx
"use client";
import { signUpInviteInitialVals } from "@/utils/initialVals";
import { SignUpInviteFormValues, SignUpWithInvitePayload } from "@/utils/types";
import { signupInviteValidationSchema } from "@/utils/validationSchema";
import { Form, Formik } from "formik";
import { useState } from "react";
import InputField from "../common/form/InputField";
import Link from "next/link";
import Button from "../common/Button";
import Image from "next/image";
import { signUpWithInvite } from "@/services/authServices";
import { useDispatch } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function SignUpInviteForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("token");
  console.log(searchParams.toString(), "invite token", inviteToken);

  const handleSubmit = async (values: SignUpInviteFormValues) => {
    if (!inviteToken) {
      toast.error("Invalid or missing invite token");
      return;
    }

    const payload: SignUpWithInvitePayload = {
      inviteToken,
      userName: values.userName,
      firstName: values.firstName,
      lastName: values.lastName,
      password: values.password,
    };

    const success = await signUpWithInvite(dispatch, payload);
    if (success) {
      router.push("/sign-in");
    }
  };

  return (
    <>
      <Image
        src="/logo.png"
        alt="logo"
        width={271}
        height={65}
        className="pt-10 h-20 w-auto mr-auto"
      />
      <div className="flex flex-col items-center w-full max-w-[650px] mx-auto flex-1 justify-center">
        <div className="mb-6 text-center flex flex-col items-center w-full">
          <h1 className="text-xl md:text-2xl font-semibold text-g-gray-1000 mb-1">
            Create an account
          </h1>
          <p className="text-g-gray-900 text-sm md:text-base">
            Please enter your details to sign up
          </p>
        </div>

        <div className="w-full">
          <Formik
            initialValues={{
              ...signUpInviteInitialVals,
              inviteToken: inviteToken || "",
            }}
            validationSchema={signupInviteValidationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, setFieldValue }) => (
              <Form className="space-y-4 w-full">
                <div className="flex gap-4 items-center flex-wrap">
                  <InputField
                    name="firstName"
                    label="First Name"
                    className="flex-1"
                  />
                  <InputField
                    name="lastName"
                    label="Last Name"
                    className="flex-1"
                  />
                </div>
                <div className="flex gap-4 items-center flex-wrap">
                  <InputField
                    name="userName"
                    label="Username"
                    className="flex-1"
                  />
                </div>
                <div className="flex gap-4 items-center flex-wrap">
                  <InputField
                    name="password"
                    type={showPassword ? "text" : "password"}
                    label="Password"
                    className="flex-1"
                  />
                  <InputField
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    label="Confirm Password"
                    className="flex-1"
                  />
                </div>

                <Button type="submit" label="Sign Up" className="mt-4" />
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </>
  );
}
