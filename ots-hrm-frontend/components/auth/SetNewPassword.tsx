"use client";
import { forgotPasswordInitialVals } from "@/utils/initialVals";
import { ForgotPasswordValidationSchema } from "@/utils/validationSchema";
import { Form, Formik } from "formik";
import InputField from "../common/form/InputField";
import Button from "../common/Button";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function SetNewPassword() {
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (values: any) => {
    console.log("Form submitted:", values);
  };

  return (
    <>
      <div className="flex justify-start pr-10 pt-10">
        <Image src="/logo.png" alt="logo" width={271} height={65} className="h-20 w-auto mr-auto" />
      </div>
      <div className="flex flex-col items-center w-full max-w-md mx-auto flex-1 justify-center">
        <div className="space-y-14 w-full">
          <Button isArrowButton={true} />
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
            initialValues={forgotPasswordInitialVals}
            validationSchema={ForgotPasswordValidationSchema}
            onSubmit={handleSubmit}
          >
            <Form className="space-y-4 w-full">
              <InputField
                name="password"
                type={showPassword ? "text" : "password"}
                label="Password"
                // icon={
                //     <button
                //         type="button"
                //         onClick={() => setShowPassword(!showPassword)}
                //         className="focus:outline-none"
                //     >
                //         {showPassword ? (
                //             <EyeOff className="h-4 w-4 text-quaternary-dark-gray" />
                //         ) : (
                //             <Eye className="h-4 w-4 text-quaternary-dark-gray" />
                //         )}
                //     </button>
                // }
              />
              <InputField
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                label="Confirm Password"
                // icon={
                //     <button
                //         type="button"
                //         onClick={() => setShowPassword(!showPassword)}
                //         className="focus:outline-none"
                //     >
                //         {showPassword ? (
                //             <EyeOff className="h-4 w-4 text-quaternary-dark-gray" />
                //         ) : (
                //             <Eye className="h-4 w-4 text-quaternary-dark-gray" />
                //         )}
                //     </button>
                // }
              />

              <Button type="submit" label="Update Password" className="mt-2" />
            </Form>
          </Formik>
        </div>
      </div>
    </>
  );
}
