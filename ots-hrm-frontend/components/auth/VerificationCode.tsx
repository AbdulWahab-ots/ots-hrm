"use client";
import Image from "next/image";
import { Form, Formik } from "formik";
import Button from "../common/Button";
import { useRef, useState } from "react";
import { OtpVerificationSchema } from "@/utils/validationSchema";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { handleVerifyCode, handleResendCode } from "@/services/authServices";
import { useRouter } from "next/navigation";

export default function VerificationCode() {
  const [otpValues, setOtpValues] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [isOtpIncorrect, setIsOtpIncorrect] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const [isResending, setIsResending] = useState(false); // Add resend loading state
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handleOtpChange = (index: number, value: string): void => {
    if (isOtpIncorrect) setIsOtpIncorrect(false);

    if (value.match(/^[0-9]$/) || value === "") {
      const newOtpValues = [...otpValues];
      newOtpValues[index] = value;
      setOtpValues(newOtpValues);

      if (value !== "" && index < 5) {
        inputRefs[index + 1].current?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text/plain").replace(/\D/g, ""); // Get only digits
    if (pasteData.length === 6) {
      const newOtpValues = pasteData.split("").slice(0, 6);
      setOtpValues(newOtpValues);

      // Focus the last input after paste
      inputRefs[5].current?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ): void => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleSubmit = async (values: any) => {
    setIsLoading(true); // Set loading to true when submitting
    try {
      const isPasswordReset = localStorage.getItem("resetEmail");
      const payload = {
        userId: user.id,
        code: otpValues.join(""),
        whichPurpose: isPasswordReset ? "forgotPassword" : "accountVerify",
      };
      const response = await handleVerifyCode(dispatch, payload);
      if (response && response.success) {
        if (isPasswordReset) {
          localStorage.setItem("verifiedCode", otpValues.join(""));
          router.push("/reset-password");
        } else {
          router.push("/sign-in");
        }
      } else {
        setIsOtpIncorrect(true);
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      setIsOtpIncorrect(true);
    } finally {
      setIsLoading(false); // Set loading to false when done
    }
  };

  const handleResend = async () => {
    setIsResending(true); // Set resend loading state
    try {
      const email = localStorage.getItem("resetEmail");
      if (!email) {
        setIsOtpIncorrect(true);
        return;
      }
      const isPasswordReset = localStorage.getItem("resetEmail");
      const whichPurpose = isPasswordReset ? "forgotPassword" : "accountVerify";
      await handleResendCode(dispatch, email, whichPurpose);
    } catch (error) {
      console.error("Error resending code:", error);
    } finally {
      setIsResending(false); // Reset resend loading state
    }
  };

  return (
    <>
      <div className="flex justify-start pr-10 pt-10">
        <Image src="/logo.png" alt="logo" width={271} height={65} className="h-20 w-auto mr-auto" />
      </div>

      <div className="flex-grow flex flex-col justify-center items-start w-full max-w-md mx-auto">
        <div className="space-y-14 w-full">
          <Button
            isArrowButton={true}
            onClick={() => router.push("/forgot-password")}
          />
          <div className="mb-8 text-left flex flex-col items-start w-full">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-g-gray-1000 mb-1">
              Check your email
            </h1>
            <p className="text-g-gray-900 text-sm md:text-base">
              Enter 6 digit code that mentioned in the email
            </p>
          </div>
          <Formik
            initialValues={{ otp: "" }}
            validationSchema={OtpVerificationSchema}
            onSubmit={handleSubmit}
          >
            {({ setFieldValue, submitForm, errors, touched }) => (
              <Form className="space-y-4 w-full">
                <div className="flex justify-center items-center gap-4">
                  {otpValues.map((digit, index) => (
                    <input
                      key={index}
                      ref={inputRefs[index]}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste} // Add paste handler
                      className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-8 lg:h-8 xl:w-12 xl:h-12 text-center text-base text-primary-dark-gray font-medium
                                    border rounded-[var(--g-radius-sm)] py-2 focus-ring-geist
                                    transition-colors duration-200
                                    ${
                                      isOtpIncorrect
                                        ? "border-g-red-700 text-g-red-700"
                                        : "border-secondary-light-gray focus:border-primary-navy-blue"
                                    }`}
                    />
                  ))}
                </div>
                {errors.otp && touched.otp && (
                  <div className="text-red-500 text-xs text-center">
                    {errors.otp}
                  </div>
                )}
                <Button
                  type="submit"
                  label="Verify Code"
                  className="mt-2"
                  isLoading={isLoading} // Pass loading state
                  disabled={isLoading} // Disable when loading
                  onClick={() => {
                    const joinedOtp = otpValues.join("");
                    setFieldValue("otp", joinedOtp);
                    submitForm();
                  }}
                />
              </Form>
            )}
          </Formik>
        </div>
      </div>

      <p className="text-center text-xs md:text-sm text-primary-light-gray">
        Haven't got the Password yet?{" "}
        <button
          className={`text-xs md:text-sm ${
            isResending ? "cursor-not-allowed" : "cursor-pointer"
          } text-primary-navy-blue font-semibold underline`}
          onClick={handleResend}
        >
          {isResending ? "Sending..." : "Resend code"}
        </button>
      </p>
    </>
  );
}
