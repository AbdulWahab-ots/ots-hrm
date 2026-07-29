"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OnBoardingSuccess from "../wizard/OnBoardingSuccess";
import CreateLeave from "../../leaves-type/createLeaveType/createLeaveForm";
import Wizard from "../wizard";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { createLeaveTypeAPI } from "@/services/adminServices";
import { LeaveTypePayload } from "@/utils/types";
import { FormikHelpers } from "formik";

const OnBoardingLeaveTypeStep: React.FC = () => {
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const handleCreateLeave = async (
    values: LeaveTypePayload,
    formikHelpers: FormikHelpers<LeaveTypePayload>
  ) => {
    try {
      const payload = {
        name: values.name,
        code: values.name.toLowerCase().replace(/\s+/g, ""),
        description: values.description || `${values.name} leave type`,
        maxDaysPerYear: Number(values.maxDaysPerYear),
        maxConsecutiveDays: Number(values.maxConsecutiveDays),
        isPaid: values.isPaid,
        requiresApproval: values.requiresApproval,
        departmentId: values.departmentId,
      };

      const response = await createLeaveTypeAPI(dispatch, payload);
      if (response) {
        setShowSuccess(true);
        setTimeout(() => {
          router.push("/admin/onboarding/shift");
        }, 3000); // Navigate after 3 seconds
      } else {
        throw new Error("Failed to create leave type");
      }
    } catch (error: any) {
      console.error("Failed to create leave type:", error);
      if (error?.errors && Array.isArray(error.errors)) {
        formikHelpers.setErrors(
          error.errors.reduce(
            (acc: any, err: { field: string; message: string }) => ({
              ...acc,
              [err.field]: err.message,
            }),
            {}
          )
        );
      } else {
        formikHelpers.setStatus(
          "An unexpected error occurred. Please try again."
        );
      }
    } finally {
      formikHelpers.setSubmitting(false);
    }
  };

  return (
    <>
      {showSuccess ? (
        <OnBoardingSuccess>
          Great! Leave type <br /> has been added
        </OnBoardingSuccess>
      ) : (
        <Wizard currentStepKey="leave-type">
          <div className="mt-14">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="lg:text-[30px] text-center text-3xl font-semibold text-g-gray-1000">
                Create Leave Type
              </h2>
            </div>
            <div className="w-full">
              <CreateLeave
                className="h-[520px]"
                onSubmit={handleCreateLeave}
                onCancel={() => router.push("/admin/onboarding/designation")}
              />
            </div>
          </div>
        </Wizard>
      )}
    </>
  );
};

export default OnBoardingLeaveTypeStep;
