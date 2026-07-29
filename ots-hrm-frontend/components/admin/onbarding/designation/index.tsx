// src/components/onboarding/OnBoardingDesignationStep.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { AppDispatch } from "@/store/store";
import {
  fetchAllDepartments,
  createDesignationAPI,
} from "@/services/adminServices";
import { setIsLoading } from "@/store/features/global/globalSlice";
import { DesignationPayload } from "@/utils/types";
import { FormikHelpers } from "formik";
import Wizard from "../wizard";
import CreateDesignation from "../../designations/add";
import OnBoardingSuccess from "../wizard/OnBoardingSuccess";

const OnBoardingDesignationStep: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch departments to populate dropdown
  useEffect(() => {
    dispatch(fetchAllDepartments);
  }, [dispatch]);

  const handleCreateDesignation = async (
    values: DesignationPayload,
    formikHelpers: FormikHelpers<DesignationPayload>
  ) => {
    try {
      dispatch(setIsLoading(true));
      const payload = {
        title: values.title,
        departmentId: values.departmentId,
      };

      const response = await createDesignationAPI(dispatch, payload);
      if (response) {
        setSuccessMessage(
          `Designation ${values.title} has been created successfully!`
        );
        setShowSuccess(true);
      } else {
        throw new Error("API returned false");
      }
    } catch (error: any) {
      console.error("Failed to create designation:", error);
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
    router.push("/admin/onboarding/benefit"); // Adjust the route as needed
  };

  // Handle success component display and navigation after 3 seconds
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
        router.push("/admin/onboarding/leave-type"); // Adjust the route as needed
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess, router]);

  return (
    <>
      {showSuccess ? (
        <OnBoardingSuccess>
          Great! Designation <br />
          has been Added
        </OnBoardingSuccess>
      ) : (
        <Wizard currentStepKey="designation">
          <div className="mt-14">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="lg:text-heading-48 text-center sm:text-[30px] text-3xl font-semibold text-g-gray-1000">
                Create Designation
              </h2>
            </div>
            <div className="w-full">
              <CreateDesignation
                className="lg:h-[220px]"
                onSubmit={handleCreateDesignation}
                onCancel={handleCancel}
              />
            </div>
          </div>
        </Wizard>
      )}
    </>
  );
};

export default OnBoardingDesignationStep;
