"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import Button from "@/components/common/Button";
import InputField from "@/components/common/form/InputField";
import { Formik, Form } from "formik";
import { PasswordSecuritySchema } from "@/utils/validationSchema";
import { PasswordSecurityFormValues } from "@/utils/types";
import { useDispatch } from "react-redux";
import { changePasswordAPI } from "@/services/superAdminServices";

interface PasswordSecurityFormProps {
  onSuccess: () => void;
}

export interface PasswordSecurityFormHandle {
  submitForm: () => void;
}

const PasswordSecurityForm = forwardRef<
  PasswordSecurityFormHandle,
  PasswordSecurityFormProps
>(({ onSuccess }, ref) => {
  const formikRef = useRef<any>(null);
  const dispatch = useDispatch();

  const initialValues: PasswordSecurityFormValues = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  };

  useImperativeHandle(ref, () => ({
    submitForm: () => {
      if (formikRef.current) {
        formikRef.current.handleSubmit();
      }
    },
  }));

  const handleSubmit = async (values: PasswordSecurityFormValues) => {
    try {
      const { confirmPassword, ...payload } = values;
      const response = await changePasswordAPI(dispatch, payload);

      if (response) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error changing password:", error);
    }
  };

  return (
    <div className="flex flex-col justify-between">
      <Formik
        innerRef={formikRef}
        initialValues={initialValues}
        validationSchema={PasswordSecuritySchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, isValid }) => (
          <Form className="">
            <div className="min-h-[300px] 2xl:min-h-[500px]">
              <div className="px-4 bg-g-background-100 ssm:rounded-3xl rounded-2xl lg:rounded-[32px]  border-(--genrel-light-stroke) border-[1px]">
                <div className="grid gap-4 md:grid-cols-2 py-6">
                  <div className="md:col-span-2">
                    <InputField
                      name="currentPassword"
                      label="Current Password *"
                      type="password"
                      placeholder="Enter current password"
                    />
                  </div>
                  <InputField
                    name="newPassword"
                    label="New Password *"
                    type="password"
                    placeholder="Enter new password"
                  />
                  <InputField
                    name="confirmPassword"
                    label="Confirm Password *"
                    type="password"
                    placeholder="Confirm password"
                  />
                </div>
              </div>
            </div>
            <div className="sm:rounded-3xl rounded-2xl lg:rounded-[32px] mt-4 bg-g-background-100  py-6 px-4 shadow-geist-card">
              <div className="flex justify-end items-center max-w-4xl mx-auto">
                <div className="flex gap-4">
                  <button
                    type="button"
                    className="text-(--primary-navy-blue) text-button-14 cursor-pointer hover:underline focus-ring-geist rounded-[var(--g-radius-sm)]"
                    onClick={onSuccess}
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    variant="filled"
                    label="Save"
                    isLoading={isSubmitting}
                    disabled={!isValid}
                  />
                </div>
              </div>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
});

PasswordSecurityForm.displayName = "PasswordSecurityForm";

export default PasswordSecurityForm;
