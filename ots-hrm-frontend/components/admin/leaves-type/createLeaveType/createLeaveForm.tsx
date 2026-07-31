"use client";

import Button from "@/components/common/Button";
import InputField from "@/components/common/form/InputField";
import CustomDropdown from "@/components/common/form/DropDown";
import ToggleButton from "@/components/common/form/ToggleButton";
import { Formik, Form, FormikHelpers } from "formik";
import TextArea from "@/components/common/form/TextArea";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Department, LeaveTypePayload } from "@/utils/types";

import { LeaveTypevalidationSchema } from "@/utils/validationSchema";
import FormActionBar from "@/components/common/FormActionBar";

interface CreateLeaveProps {
  initialValues?: Partial<LeaveTypePayload>;
  onSubmit: (
    values: LeaveTypePayload,
    formikHelpers: FormikHelpers<LeaveTypePayload>
  ) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

const CreateLeave = ({
  initialValues,
  onSubmit,
  onCancel,
  className = "",
}: CreateLeaveProps) => {
  const departments = useSelector(
    (state: RootState) => state.department.departmentData
  );

  const departmentOptions = [
    { value: "", label: "Select Department" },
    ...(departments?.map((dept: Department) => ({
      value: dept.id,
      label: dept.name,
    })) || []),
  ];

  const safeInitialValues: LeaveTypePayload = {
    name: initialValues?.name || "",
    maxDaysPerYear: initialValues?.maxDaysPerYear || "",
    maxConsecutiveDays: initialValues?.maxConsecutiveDays || "",
    isPaid: initialValues?.isPaid ?? false,
    requiresApproval: initialValues?.requiresApproval ?? false,
    description: initialValues?.description || "",
    departmentId: initialValues?.departmentId || "",
  };

  return (
    <div className="flex flex-col justify-between w-[800px]">
      <Formik
        initialValues={safeInitialValues}
        validationSchema={LeaveTypevalidationSchema}
        validateOnMount
        validateOnChange
        validateOnBlur
        onSubmit={async (values, formikHelpers) => {
          try {
            const submissionValues: LeaveTypePayload = {
              ...values,
              maxDaysPerYear: Number(values.maxDaysPerYear),
              maxConsecutiveDays: Number(values.maxConsecutiveDays),
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
        {({
          isSubmitting,
          isValid,
          setFieldValue,
          values,
          status,
          touched,
        }) => {
          // Check if all required fields are valid
          const isFormComplete = isValid;

          return (
            <Form className="">
              <div className={`${className}`}>
                <div className="p-6 bg-g-background-100 sm:rounded-3xl rounded-2xl lg:rounded-[32px] border-(--genrel-light-stroke) border-[1px]">
                  <div className="grid lg:grid-cols-2 gap-6">
                    <InputField
                      name="name"
                      label="Leave Type Name *"
                      type="text"
                      placeholder="Enter leave type name"
                    />
                    <InputField
                      name="maxDaysPerYear"
                      label="Max Days Per Year *"
                      type="number"
                      placeholder="Enter max days per year"
                    />
                    <InputField
                      name="maxConsecutiveDays"
                      label="Max Consecutive Days *"
                      type="number"
                      placeholder="Enter max consecutive days"
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
                    <div className="lg:col-span-2">
                      <TextArea
                        name="description"
                        label="Description"
                        placeholder="Enter your description"
                        rows={4}
                      />
                    </div>
                    <div className="flex justify-between">
                      <div className="flex items-center gap-4">
                        <ToggleButton
                          initialValue={values.isPaid}
                          onChange={(value) => setFieldValue("isPaid", value)}
                          disabled={false}
                          trueBgColor="#597BE8"
                          falseBgColor="#F5F5F5"
                        />
                        <label className="text-[#3C4566] font-medium text-sm">
                          Is Paid
                        </label>
                      </div>
                      <div className="flex items-center gap-4">
                        <ToggleButton
                          initialValue={values.requiresApproval}
                          onChange={(value) =>
                            setFieldValue("requiresApproval", value)
                          }
                          disabled={false}
                          trueBgColor="#597BE8"
                          falseBgColor="#F5F5F5"
                        />
                        <label className="text-[#3C4566] font-medium text-sm">
                          Requires Approval
                        </label>
                      </div>
                    </div>
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
                    initialValues?.name
                      ? "Update Leave Type"
                      : "Create Leave Type"
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

export default CreateLeave;
