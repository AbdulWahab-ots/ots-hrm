"use client";
import { signUpInitialVals } from "@/utils/initialVals";
import { SignUpFormValues } from "@/utils/types";
import { signUpValidationSchema } from "@/utils/validationSchema";
import { Form, Formik } from "formik";
import { useState } from "react";
import InputField from "../common/form/InputField";
import { Eye, EyeOff, Mail, User } from "lucide-react";
import Link from "next/link";
import Button from "../common/Button";
import Image from "next/image";
import { handleSignUp } from "@/services/authServices";
import { useDispatch } from "react-redux";
import { redirect, useRouter } from "next/navigation";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  const handleSubmit = async (values: SignUpFormValues) => {
    const payload = { ...values };
    delete payload.confirmPassword;
    delete payload.agreeTerms;

    const response = await handleSignUp(dispatch, payload);
    if (response && response?.success) {
      router.push("/verify-code");
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
      <div className="flex flex-col items-start w-full max-w-[650px] mx-auto flex-1 justify-center">
        <div className="mb-6 text-left flex flex-col items-start w-full">
          <h1 className="text-xl md:text-2xl font-semibold text-g-gray-1000 mb-1">
            Create an account
          </h1>
          <p className="text-g-gray-900 text-sm md:text-base">
            Please enter your details to sign up
          </p>
        </div>

        <div className="w-full">
          <Formik
            initialValues={signUpInitialVals}
            validationSchema={signUpValidationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, setFieldValue }) => (
              <Form className="space-y-3 w-full">
                <div className="flex gap-4 items-center flex-wrap">
                  <InputField
                    name="firstName"
                    label="First Name"
                    leftIcon={User}
                    className="flex-1"
                  />

                  <InputField
                    name="lastName"
                    label="Last Name"
                    leftIcon={User}
                    className="flex-1"
                  />
                </div>
                <div className="flex gap-4 items-center flex-wrap">
                  <InputField
                    name="userName"
                    label="Username"
                    leftIcon={User}
                    className="flex-1"
                  />

                  <InputField
                    name="email"
                    type="email"
                    label="Email Address"
                    leftIcon={Mail}
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
                {/* <div className="flex items-start mb-6">
                                    <div className="flex items-center h-5">
                                        <input
                                            id="agreeTerms"
                                            name="agreeTerms"
                                            type="checkbox"
                                            checked={values.agreeTerms}
                                            onChange={(e) =>
                                                setFieldValue("agreeTerms", e.target.checked)
                                            }
                                            className="w-4 h-4 border border-gray-300 rounded bg-gray-50"
                                            // required
                                        />
                                    </div>
                                    <label
                                        htmlFor="agreeTerms"
                                        className="ms-2 text-xs sm:text-sm text-gray-500"
                                    >
                                        Agree to{" "}
                                        <Link
                                            href="#"
                                            className="text-[#e70d0d] hover:underline"
                                        >
                                            Terms
                                        </Link>{" "}
                                        <span className="text-[#e70d0d]">and</span>{" "}
                                        <Link
                                            href="#"
                                            className="text-[#e70d0d] hover:underline"
                                        >
                                            Privacy
                                        </Link>
                                    </label>
                                </div> */}

                <Button type="submit" label="Sign Up" className="mt-4" />
              </Form>
            )}
          </Formik>
        </div>
      </div>

      <p className="text-center text-gray-500">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-g-gray-1000 font-semibold">
          Sign in
        </Link>
      </p>
    </>
  );
}
