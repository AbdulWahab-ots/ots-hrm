// src/components/designations/CreateDesignation.tsx
"use client";

import Button from "@/components/common/Button";
import InputField from "@/components/common/form/InputField";
import CustomDropdown from "@/components/common/form/DropDown";
import { Formik, Form, FormikHelpers } from "formik";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { DesignationPayload, Department, DropdownOption } from "@/utils/types";
import { DesignationValidationSchema } from "@/utils/validationSchema";
import FormActionBar from "@/components/common/FormActionBar";

interface CreateDesignationProps {
  className?: string;
  initialValues?: Partial<DesignationPayload>;
  onSubmit: (
    values: DesignationPayload,
    formikHelpers: FormikHelpers<DesignationPayload>
  ) => Promise<void>;
  onCancel: () => void;
}

const CreateDesignation = ({
  initialValues,
  onSubmit,
  onCancel,
  className = "",
}: CreateDesignationProps) => {
  const departments = useSelector(
    (state: RootState) => state.department.departmentData
  );

  const departmentOptions: DropdownOption[] = [
    { value: "", label: "Select Department" },
    ...(departments?.map((dept: Department) => ({
      value: dept.id,
      label: dept.name,
    })) || []),
  ];

  const safeInitialValues: DesignationPayload = {
    title: initialValues?.title || "",
    departmentId: initialValues?.departmentId || "",
  };

  return (
    <div className="flex flex-col justify-between w-[800px]">
      <Formik
        initialValues={safeInitialValues}
        validationSchema={DesignationValidationSchema}
        validateOnMount
        validateOnChange
        validateOnBlur
        onSubmit={async (values, formikHelpers) => {
          try {
            const submissionValues: DesignationPayload = {
              ...values,
            };
            await onSubmit(submissionValues, formikHelpers);
          } catch (error: any) {
            if (error?.errors && Array.isArray(error.errors)) {
              error.errors.forEach(
                (err: { field: string; message: string }) => {
                  formikHelpers.setFieldError(err.field, err.message);
                }
              );
            } else {
              formikHelpers.setStatus(
                "An unexpected error occurred. Please try again."
              );
            }
          } finally {
            formikHelpers.setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting, isValid, setFieldValue, values, status }) => {
          const isFormComplete = isValid;

          return (
            <Form className="">
              <div className={className}>
                <div className="p-6 bg-g-background-100 rounded-[var(--g-radius-md)] border-(--genrel-light-stroke) border-[1px] shadow-geist-card">
                  <div className="grid lg:grid-cols-2 gap-6">
                    <InputField
                      name="title"
                      label="Designation Title *"
                      type="text"
                      placeholder="Enter designation title"
                    />
                    <CustomDropdown
                      id="departmentId"
                      name="departmentId"
                      label="Department *"
                      className="w-full"
                      options={departmentOptions}
                      value={values.departmentId}
                      onChange={(e) =>
                        setFieldValue("departmentId", e.target.value)
                      }
                      placeholder="Select Department"
                    />
                  </div>
                </div>
              </div>
              <FormActionBar onCancel={onCancel} cancelLabel="Back">
                <Button
                  type="submit"
                  variant="filled"
                  fullWidth={false}
                  rounded="full"
                  className="px-8"
                  label={
                    initialValues?.title
                      ? "Update Designation"
                      : "Create Designation"
                  }
                  isLoading={isSubmitting}
                  disabled={isSubmitting || !isFormComplete}
                />
              </FormActionBar>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default CreateDesignation;
