"use client";

import Button from "@/components/common/Button";
import InputField from "@/components/common/form/InputField";
import TabSelector from "@/components/common/form/TabSelector";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import FormActionBar from "@/components/common/FormActionBar";

interface CreateDepartmentProps {
  initialValues?: {
    name: string;
    workingDays: { dayName: string; isWorkingDay: boolean }[];
  };
  onSubmit: (values: {
    name: string;
    workingDays: { dayName: string; isWorkingDay: boolean }[];
  }) => Promise<void>; // Changed to Promise to handle API success/failure
  onCancel?: () => void;
  className?: string;
}

const daysOfWeek = [
  { value: "MONDAY", label: "1", name: "Mon" },
  { value: "TUESDAY", label: "2", name: "Tue" },
  { value: "WEDNESDAY", label: "3", name: "Wed" },
  { value: "THURSDAY", label: "4", name: "Thu" },
  { value: "FRIDAY", label: "5", name: "Fri" },
  { value: "SATURDAY", label: "6", name: "Sat" },
  { value: "SUNDAY", label: "7", name: "Sun" },
];

const CreateDepartment = ({
  initialValues,
  onSubmit,
  onCancel,
  className = "",
}: CreateDepartmentProps) => {
  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Department name is required"),
    workingDays: Yup.array()
      .of(
        Yup.object().shape({
          dayName: Yup.string().required(),
          isWorkingDay: Yup.boolean().required(),
        })
      )
      .min(1, "At least one working day must be selected")
      .test(
        "at-least-one-working-day",
        "At least one day must be a working day",
        (value) => Array.isArray(value) && value.some((day) => day.isWorkingDay)
      ),
  });

  // Provide default values if initialValues is undefined
  const safeInitialValues = {
    name: initialValues?.name || "",
    workingDays:
      initialValues?.workingDays ||
      daysOfWeek.map((day) => ({
        dayName: day.value,
        isWorkingDay: false,
      })),
  };

  return (
    <div className="flex flex-col min-w-[230px] justify-between ">
      <Formik
        initialValues={safeInitialValues}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            await onSubmit(values);
          } catch (error) {
            // Error will be handled by parent component
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting, isValid, values, setFieldValue }) => (
          <Form className="flex flex-col justify-between h-[calc(100%-60px)]">
            <div className={`${className}`}>
              <div className="p-6 bg-g-background-100 rounded-[var(--g-radius-md)] border-(--genrel-light-stroke) border-[1px] min-w-[230px] shadow-geist-card">
                <div className="space-y-4">
                  <InputField
                    name="name"
                    label="Department Name *"
                    type="text"
                    placeholder="Enter department name"
                  />

                  <div className="mt-4">
                    <label className="text-g-gray-900 text-label-14">
                      Working Days *
                    </label>
                    <div className="grid grid-cols-3 sm:flex pt-3  gap-3">
                      {daysOfWeek.map((day) => (
                        <div
                          key={day.value}
                          className="flex flex-col  items-center"
                        >
                          <TabSelector
                            value={day.value}
                            label={day.label}
                            checked={
                              Array.isArray(values.workingDays) &&
                                values.workingDays.find(
                                  (d) => d.dayName === day.value
                                )?.isWorkingDay
                                ? true
                                : false
                            }
                            onChange={(checked) => {
                              const updatedWorkingDays = Array.isArray(
                                values.workingDays
                              )
                                ? values.workingDays.map((d) =>
                                  d.dayName === day.value
                                    ? { ...d, isWorkingDay: checked }
                                    : d
                                )
                                : daysOfWeek.map((d) => ({
                                  dayName: d.value,
                                  isWorkingDay:
                                    d.value === day.value ? checked : false,
                                }));
                              setFieldValue("workingDays", updatedWorkingDays);
                            }}
                            size="large"
                          />
                          <span className="mt-1 text-label-12 text-g-gray-800">
                            {day.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <FormActionBar onCancel={onCancel} cancelLabel="Back">
              <Button
                type="submit"
                variant="filled"
                label={
                  safeInitialValues.name
                    ? "Update Department"
                    : "Create Department"
                }
                isLoading={isSubmitting}
                disabled={!isValid}
              />
            </FormActionBar>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default CreateDepartment;
