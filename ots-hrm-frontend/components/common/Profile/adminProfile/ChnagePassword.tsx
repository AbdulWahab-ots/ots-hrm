"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import Button from "@/components/common/Button";
import InputField from "@/components/common/form/InputField";
import { Formik, Form, FormikHelpers } from "formik";
import { PasswordSecuritySchema } from "@/utils/validationSchema";
import { PasswordSecurityFormValues } from "@/utils/types";
import { useDispatch } from "react-redux";
import { changePasswordAPI } from "@/services/superAdminServices";
import FormActionBar from "@/components/common/FormActionBar";

// Define the props interface
interface ChangePasswordProps {
  onSuccess: () => void;
}

export interface PasswordSecurityFormHandle {
  submitForm: () => void;
}

const ChangePassword = forwardRef<
  PasswordSecurityFormHandle,
  ChangePasswordProps
>(({ onSuccess }, ref) => {
  const formikRef = useRef<FormikHelpers<PasswordSecurityFormValues>>(null);
  const dispatch = useDispatch();

  // Define initial values for the form
  const initialValues: PasswordSecurityFormValues = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  };

  useImperativeHandle(ref, () => ({
    submitForm: () => formikRef.current?.submitForm(),
  }));

  const handleSubmit = async (
    values: PasswordSecurityFormValues,
    { setSubmitting }: FormikHelpers<PasswordSecurityFormValues>
  ) => {
    try {
      const { confirmPassword, ...payload } = values;
      const response = await changePasswordAPI(dispatch, payload);

      if (response) {
        onSuccess(); // Close modal on success
      }
    } catch (error) {
      console.error("Error changing password:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col justify-between">
      <Formik
        innerRef={formikRef as any}
        initialValues={initialValues}
        validationSchema={PasswordSecuritySchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, isValid }) => (
          <Form className="">
            <div className="min-h-[585px]">
              <div className="bg-g-background-100 sm:rounded-3xl rounded-2xl lg:rounded-[32px] border-[1px] border-g-blue-700/30">
                <div className="grid gap-8 p-6 sm:py-8 sm:px-10">
                  <InputField
                    name="currentPassword"
                    label="Current Password *"
                    type="password"
                    placeholder="Enter current password"
                  />
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
            <FormActionBar onCancel={onSuccess} cancelLabel="Back">
              <Button
                type="submit"
                variant="filled"
                fullWidth={false}
                rounded="full"
                className="px-8"
                label="Save"
                isLoading={isSubmitting}
                disabled={!isValid}
              />
            </FormActionBar>
          </Form>
        )}
      </Formik>
    </div>
  );
});

ChangePassword.displayName = "ChangePassword";

export default ChangePassword;
