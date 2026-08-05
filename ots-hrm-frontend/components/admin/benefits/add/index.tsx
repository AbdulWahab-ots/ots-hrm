// src/components/benefits/CreateBenefitForm.tsx
"use client";

import Button from "@/components/common/Button";
import InputField from "@/components/common/form/InputField";
import CustomDropdown from "@/components/common/form/DropDown";

import TextArea from "@/components/common/form/TextArea";
import { Formik, Form, FormikHelpers } from "formik";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { BenefitPayload, Department, DropdownOption } from "@/utils/types";
import { BenefitValidationSchema } from "@/utils/validationSchema";
import { format, addYears } from "date-fns";
import FormActionBar from "@/components/common/FormActionBar";

interface CreateBenefitProps {
  className?: string;
  initialValues?: Partial<BenefitPayload>;
  onSubmit: (
    values: BenefitPayload,
    formikHelpers: FormikHelpers<BenefitPayload>
  ) => Promise<void>;
  onCancel: () => void;
}

const benefitTypeOptions: DropdownOption[] = [
  { label: "HEALTH", value: "HEALTH" },
  { label: "RETIREMENT", value: "RETIREMENT" },
  { label: "BONUS", value: "BONUS" },
  { label: "INSURANCE", value: "INSURANCE" },
  { label: "VACATION", value: "VACATION" },
  { label: "EDUCATION", value: "EDUCATION" },
  { label: "WELLNESS", value: "WELLNESS" },
  { label: "TRANSPORTATION", value: "TRANSPORTATION" },
  { label: "OTHER", value: "OTHER" },
];

const benefitValueTypeOptions: DropdownOption[] = [
  { label: "FIXED", value: "FIXED" },
  { label: "PERCENTAGE", value: "PERCENTAGE" },
];

const benefitFrequencyOptions: DropdownOption[] = [
  { label: "MONTHLY", value: "MONTHLY" },
  { label: "YEARLY", value: "YEARLY" },
  { label: "QUARTERLY", value: "QUARTERLY" },
  { label: "ONE_TIME", value: "ONE_TIME" },
];

const CreateBenefit = ({
  initialValues,
  onSubmit,
  onCancel,
  className = "",
}: CreateBenefitProps) => {
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

  const safeInitialValues: BenefitPayload = {
    name: initialValues?.name || "",
    description: initialValues?.description || "",
    type: initialValues?.type || "",
    value: initialValues?.value || "", // Changed from null to ""
    valueType: initialValues?.valueType || "",
    frequency: initialValues?.frequency || "",
    // startDate: initialValues?.startDate || format(new Date(), "yyyy-MM-dd"),
    // endDate:
    //   initialValues?.endDate || format(addYears(new Date(), 1), "yyyy-MM-dd"),
    departmentId: initialValues?.departmentId || "",
  };

  return (
    <div className="flex flex-col justify-between w-[800px] ">
      <Formik
        initialValues={safeInitialValues}
        validationSchema={BenefitValidationSchema}
        validateOnMount
        validateOnChange
        validateOnBlur
        onSubmit={async (values, formikHelpers) => {
          try {
            const submissionValues: BenefitPayload = {
              ...values,
              value: Number(values.value),
              // startDate: new Date(values.startDate).toISOString(),
              // endDate: new Date(values.endDate).toISOString(),
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
                      name="name"
                      label="Benefit Name *"
                      type="text"
                      placeholder="Enter benefit name"
                    />
                    <CustomDropdown
                      id="type"
                      name="type"
                      label="Benefit Type *"
                      className="w-full"
                      options={benefitTypeOptions}
                      value={values.type}
                      onChange={(e) => setFieldValue("type", e.target.value)}
                      placeholder="Select Benefit Type"
                    />

                    <CustomDropdown
                      id="valueType"
                      name="valueType"
                      label="Value Type *"
                      className="w-full"
                      options={benefitValueTypeOptions}
                      value={values.valueType}
                      onChange={(e) =>
                        setFieldValue("valueType", e.target.value)
                      }
                      placeholder="Select Value Type"
                    />
                    <InputField
                      name="value"
                      label="Value *"
                      type="number"
                      placeholder="00:00"
                      isPriceField={true}
                    />
                    <CustomDropdown
                      id="frequency"
                      name="frequency"
                      label="Frequency *"
                      className="w-full"
                      options={benefitFrequencyOptions}
                      value={values.frequency}
                      onChange={(e) =>
                        setFieldValue("frequency", e.target.value)
                      }
                      placeholder="Select Frequency"
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
                        placeholder="Enter description"
                        rows={4}
                      />
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
                    initialValues?.name ? "Update Benefit" : "Create Benefit"
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

export default CreateBenefit;
