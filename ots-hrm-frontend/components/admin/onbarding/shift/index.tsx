// "use client";

// import React, { useState } from "react";

// import OnBoardingSuccess from "../wizard/OnBoardingSuccess";
// import Wizard from "../wizard";
// import CreateShift from "../../shifts/add";

// const OnBoardingShiftStep: React.FC = () => {
//   const [showSuccess, setShowSuccess] = useState(false);

//   return (
//     <>
//       {showSuccess ? (
//         <OnBoardingSuccess>
//           Great! A shift <br /> has been added
//         </OnBoardingSuccess>
//       ) : (
//         <Wizard>
//           <div className="mt-14">
//             <div className="flex items-center gap-4 mb-6">
//               <h2 className="lg:text-[48px] text-center sm:text-[30px] text-3xl font-semibold text-[#1C202F]">
//                 Create Leave Type
//               </h2>
//             </div>
//             <div className="w-full ">
//               <CreateShift />
//             </div>
//           </div>
//         </Wizard>
//       )}
//     </>
//   );
// };

// export default OnBoardingShiftStep;

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OnBoardingSuccess from "../wizard/OnBoardingSuccess";
import CreateShift from "../../shifts/add";
import Wizard from "../wizard";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import { createShiftAPI } from "@/services/adminServices";
import { ShiftPayload } from "@/utils/types";
import { FormikHelpers } from "formik";

const OnBoardingShiftStep: React.FC = () => {
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const handleCreateShift = async (
    values: ShiftPayload,
    formikHelpers: FormikHelpers<ShiftPayload>
  ) => {
    try {
      const payload = {
        name: values.name,
        code: values.name.toLowerCase().replace(/\s+/g, ""),
        shiftType: values.shiftType,
        startTime: values.startTime,
        endTime: values.endTime,
        breakDuration: Number(values.breakDuration),
        departmentId: values.departmentId,
      };

      const response = await createShiftAPI(dispatch, payload);
      if (response) {
        setShowSuccess(true);
        setTimeout(() => {
          router.push("/admin/dashboard");
        }, 3000); // Navigate after 3 seconds
      } else {
        throw new Error("Failed to create shift");
      }
    } catch (error: any) {
      console.error("Failed to create shift:", error);
      if (error?.errors && Array.isArray(error.errors)) {
        formikHelpers.setErrors(
          error.errors.reduce(
            (acc: any, err: { field: string; message: string }) => ({
              ...acc,
              [err.field]: err.message,
            }),
            {}
          )
        );
      } else {
        formikHelpers.setStatus(
          "An unexpected error occurred. Please try again."
        );
      }
    } finally {
      formikHelpers.setSubmitting(false);
    }
  };

  return (
    <>
      {showSuccess ? (
        <OnBoardingSuccess>
          Great! A shift <br /> has been added
        </OnBoardingSuccess>
      ) : (
        <Wizard currentStepKey="shift">
          <div className="mt-14">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="lg:text-[30px] text-center  text-3xl font-semibold text-g-gray-1000">
                Create Shift
              </h2>
            </div>
            <div className="w-full">
              <CreateShift
                className="lg:h-[520px]"
                onSubmit={handleCreateShift}
                onCancel={() => router.push("/admin/onboarding/leave-type")}
              />
            </div>
          </div>
        </Wizard>
      )}
    </>
  );
};

export default OnBoardingShiftStep;
