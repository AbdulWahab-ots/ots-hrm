// "use client";

// import React, { useEffect, useMemo, useState } from "react";
// import { Formik, Form, FormikHelpers } from "formik";
// import * as Yup from "yup";
// import Button from "@/components/common/Button";
// import TextArea from "@/components/common/form/TextArea";
// import CustomDropdown from "@/components/common/form/DropDown";
// import ToggleButton from "@/components/common/form/ToggleButton";
// import DateRangePickerModal from "@/components/common/form/DateRangePickerModal";
// import { useDispatch, useSelector } from "react-redux";
// import { AppDispatch, RootState } from "@/store/store";
// import { fetchAllLeaveTypes } from "@/services/adminServices";
// import { LeaveType } from "@/utils/types";

// interface LeaveRequestPayload {
//   fromDate: string;
//   toDate: string;
//   reason: string;
//   typeId: string;
//   requestType: string;
//   isMultiple: boolean;
// }

// interface CreateLeaveRequestProps {
//   onSubmit: (
//     values: LeaveRequestPayload,
//     formikHelpers: FormikHelpers<LeaveRequestPayload>
//   ) => Promise<void>;
//   onCancel: () => void;
// }

// const LeaveRequestValidationSchema = Yup.object().shape({
//   fromDate: Yup.string().required("Start date is required"),
//   toDate: Yup.string().when("isMultiple", {
//     is: true,
//     then: (schema) => schema.required("End date is required"),
//     otherwise: (schema) => schema.notRequired(),
//   }),
//   reason: Yup.string().required("Reason is required"),
//   typeId: Yup.string().required("Leave type is required"),
//   requestType: Yup.string().required("Request type is required"),
//   isMultiple: Yup.boolean().required(),
// });

// const CreateLeaveRequest: React.FC<CreateLeaveRequestProps> = ({
//   onSubmit,
//   onCancel,
// }) => {
//   const dispatch = useDispatch<AppDispatch>();
//   const leaveTypes = useSelector(
//     (state: RootState) => state.leaveType.leaveTypeData
//   );
//   const [isFromDateModalOpen, setIsFromDateModalOpen] = useState(false);
//   const [isToDateModalOpen, setIsToDateModalOpen] = useState(false);
//   const [isSingleDateModalOpen, setIsSingleDateModalOpen] = useState(false);
//   const [isFromFocused, setIsFromFocused] = useState(false);
//   const [isToFocused, setIsToFocused] = useState(false);
//   const [isSingleFocused, setIsSingleFocused] = useState(false);

//   useEffect(() => {
//     if (!leaveTypes || leaveTypes.length === 0) {
//       dispatch(fetchAllLeaveTypes);
//     }
//   }, [dispatch, leaveTypes]);

//   const leaveTypeOptions = useMemo(() => {
//     return [
//       { value: "", label: "Select Leave Type" },
//       ...(leaveTypes?.map((leaveType: LeaveType) => ({
//         value: leaveType.id,
//         label: leaveType.name,
//       })) || []),
//     ];
//   }, [leaveTypes]);

//   const initialValues: LeaveRequestPayload = {
//     fromDate: "",
//     toDate: "",
//     reason: "",
//     typeId: "",
//     requestType: "LEAVE",
//     isMultiple: false,
//   };

//   return (
//     <div className="flex flex-col justify-between w-[800px]">
//       <Formik
//         initialValues={initialValues}
//         validationSchema={LeaveRequestValidationSchema}
//         validateOnMount
//         onSubmit={async (values, formikHelpers) => {
//           try {
//             const submissionValues: LeaveRequestPayload = {
//               ...values,
//               fromDate: values.fromDate
//                 ? new Date(values.fromDate).toISOString().split("T")[0]
//                 : "",
//               toDate:
//                 values.isMultiple && values.toDate
//                   ? new Date(values.toDate).toISOString().split("T")[0]
//                   : values.fromDate,
//             };
//             await onSubmit(submissionValues, formikHelpers);
//           } catch (error: any) {
//             formikHelpers.setStatus(
//               error?.response?.data?.message ||
//                 "An unexpected error occurred. Please try again."
//             );
//           } finally {
//             formikHelpers.setSubmitting(false);
//           }
//         }}
//       >
//         {({
//           isSubmitting,
//           isValid,
//           setFieldValue,
//           values,
//           status,
//           touched,
//           errors,
//         }) => (
//           <Form className="">
//             <div className="p-6 bg-white sm:rounded-3xl rounded-2xl lg:rounded-[32px] border-[1px] border-[#597BE84D]">
//               <div className="flex pb-4 items-center gap-4">
//                 <ToggleButton
//                   initialValue={values.isMultiple}
//                   onChange={(value) => {
//                     setFieldValue("isMultiple", value);
//                     if (!value) {
//                       setFieldValue("toDate", "");
//                     }
//                   }}
//                   disabled={false}
//                   trueBgColor="#597BE8"
//                   falseBgColor="#F5F5F5"
//                 />
//                 <label className="text-[#3C4566] font-medium text-sm">
//                   Is Multiple
//                 </label>
//               </div>
//               <div className="grid lg:grid-cols-2 gap-6">
//                 <div className="lg:col-span-2">
//                   <CustomDropdown
//                     id="typeId"
//                     name="typeId"
//                     label="Leave Type *"
//                     className="w-full"
//                     options={leaveTypeOptions}
//                     value={values.typeId}
//                     onChange={(e) => setFieldValue("typeId", e.target.value)}
//                     placeholder="Select Leave Type"
//                   />
//                 </div>
//                 {values.isMultiple ? (
//                   <>
//                     <div>
//                       <label className="text-[#3C4566] font-medium text-sm block mb-1">
//                         From Date *
//                       </label>
//                       <div
//                         className={`
//                           block w-full px-[14px] py-[10px]
//                           border border-[#597BE84D] rounded-[12px]
//                           focus:outline-none transition-all duration-200 cursor-pointer
//                           ${
//                             touched.fromDate && errors.fromDate
//                               ? "border-[#FDA29B] focus:shadow-[0_0_0_4px_rgba(239,68,68,0.1)]"
//                               : isFromFocused
//                               ? "shadow-[0_0_0_4px_rgba(89,123,232,0.1)]"
//                               : ""
//                           }
//                         `}
//                         onClick={() => setIsFromDateModalOpen(true)}
//                         onFocus={() => setIsFromFocused(true)}
//                         onBlur={() => setIsFromFocused(false)}
//                       >
//                         {values.fromDate
//                           ? new Date(values.fromDate)
//                               .toISOString()
//                               .split("T")[0]
//                           : "Select from date"}
//                       </div>
//                       {touched.fromDate && errors.fromDate && (
//                         <div className="flex items-center mt-1 text-red-500">
//                           <svg
//                             className="h-4 w-4 mr-1"
//                             fill="currentColor"
//                             viewBox="0 0 20 20"
//                           >
//                             <path
//                               fillRule="evenodd"
//                               d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
//                               clipRule="evenodd"
//                             />
//                           </svg>
//                           <span className="text-xs">{errors.fromDate}</span>
//                         </div>
//                       )}
//                     </div>
//                     <div>
//                       <label className="text-[#3C4566] font-medium text-sm block mb-1">
//                         To Date *
//                       </label>
//                       <div
//                         className={`
//                           block w-full px-[14px] py-[10px]
//                           border border-[#597BE84D] rounded-[12px]
//                           focus:outline-none transition-all duration-200 cursor-pointer
//                           ${
//                             touched.toDate && errors.toDate
//                               ? "border-[#FDA29B] focus:shadow-[0_0_0_4px_rgba(239,68,68,0.1)]"
//                               : isToFocused
//                               ? "shadow-[0_0_0_4px_rgba(89,123,232,0.1)]"
//                               : ""
//                           }
//                         `}
//                         onClick={() => setIsToDateModalOpen(true)}
//                         onFocus={() => setIsToFocused(true)}
//                         onBlur={() => setIsToFocused(false)}
//                       >
//                         {values.toDate
//                           ? new Date(values.toDate).toISOString().split("T")[0]
//                           : "Select to date"}
//                       </div>
//                       {touched.toDate && errors.toDate && (
//                         <div className="flex items-center mt-1 text-red-500">
//                           <svg
//                             className="h-4 w-4 mr-1"
//                             fill="currentColor"
//                             viewBox="0 0 20 20"
//                           >
//                             <path
//                               fillRule="evenodd"
//                               d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
//                               clipRule="evenodd"
//                             />
//                           </svg>
//                           <span className="text-xs">{errors.toDate}</span>
//                         </div>
//                       )}
//                     </div>
//                   </>
//                 ) : (
//                   <div>
//                     <label className="text-[#3C4566] font-medium text-sm block mb-1">
//                       Date *
//                     </label>
//                     <div
//                       className={`
//                         block w-full px-[14px] py-[10px]
//                         border border-[#597BE84D] rounded-[12px]
//                         focus:outline-none transition-all duration-200 cursor-pointer
//                         ${
//                           touched.fromDate && errors.fromDate
//                             ? "border-[#FDA29B] focus:shadow-[0_0_0_4px_rgba(239,68,68,0.1)]"
//                             : isSingleFocused
//                             ? "shadow-[0_0_0_4px_rgba(89,123,232,0.1)]"
//                             : ""
//                         }
//                       `}
//                       onClick={() => setIsSingleDateModalOpen(true)}
//                       onFocus={() => setIsSingleFocused(true)}
//                       onBlur={() => setIsSingleFocused(false)}
//                     >
//                       {values.fromDate
//                         ? new Date(values.fromDate).toISOString().split("T")[0]
//                         : "Select date"}
//                     </div>
//                     {touched.fromDate && errors.fromDate && (
//                       <div className="flex items-center mt-1 text-red-500">
//                         <svg
//                           className="h-4 w-4 mr-1"
//                           fill="currentColor"
//                           viewBox="0 0 20 20"
//                         >
//                           <path
//                             fillRule="evenodd"
//                             d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
//                             clipRule="evenodd"
//                           />
//                         </svg>
//                         <span className="text-xs">{errors.fromDate}</span>
//                       </div>
//                     )}
//                   </div>
//                 )}

//                 <div className="lg:col-span-2">
//                   <TextArea
//                     name="reason"
//                     label="Reason *"
//                     placeholder="Enter reason for leave"
//                     rows={4}
//                   />
//                 </div>
//               </div>
//             </div>
//             <DateRangePickerModal
//               isOpen={isFromDateModalOpen}
//               onClose={() => setIsFromDateModalOpen(false)}
//               onSave={(range) => {
//                 if (range.startDate) {
//                   setFieldValue("fromDate", range.startDate.toISOString());
//                 }
//                 setIsFromDateModalOpen(false);
//               }}
//               initialRange={{
//                 startDate: values.fromDate ? new Date(values.fromDate) : null,
//                 endDate: null,
//               }}
//               singleDateMode={true}
//             />
//             <DateRangePickerModal
//               isOpen={isToDateModalOpen}
//               onClose={() => setIsToDateModalOpen(false)}
//               onSave={(range) => {
//                 if (range.startDate) {
//                   setFieldValue("toDate", range.startDate.toISOString());
//                 }
//                 setIsToDateModalOpen(false);
//               }}
//               initialRange={{
//                 startDate: values.toDate ? new Date(values.toDate) : null,
//                 endDate: null,
//               }}
//               singleDateMode={true}
//             />
//             <DateRangePickerModal
//               isOpen={isSingleDateModalOpen}
//               onClose={() => setIsSingleDateModalOpen(false)}
//               onSave={(range) => {
//                 if (range.startDate) {
//                   setFieldValue("fromDate", range.startDate.toISOString());
//                   setFieldValue("toDate", range.startDate.toISOString());
//                 }
//                 setIsSingleDateModalOpen(false);
//               }}
//               initialRange={{
//                 startDate: values.fromDate ? new Date(values.fromDate) : null,
//                 endDate: null,
//               }}
//               singleDateMode={true}
//             />
//             <div
//               className="sm:rounded-3xl rounded-2xl lg:rounded-[32px] mt-4 bg-white py-6 px-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
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
//                     label="Apply for Leave"
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

// export default CreateLeaveRequest;

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Formik, Form, FormikHelpers } from "formik";
import * as Yup from "yup";
import Button from "@/components/common/Button";
import TextArea from "@/components/common/form/TextArea";
import CustomDropdown from "@/components/common/form/DropDown";
import ToggleButton from "@/components/common/form/ToggleButton";
import DateRangePickerModal from "@/components/common/form/DateRangePickerModal";
import FormActionBar from "@/components/common/FormActionBar";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { fetchAllLeaveTypes } from "@/services/adminServices";
import { LeaveType } from "@/utils/types";

interface LeaveRequestPayload {
  fromDate: string;
  toDate: string;
  reason: string;
  typeId: string;
  requestType: string;
  isMultiple: boolean;
}

interface CreateLeaveRequestProps {
  onSubmit: (
    values: LeaveRequestPayload,
    formikHelpers: FormikHelpers<LeaveRequestPayload>
  ) => Promise<void>;
  onCancel: () => void;
}

const LeaveRequestValidationSchema = Yup.object().shape({
  fromDate: Yup.string().required("Start date is required"),
  toDate: Yup.string().when("isMultiple", {
    is: true,
    then: (schema) => schema.required("End date is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  reason: Yup.string().required("Reason is required"),
  typeId: Yup.string().required("Leave type is required"),
  requestType: Yup.string().required("Request type is required"),
  isMultiple: Yup.boolean().required(),
});

const CreateLeaveRequest: React.FC<CreateLeaveRequestProps> = ({
  onSubmit,
  onCancel,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const leaveTypes = useSelector(
    (state: RootState) => state.leaveType.leaveTypeData
  );
  const [isFromDateModalOpen, setIsFromDateModalOpen] = useState(false);
  const [isToDateModalOpen, setIsToDateModalOpen] = useState(false);
  const [isSingleDateModalOpen, setIsSingleDateModalOpen] = useState(false);
  const [isFromFocused, setIsFromFocused] = useState(false);
  const [isToFocused, setIsToFocused] = useState(false);
  const [isSingleFocused, setIsSingleFocused] = useState(false);

  useEffect(() => {
    if (!leaveTypes || leaveTypes.length === 0) {
      dispatch(fetchAllLeaveTypes);
    }
  }, [dispatch, leaveTypes]);

  const leaveTypeOptions = useMemo(() => {
    return [
      { value: "", label: "Select Leave Type" },
      ...(leaveTypes?.map((leaveType: LeaveType) => ({
        value: leaveType.id,
        label: leaveType.name,
      })) || []),
    ];
  }, [leaveTypes]);

  const initialValues: LeaveRequestPayload = {
    fromDate: "",
    toDate: "",
    reason: "",
    typeId: "",
    requestType: "LEAVE",
    isMultiple: false,
  };

  return (
    <div className="flex flex-col justify-between w-[800px]">
      <Formik
        initialValues={initialValues}
        validationSchema={LeaveRequestValidationSchema}
        validateOnMount
        onSubmit={async (values, formikHelpers) => {
          try {
            const submissionValues: LeaveRequestPayload = {
              ...values,
              fromDate: values.fromDate
                ? new Date(values.fromDate).toISOString().split("T")[0]
                : "",
              toDate: values.isMultiple
                ? values.toDate
                  ? new Date(values.toDate).toISOString().split("T")[0]
                  : ""
                : values.fromDate
                  ? new Date(values.fromDate).toISOString().split("T")[0]
                  : "",
            };
            await onSubmit(submissionValues, formikHelpers);
          } catch (error: any) {
            formikHelpers.setStatus(
              error?.response?.data?.message ||
              "An unexpected error occurred. Please try again."
            );
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
          errors,
        }) => (
          <Form className="">
            <div className="p-6 bg-g-background-100 rounded-[var(--g-radius-md)] border-[1px] border-g-gray-alpha-400 shadow-geist-modal">
              <div className="flex pb-4 items-center gap-4">
                <ToggleButton
                  initialValue={values.isMultiple}
                  onChange={(value) => {
                    setFieldValue("isMultiple", value);
                    if (!value) {
                      setFieldValue("toDate", values.fromDate);
                    }
                  }}
                  disabled={false}
                  trueBgColor="#597BE8"
                  falseBgColor="#F5F5F5"
                />
                <label className="text-g-gray-900 font-medium text-sm">
                  Is Multiple
                </label>
              </div>
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2">
                  <CustomDropdown
                    id="typeId"
                    name="typeId"
                    label="Leave Type *"
                    className="w-full"
                    options={leaveTypeOptions}
                    value={values.typeId}
                    onChange={(e) => setFieldValue("typeId", e.target.value)}
                    placeholder="Select Leave Type"
                  />
                </div>
                {values.isMultiple ? (
                  <>
                    <div>
                      <label className="text-g-gray-900 font-medium text-sm block mb-1">
                        From Date *
                      </label>
                      <div
                        className={`
                          block w-full px-[14px] py-[10px]
                          border border-g-gray-alpha-400 rounded-[var(--g-radius-sm)]
                          focus:outline-none transition-all duration-200 cursor-pointer
                          ${touched.fromDate && errors.fromDate
                            ? "border-g-red-700"
                            : isFromFocused
                              ? "focus-ring-geist"
                              : ""
                          }
                        `}
                        onClick={() => setIsFromDateModalOpen(true)}
                        onFocus={() => setIsFromFocused(true)}
                        onBlur={() => setIsFromFocused(false)}
                      >
                        {values.fromDate
                          ? new Date(values.fromDate)
                            .toISOString()
                            .split("T")[0]
                          : "Select from date"}
                      </div>
                      {touched.fromDate && errors.fromDate && (
                        <div className="flex items-center mt-1 text-red-500">
                          <svg
                            className="h-4 w-4 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-xs">{errors.fromDate}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-[#3C4566] font-medium text-sm block mb-1">
                        To Date *
                      </label>
                      <div
                        className={`
                          block w-full px-[14px] py-[10px]
                          border border-[#597BE84D] rounded-[12px]
                          focus:outline-none transition-all duration-200 cursor-pointer
                          ${touched.toDate && errors.toDate
                            ? "border-[#FDA29B] focus:shadow-[0_0_0_4px_rgba(239,68,68,0.1)]"
                            : isToFocused
                              ? "shadow-[0_0_0_4px_rgba(89,123,232,0.1)]"
                              : ""
                          }
                        `}
                        onClick={() => setIsToDateModalOpen(true)}
                        onFocus={() => setIsToFocused(true)}
                        onBlur={() => setIsToFocused(false)}
                      >
                        {values.toDate
                          ? new Date(values.toDate).toISOString().split("T")[0]
                          : "Select to date"}
                      </div>
                      {touched.toDate && errors.toDate && (
                        <div className="flex items-center mt-1 text-red-500">
                          <svg
                            className="h-4 w-4 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-xs">{errors.toDate}</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="text-[#3C4566] font-medium text-sm block mb-1">
                      Date *
                    </label>
                    <div
                      className={`
                        block w-full px-[14px] py-[10px]
                        border border-[#597BE84D] rounded-[12px]
                        focus:outline-none transition-all duration-200 cursor-pointer
                        ${touched.fromDate && errors.fromDate
                          ? "border-[#FDA29B] focus:shadow-[0_0_0_4px_rgba(239,68,68,0.1)]"
                          : isSingleFocused
                            ? "shadow-[0_0_0_4px_rgba(89,123,232,0.1)]"
                            : ""
                        }
                      `}
                      onClick={() => setIsSingleDateModalOpen(true)}
                      onFocus={() => setIsSingleFocused(true)}
                      onBlur={() => setIsSingleFocused(false)}
                    >
                      {values.fromDate
                        ? new Date(values.fromDate).toISOString().split("T")[0]
                        : "Select date"}
                    </div>
                    {touched.fromDate && errors.fromDate && (
                      <div className="flex items-center mt-1 text-red-500">
                        <svg
                          className="h-4 w-4 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-xs">{errors.fromDate}</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="lg:col-span-2">
                  <TextArea
                    name="reason"
                    label="Reason *"
                    placeholder="Enter reason for leave"
                    rows={4}
                  />
                </div>
              </div>
            </div>
            <DateRangePickerModal
              isOpen={isFromDateModalOpen}
              onClose={() => setIsFromDateModalOpen(false)}
              onSave={(range) => {
                if (range.startDate) {
                  setFieldValue("fromDate", range.startDate.toISOString());
                  if (!values.isMultiple) {
                    setFieldValue("toDate", range.startDate.toISOString());
                  }
                }
                setIsFromDateModalOpen(false);
              }}
              initialRange={{
                startDate: values.fromDate ? new Date(values.fromDate) : null,
                endDate: null,
              }}
              singleDateMode={true}
              incrementDates={true}
            />
            <DateRangePickerModal
              isOpen={isToDateModalOpen}
              onClose={() => setIsToDateModalOpen(false)}
              onSave={(range) => {
                if (range.startDate) {
                  setFieldValue("toDate", range.startDate.toISOString());
                }
                setIsToDateModalOpen(false);
              }}
              initialRange={{
                startDate: values.toDate ? new Date(values.toDate) : null,
                endDate: null,
              }}
              singleDateMode={true}
              incrementDates={true}
            />
            <DateRangePickerModal
              isOpen={isSingleDateModalOpen}
              onClose={() => setIsSingleDateModalOpen(false)}
              onSave={(range) => {
                if (range.startDate) {
                  setFieldValue("fromDate", range.startDate.toISOString());
                  setFieldValue("toDate", range.startDate.toISOString());
                }
                setIsSingleDateModalOpen(false);
              }}
              initialRange={{
                startDate: values.fromDate ? new Date(values.fromDate) : null,
                endDate: null,
              }}
              singleDateMode={true}
              incrementDates={true}
            />
            <FormActionBar onCancel={onCancel} cancelLabel="Back">
              <Button
                type="submit"
                variant="filled"
                label="Apply for Leave"
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

export default CreateLeaveRequest;
