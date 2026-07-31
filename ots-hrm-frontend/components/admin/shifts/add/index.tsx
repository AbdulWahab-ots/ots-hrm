import { Formik, Form, FormikHelpers } from "formik";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Department, ShiftPayload } from "@/utils/types";
import { ShiftValidationSchema } from "@/utils/validationSchema";
import InputField from "@/components/common/form/InputField";
import CustomDropdown from "@/components/common/form/DropDown";
import CustomTimePicker from "@/components/common/form/CustomTimePicker";
import Button from "@/components/common/Button";
import dayjs from "dayjs";
import CustomTimeField from "@/components/common/form/TimeDropdown";
import FormActionBar from "@/components/common/FormActionBar";

interface CreateShiftProps {
  initialValues?: Partial<ShiftPayload>;
  onSubmit: (
    values: ShiftPayload,
    formikHelpers: FormikHelpers<ShiftPayload>
  ) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

const CreateShift = ({
  initialValues,
  onSubmit,
  onCancel,
  className = "",
}: CreateShiftProps) => {
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

  const shiftTypeOptions = [
    { value: "", label: "Select Shift Type" },
    { value: "MORNING", label: "Morning" },
    { value: "EVENING", label: "Evening" },
    { value: "NIGHT", label: "Night" },
    { value: "FLEXIBLE", label: "Flexible" },
    { value: "ROTATIONAL", label: "Rotational" },
  ];

  const formatTimeToHHMMSS = (time: string): string => {
    if (!time) return "";

    // Handle HH:mm:ss format
    if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(time)) {
      return time;
    }

    // Handle HH:mm format
    if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      return `${time}:00`;
    }

    // Handle h:mm A format
    if (/^(1[0-2]|0?[1-9]):[0-5][0-9] (AM|PM)$/i.test(time)) {
      try {
        const date = dayjs(time, "h:mm A");
        return date.isValid() ? date.format("HH:mm:ss") : "";
      } catch (e) {
        console.error("Invalid time format:", time);
        return "";
      }
    }

    // Handle other date formats
    try {
      const date = new Date(time);
      if (!isNaN(date.getTime())) {
        return date.toTimeString().slice(0, 8);
      }
    } catch (e) {
      console.error("Invalid time format:", time);
    }
    return "";
  };

  const safeInitialValues: ShiftPayload = {
    name: initialValues?.name || "",
    shiftType: initialValues?.shiftType || "",
    startTime: formatTimeToHHMMSS(initialValues?.startTime || ""),
    endTime: formatTimeToHHMMSS(initialValues?.endTime || ""),
    breakDuration: initialValues?.breakDuration?.toString() || "",
    departmentId: initialValues?.departmentId || "",
  };

  return (
    <div className="flex flex-col justify-between w-[800px]">
      <Formik
        initialValues={safeInitialValues}
        validationSchema={ShiftValidationSchema}
        validateOnMount
        validateOnChange
        validateOnBlur
        onSubmit={async (values, formikHelpers) => {
          try {
            const submissionValues: ShiftPayload = {
              ...values,
              breakDuration: Number(values.breakDuration),
              startTime: formatTimeToHHMMSS(values.startTime),
              endTime: formatTimeToHHMMSS(values.endTime),
            };
            await onSubmit(submissionValues, formikHelpers);
          } catch (error: any) {
            console.error("Submission error:", error);
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
        }) => (
          <Form className="">
            <div className={`${className} lg:mb-0 mb-6`}>
              <div className="p-6 bg-g-background-100 rounded-[var(--g-radius-md)] border-(--genrel-light-stroke) border-[1px] shadow-geist-card">
                <div className="grid lg:grid-cols-2 gap-6">
                  <InputField
                    name="name"
                    label="Shift Name *"
                    type="text"
                    placeholder="Enter shift name"
                  />
                  <CustomDropdown
                    id="shiftType"
                    name="shiftType"
                    label="Shift Type *"
                    className="w-full"
                    options={shiftTypeOptions}
                    value={values.shiftType}
                    onChange={(e) => setFieldValue("shiftType", e.target.value)}
                    placeholder="Select Shift Type"
                  />
                  <CustomTimePicker
                    name="startTime"
                    label="Start Time *"
                    placeholder="00:00"
                  />
                  <CustomTimePicker
                    name="endTime"
                    label="End Time *"
                    placeholder="00:00"
                  />
                  <CustomTimeField
                    name="breakDuration"
                    label="Break duration"
                    className="w-full"
                    placeholder="00 : 00"
                  />
                  <div className="mt-0.5">
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
            </div>
            <FormActionBar onCancel={onCancel} cancelLabel="Back">
              <Button
                type="submit"
                variant="filled"
                fullWidth={false}
                rounded="full"
                className="px-8"
                label={initialValues?.name ? "Update Shift" : "Create Shift"}
                isLoading={isSubmitting}
                disabled={isSubmitting || !isValid}
              />
            </FormActionBar>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default CreateShift;
