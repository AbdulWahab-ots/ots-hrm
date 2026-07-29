"use client";

import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { AppDispatch } from "@/store/store";
import {
  createBenefitAPI,
  fetchAllDepartments,
} from "@/services/adminServices";
import { setIsLoading } from "@/store/features/global/globalSlice";
import { BenefitPayload } from "@/utils/types";
import { FormikHelpers } from "formik";
import Wizard from "../wizard";
import CreateBenefit from "../../benefits/add";
import OnBoardingSuccess from "../wizard/OnBoardingSuccess";

const OnBoardingBenefitsStep: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch departments to populate dropdown
  useEffect(() => {
    dispatch(fetchAllDepartments);
  }, [dispatch]);

  const handleCreateBenefit = async (
    values: BenefitPayload,
    formikHelpers: FormikHelpers<BenefitPayload>
  ) => {
    try {
      dispatch(setIsLoading(true));
      const payload = {
        name: values.name,
        code: values.name.toLowerCase().replace(/\s+/g, ""),
        description: values.description || `${values.name} benefit`,
        type: values.type,
        value: values.value,
        valueType: values.valueType,
        frequency: values.frequency,

        departmentId: values.departmentId,
      };

      const response = await createBenefitAPI(dispatch, payload);
      if (response) {
        setSuccessMessage(
          `Benefit ${values.name} has been created successfully!`
        );
        setShowSuccess(true);
      } else {
        throw new Error("API returned false");
      }
    } catch (error: any) {
      console.error("Failed to create benefit:", error);
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
      dispatch(setIsLoading(false));
    }
  };

  const handleCancel = () => {
    // Navigate back or to a specific route on cancel
    router.push("/admin/onboarding/department"); // Adjust the route as needed
  };

  // Handle success component display and navigation after 3 seconds
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
        router.push("/admin/onboarding/designation");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess, router]);

  return (
    <>
      {showSuccess ? (
        <OnBoardingSuccess>
          Great! Benefit <br />
          has been Added
        </OnBoardingSuccess>
      ) : (
        <Wizard currentStepKey="benefit">
          <div className="mt-14">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="lg:text-heading-48 text-center sm:text-[30px] text-3xl font-semibold text-g-gray-1000">
                Create Benefits
              </h2>
            </div>
            <div className="w-full ">
              <CreateBenefit
                className="lg:h-[520px]"
                onSubmit={handleCreateBenefit}
                onCancel={handleCancel}
              />
            </div>
          </div>
        </Wizard>
      )}
    </>
  );
};

export default OnBoardingBenefitsStep;
