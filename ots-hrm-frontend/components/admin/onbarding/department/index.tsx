"use client";

import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { AppDispatch } from "@/store/store";
import { createDepartmentAPI } from "@/services/adminServices";
import { setIsLoading } from "@/store/features/global/globalSlice";
import CreateDepartment from "../../departments/createDepartment/createDepartmentForm";
import Wizard from "../wizard";
import OnBoardingSuccess from "../wizard/OnBoardingSuccess";

const OnBoardingDepartmentStep: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleCreateDepartment = async (values: {
    name: string;
    workingDays: { dayName: string; isWorkingDay: boolean }[];
  }) => {
    try {
      dispatch(setIsLoading(true));
      const payload = {
        name: values.name,
        code: values.name.toLowerCase().replace(/\s+/g, "-"),
        description: values.name + " department",
        workingDays: values.workingDays,
      };

      const success = await createDepartmentAPI(dispatch, payload);
      if (success) {
        setSuccessMessage(
          `Department ${values.name} has been created successfully!`
        );
        setShowSuccess(true);
      } else {
        throw new Error("API returned false");
      }
    } catch (error) {
      console.error("Failed to create department:", error);
      // Error handling can be enhanced with a toast notification if available
    } finally {
      dispatch(setIsLoading(false));
    }
  };

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
        router.push("/admin/onboarding/benefit"); // Navigate to next step
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess, router]);

  return (
    <>
      {showSuccess ? (
        <OnBoardingSuccess>
          Great! Department <br />
          has been Added
        </OnBoardingSuccess>
      ) : (
        <Wizard currentStepKey="department">
          <div className="mt-20">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="lg:text-heading-48 text-center sm:text-[30px] text-3xl font-semibold text-g-gray-1000">
                Create Department
              </h2>
            </div>
            <CreateDepartment
              className="min-h-[320px]"
              onSubmit={handleCreateDepartment}
            />
          </div>
        </Wizard>
      )}
    </>
  );
};

export default OnBoardingDepartmentStep;
