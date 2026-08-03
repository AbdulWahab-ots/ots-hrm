// "use client";

// import React, { useState, useEffect } from "react";
// import { Formik, Form, FormikHelpers } from "formik";
// import * as Yup from "yup";
// import CustomDropdown from "@/components/common/form/DropDown";
// import CustomTimePicker from "@/components/common/form/CustomTimePicker";
// import TextArea from "@/components/common/form/TextArea";
// import Button from "@/components/common/Button";
// import DateRangePickerModal from "@/components/common/form/DateRangePickerModal";
// import { EmployeeRecord } from "../EmployeeRecordTable";

// interface AttendanceRequestPayload {
//   requestType: string;
//   date: string;
//   checkInTime?: string;
//   checkOutTime?: string;
//   description: string;
// }

// interface CreateAttendanceRequestProps {
//   onSubmit: (
//     values: AttendanceRequestPayload,
//     formikHelpers: FormikHelpers<AttendanceRequestPayload>
//   ) => Promise<void>;
//   onCancel: () => void;
//   className?: string;
//   initialRequestType?: string;
//   initialDate?: string;
//   selectedRecord?: EmployeeRecord | null;
// }

// const CreateAttendanceRequest = ({
//   onSubmit,
//   onCancel,
//   className = "lg:h-[620px]",
//   initialRequestType,
//   initialDate,
//   selectedRecord,
// }: CreateAttendanceRequestProps) => {
//   const [isDateModalOpen, setIsDateModalOpen] = useState(false);
//   const [selectedDate, setSelectedDate] = useState<Date | null>(null);

//   useEffect(() => {
//     if (initialDate) {
//       setSelectedDate(new Date(initialDate));
//     }
//   }, [initialDate]);

//   const requestTypeOptions = [
//     { value: "", label: "Select Request Type" },
//     { value: "CHECK_IN", label: "Check In" },
//     { value: "CHECK_OUT", label: "Check Out" },
//   ];

//   const validationSchema = Yup.object({
//     requestType: Yup.string().required("Request type is required"),
//     date: Yup.string().required("Date is required"),
//     checkInTime: Yup.string().when("requestType", {
//       is: "CHECK_IN",
//       then: (schema) => schema.required("Check-in time is required"),
//       otherwise: (schema) => schema.optional(),
//     }),
//     checkOutTime: Yup.string().when("requestType", {
//       is: "CHECK_OUT",
//       then: (schema) => schema.required("Check-out time is required"),
//       otherwise: (schema) => schema.optional(),
//     }),
//     description: Yup.string().optional(),
//   });

//   const initialValues: AttendanceRequestPayload = {
//     requestType: initialRequestType || "",
//     date: initialDate || "",
//     checkInTime: "",
//     checkOutTime: "",
//     description: "",
//   };

//   const handleOpenDateModal = () => setIsDateModalOpen(true);
//   const handleCloseDateModal = () => setIsDateModalOpen(false);

//   const formatTimeToHHMMSS = (time: string): string => {
//     if (!time) return "";

//     if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(time)) {
//       return time;
//     }

//     if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
//       return `${time}:00`;
//     }

//     try {
//       const date = new Date(`1970-01-01T${time}`);
//       if (!isNaN(date.getTime())) {
//         return date.toTimeString().slice(0, 8);
//       }
//     } catch (e) {
//       console.error("Invalid time format:", time);
//     }
//     return "";
//   };

//   return (
//     <div className="flex flex-col justify-between w-[800px]">
//       <Formik
//         initialValues={initialValues}
//         validationSchema={validationSchema}
//         validateOnMount
//         validateOnChange
//         validateOnBlur
//         onSubmit={async (values, formikHelpers) => {
//           try {
//             const submissionValues: AttendanceRequestPayload = {
//               ...values,
//               checkInTime: values.checkInTime
//                 ? formatTimeToHHMMSS(values.checkInTime)
//                 : undefined,
//               checkOutTime: values.checkOutTime
//                 ? formatTimeToHHMMSS(values.checkOutTime)
//                 : undefined,
//             };
//             await onSubmit(submissionValues, formikHelpers);
//           } catch (error: any) {
//             console.error("Submission error:", error);
//             formikHelpers.setStatus(
//               "An unexpected error occurred. Please try again."
//             );
//           } finally {
//             formikHelpers.setSubmitting(false);
//           }
//         }}
//       >
//         {({ isSubmitting, isValid, setFieldValue, values, status }) => (
//           <Form className="">
//             <div className={`${className} h-full lg:mb-0 mb-6`}>
//               <div className="p-6 bg-white sm:rounded-3xl rounded-2xl lg:rounded-[32px] border-(--genrel-light-stroke) border-[1px]">
//                 <div className="grid lg:grid-cols-2 gap-6">
//                   <CustomDropdown
//                     id="requestType"
//                     name="requestType"
//                     label="Request Type *"
//                     className="w-full"
//                     options={requestTypeOptions}
//                     value={values.requestType}
//                     onChange={(e) =>
//                       setFieldValue("requestType", e.target.value)
//                     }
//                     placeholder="Select Request Type"
//                     disabled={!!initialRequestType} // Disable if initial type is provided
//                   />
//                   <div>
//                     <label className="text-[#3C4566] font-medium text-sm block mb-1">
//                       Date *
//                     </label>
//                     <div
//                       className={`
//                         block w-full px-[14px] py-[10px]
//                         border border-[#597BE84D] rounded-[12px]
//                         focus:outline-none transition-all duration-200 cursor-pointer
//                       `}
//                       onClick={handleOpenDateModal}
//                     >
//                       {selectedDate
//                         ? selectedDate.toISOString().split("T")[0]
//                         : "Select date"}
//                     </div>
//                   </div>
//                   {values.requestType === "CHECK_IN" && (
//                     <CustomTimePicker
//                       name="checkInTime"
//                       label="Check In Time *"
//                       placeholder="00:00"
//                     />
//                   )}
//                   {values.requestType === "CHECK_OUT" && (
//                     <CustomTimePicker
//                       name="checkOutTime"
//                       label="Check Out Time *"
//                       placeholder="00:00"
//                     />
//                   )}
//                   <div className="lg:col-span-2">
//                     <TextArea
//                       name="description"
//                       label="Description"
//                       placeholder="Enter additional details"
//                       rows={4}
//                     />
//                   </div>
//                 </div>
//               </div>
//             </div>
//             <DateRangePickerModal
//               isOpen={isDateModalOpen}
//               onClose={handleCloseDateModal}
//               onSave={(range) => {
//                 if (range.startDate) {
//                   setFieldValue(
//                     "date",
//                     range.startDate.toISOString().split("T")[0]
//                   );
//                   setSelectedDate(range.startDate);
//                 }
//                 handleCloseDateModal();
//               }}
//               initialRange={{ startDate: selectedDate, endDate: null }}
//               singleDateMode={true}
//               incrementDates={true}
//             />
//             <div
//               className="sm:rounded-3xl rounded-2xl lg:rounded-[32px] bg-white py-6 px-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
//               style={{
//                 background: "linear-gradient(to right, #1C202FBD, #15214F8C)",
//               }}
//             >
//               <div className="flex justify-between items-center mx-auto">
//                 <button
//                   type="button"
//                   className="text-white cursor-pointer hover:underline"
//                   onClick={onCancel}
//                 >
//                   Back
//                 </button>
//                 <div>
//                   <Button
//                     type="submit"
//                     variant="filled"
//                     label="Create Request"
//                     isLoading={isSubmitting}
//                     disabled={isSubmitting || !isValid}
//                   />
//                 </div>
//               </div>
//             </div>
//           </Form>
//         )}
//       </Formik>
//     </div>
//   );
// };

// export default CreateAttendanceRequest;

"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Formik, Form, FormikHelpers } from "formik";
import * as Yup from "yup";
import CustomDropdown from "@/components/common/form/DropDown";
import CustomTimePicker from "@/components/common/form/CustomTimePicker";
import TextArea from "@/components/common/form/TextArea";
import Button from "@/components/common/Button";
import DateRangePickerModal from "@/components/common/form/DateRangePickerModal";
import FormActionBar from "@/components/common/FormActionBar";
import { EmployeeRecord } from "../EmployeeRecordTable";

interface AttendanceRequestPayload {
  requestType: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  description: string;
}

interface CreateAttendanceRequestProps {
  onSubmit: (
    values: AttendanceRequestPayload,
    formikHelpers: FormikHelpers<AttendanceRequestPayload>
  ) => Promise<void>;
  onCancel: () => void;
  className?: string;
  initialRequestType?: string;
  initialDate?: string;
  selectedRecord?: EmployeeRecord | null;
}

const CreateAttendanceRequest = ({
  onSubmit,
  onCancel,
  className = "",
  initialRequestType,
  initialDate,
  selectedRecord,
}: CreateAttendanceRequestProps) => {
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (initialDate) {
      setSelectedDate(new Date(initialDate));
    } else {
      setSelectedDate(null); // Ensure empty for "Add Request"
    }
  }, [initialDate]);

  const requestTypeOptions = [
    { value: "", label: "Select Request Type" },
    { value: "CHECK_IN", label: "Check In" },
    { value: "CHECK_OUT", label: "Check Out" },
  ];

  const validationSchema = Yup.object({
    requestType: Yup.string().required("Request type is required"),
    date: Yup.string().required("Date is required"),
    checkInTime: Yup.string().when("requestType", {
      is: "CHECK_IN",
      then: (schema) => schema.required("Check-in time is required"),
      otherwise: (schema) => schema.optional(),
    }),
    checkOutTime: Yup.string().when("requestType", {
      is: "CHECK_OUT",
      then: (schema) => schema.required("Check-out time is required"),
      otherwise: (schema) => schema.optional(),
    }),
    description: Yup.string()
      .required("Description is required")
      .min(10, "Description must be at least 10 characters long"),
  });

  const initialValues: AttendanceRequestPayload = {
    requestType: initialRequestType || "", // Empty if no initial
    date: initialDate || "",
    checkInTime: "",
    checkOutTime: "",
    description: "",
  };

  const handleOpenDateModal = () => setIsDateModalOpen(true);
  const handleCloseDateModal = () => setIsDateModalOpen(false);

  const formatTimeToHHMMSS = (time: string): string => {
    if (!time) return "";

    if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(time)) {
      return time;
    }

    if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      return `${time}:00`;
    }

    try {
      const date = new Date(`1970-01-01T${time}`);
      if (!isNaN(date.getTime())) {
        return date.toTimeString().slice(0, 8);
      }
    } catch (e) {
      console.error("Invalid time format:", time);
    }
    return "";
  };

  return (
    <div className="flex flex-col justify-between w-[800px]">
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        validateOnMount
        validateOnChange
        validateOnBlur
        onSubmit={async (values, formikHelpers) => {
          try {
            const submissionValues: AttendanceRequestPayload = {
              ...values,
              checkInTime: values.checkInTime
                ? formatTimeToHHMMSS(values.checkInTime)
                : undefined,
              checkOutTime: values.checkOutTime
                ? formatTimeToHHMMSS(values.checkOutTime)
                : undefined,
            };
            await onSubmit(submissionValues, formikHelpers);
          } catch (error: any) {
            console.error("Submission error:", error);
            formikHelpers.setStatus(
              "An unexpected error occurred. Please try again."
            );
          }
        }}
      >
        {({ isSubmitting, isValid, setFieldValue, values, status }) => (
          <Form className="" noValidate>
            {" "}
            {/* Added noValidate to avoid HTML warnings */}
            <div className={`${className} lg:mb-0 mb-6`}>
              <div className="p-6 bg-g-background-100 rounded-[var(--g-radius-lg)] border-(--genrel-light-stroke) border-[1px] shadow-geist-card">
                <div className="grid lg:grid-cols-2 gap-6">
                  <CustomDropdown
                    id="requestType"
                    name="requestType"
                    label="Request Type *"
                    className="w-full"
                    options={requestTypeOptions}
                    value={values.requestType}
                    onChange={(e) =>
                      setFieldValue("requestType", e.target.value)
                    }
                    placeholder="Select Request Type"
                    disabled={!!initialRequestType} // Disable only if pre-filled from table
                  />
                  <div>
                    <label className="text-g-gray-900 text-label-14 block mb-1">
                      Date *
                    </label>
                    <div
                      className={`
                        block w-full px-[14px] py-[10px]
                        border border-g-gray-alpha-400 rounded-[var(--g-radius-md)]
                        focus:outline-none focus-ring-geist transition-all duration-200 cursor-pointer
                      `}
                      onClick={handleOpenDateModal}
                    >
                      {selectedDate
                        ? format(selectedDate, "yyyy-MM-dd")
                        : "Select date"}
                    </div>
                  </div>
                  {values.requestType === "CHECK_IN" && (
                    <CustomTimePicker
                      name="checkInTime"
                      label="Check In Time *"
                      placeholder="00:00"
                    />
                  )}
                  {values.requestType === "CHECK_OUT" && (
                    <CustomTimePicker
                      name="checkOutTime"
                      label="Check Out Time *"
                      placeholder="00:00"
                    />
                  )}
                  <div className="lg:col-span-2">
                    <TextArea
                      name="description"
                      label="Description"
                      placeholder="Enter additional details"
                      rows={4}
                    />
                  </div>
                </div>
                {/* Display status if error */}
                {status && (
                  <div className="text-red-500 text-sm mt-2">{status}</div>
                )}
              </div>
            </div>
            <DateRangePickerModal
              isOpen={isDateModalOpen}
              onClose={handleCloseDateModal}
              onSave={(range) => {
                if (range.startDate) {
                  setFieldValue("date", format(range.startDate, "yyyy-MM-dd"));
                  setSelectedDate(range.startDate);
                }
                handleCloseDateModal();
              }}
              initialRange={{ startDate: selectedDate, endDate: null }}
              singleDateMode={true}
            />
            <FormActionBar onCancel={onCancel} cancelLabel="Back">
              <Button
                type="submit"
                variant="filled"
                fullWidth={false}
                rounded="full"
                className="px-8"
                label="Create Request"
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

export default CreateAttendanceRequest;
