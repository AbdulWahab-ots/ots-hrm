"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import HeaderWithTooltip from "@/components/common/Typography/HeaderWithTooltip";
import { MdOutlineBugReport, MdOutlineMapsHomeWork } from "react-icons/md";
import { IoArrowDown, IoSettingsOutline } from "react-icons/io5";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import Button from "@/components/common/Button";
import CustomModal from "@/components/common/CustomModal";
import CreateEmployee from "../employees/add"; // Adjust the import path to match your project structure
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import {
  createEmployeeAPI,
  fetchAllDepartments,
  fetchAllDesignations,
} from "@/services/adminServices";
import { EmployeePayload } from "@/utils/types";
import { FormikHelpers } from "formik";
import { setIsLoading } from "@/store/features/global/globalSlice";
import { useRouter } from "next/navigation";
import { PiBugBeetle } from "react-icons/pi";

const LeaveDashboard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAllAlerts, setShowAllAlerts] = useState(false); // Added dropdown state

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  // Handle opening the modal and fetching necessary data
  const handleCreate = () => {
    fetchAllDepartments(dispatch);
    fetchAllDesignations(dispatch);
    setIsModalOpen(true);
  };

  // Handle form submission for creating an employee
  const handleCreateEmployee = async (
    values: EmployeePayload,
    formikHelpers: FormikHelpers<EmployeePayload>,
    profileImage: File | null
  ) => {
    try {
      dispatch(setIsLoading(true));
      let payload: any = { ...values };
      delete payload.user?.pictureUrl; // Remove pictureUrl to avoid sending local URL to backend
      if (typeof payload.salary === "string") {
        payload.salary = Number(payload.salary) || 0;
      }

      const response = await createEmployeeAPI(dispatch, payload);
      if (response && response.result) {
        // Optionally handle profile image upload here if needed
        setIsModalOpen(false); // Close the modal on success
      } else {
        throw new Error("API returned false");
      }
    } catch (error: any) {
      console.error("Operation failed:", error);
      formikHelpers.setStatus(
        "An unexpected error occurred. Please try again."
      );
    } finally {
      dispatch(setIsLoading(false));
    }
  };
  // Handle navigation to /admin/leaves
  const handleLeavesManagement = () => {
    router.push("/admin/leaves");
  };

  //  All alerts (3 default + 2 more)
  const alerts = [
    {
      id: 1,
      bg: "var(--g-red-100)",
      icon: <PiBugBeetle size={35} className="text-g-gray-900 font-normal" />,
      text: "2 Employees exceeding leave limit",
      time: "Just now",
    },
    {
      id: 2,
      bg: "var(--g-blue-100)",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 35 35" fill="none">
          <path d="M0 12.8C0 8.31958 0 6.07937 0.871948 4.36808C1.63893 2.86278 2.86278 1.63893 4.36808 0.871948C6.07937 0 8.31958 0 12.8 0H21.8667C26.3471 0 28.5873 0 30.2986 0.871948C31.8039 1.63893 33.0277 2.86278 33.7947 4.36808C34.6667 6.07937 34.6667 8.31958 34.6667 12.8V21.8667C34.6667 26.3471 34.6667 28.5873 33.7947 30.2986C33.0277 31.8039 31.8039 33.0277 30.2986 33.7947C28.5873 34.6667 26.3471 34.6667 21.8667 34.6667H12.8C8.31958 34.6667 6.07937 34.6667 4.36808 33.7947C2.86278 33.0277 1.63893 31.8039 0.871948 30.2986C0 28.5873 0 26.3471 0 21.8667V12.8Z" fill="var(--g-blue-100)" />
          <path d="M6.22412 24.2876V15.8216C6.22412 15.5309 6.28733 15.2487 6.41377 14.975C6.54119 14.7023 6.71091 14.4681 6.92294 14.2725L11.8599 9.71783C12.0953 9.50068 12.3579 9.34231 12.6477 9.24271C12.9385 9.14222 13.2289 9.09197 13.5187 9.09197C13.8085 9.09197 14.0984 9.14222 14.3882 9.24271C14.6781 9.34321 14.9407 9.50158 15.176 9.71783L20.1145 14.2738C20.3255 14.4685 20.4948 14.7027 20.6222 14.9764C20.7496 15.2501 20.8128 15.5318 20.8118 15.8216V24.2876C20.8118 24.8905 20.5828 25.4038 20.1247 25.8273C19.6646 26.2508 19.1083 26.4626 18.4557 26.4626H8.58027C7.92764 26.4626 7.3718 26.2508 6.91272 25.8273C6.45268 25.4038 6.22266 24.8905 6.22266 24.2876M8.58027 25.1153H12.3953V23.0453C12.3953 22.7671 12.5023 22.5248 12.7163 22.3185C12.9303 22.1121 13.1977 22.0089 13.5187 22.0089C13.8202 22.0089 14.0823 22.1121 14.3051 22.3185C14.5278 22.5248 14.6396 22.7671 14.6406 23.0453V25.1153H18.4557C18.7183 25.1153 18.9337 25.0377 19.102 24.8825C19.2702 24.7272 19.3544 24.5289 19.3544 24.2876V15.7947C19.3544 15.6915 19.3354 15.5924 19.2975 15.4973C19.2605 15.4022 19.1953 15.3115 19.102 15.2254L14.1635 10.6694C13.9953 10.5142 13.7803 10.4366 13.5187 10.4366C13.2561 10.4366 13.0407 10.5142 12.8724 10.6694L7.93543 15.2254C7.84205 15.3115 7.7764 15.4022 7.73847 15.4973C7.70054 15.5924 7.68157 15.6915 7.68157 15.7947V24.2876C7.68157 24.5289 7.76619 24.7272 7.93543 24.8825C8.10271 25.0377 8.31766 25.1153 8.58027 25.1153ZM23.1694 25.8152V14.3505C23.1694 14.2473 23.1505 14.1482 23.1125 14.0531C23.0746 13.958 23.0094 13.8673 22.917 13.7812L18.0997 9.33693C17.8624 9.11799 17.804 8.87168 17.9246 8.59801C18.0472 8.32434 18.2777 8.1875 18.6162 8.1875C18.7173 8.1875 18.8136 8.20545 18.905 8.24134C18.9964 8.27723 19.0752 8.32479 19.1414 8.38401L23.9295 12.8027C24.1416 12.9974 24.3108 13.2316 24.4372 13.5053C24.5637 13.779 24.6274 14.0607 24.6284 14.3505V25.8138C24.6284 26.0059 24.5588 26.166 24.4197 26.2943C24.2806 26.4227 24.107 26.4868 23.8989 26.4868C23.6908 26.4868 23.5171 26.4227 23.3781 26.2943C23.239 26.166 23.1694 26.0059 23.1694 25.8138M26.9845 25.8138V12.8808C26.9845 12.7776 26.966 12.6789 26.9291 12.5847C26.8921 12.4904 26.8265 12.3994 26.7321 12.3114L23.5371 9.36385C23.2998 9.14491 23.2414 8.89411 23.362 8.61147C23.4826 8.32882 23.7131 8.18795 24.0535 8.18885C24.1547 8.18885 24.251 8.20679 24.3424 8.24268C24.4338 8.27768 24.5126 8.32523 24.5788 8.38535L27.7738 11.3329C27.9848 11.5286 28.1492 11.7632 28.2669 12.0369C28.3846 12.3105 28.4439 12.5918 28.4449 12.8808V25.8152C28.4449 26.0072 28.3749 26.1674 28.2348 26.2957C28.0957 26.424 27.9226 26.4882 27.7154 26.4882C27.5073 26.4882 27.3337 26.424 27.1946 26.2957C27.0555 26.1674 26.9855 26.0072 26.9845 25.8152M8.58027 25.1153H19.3544H7.68303H8.58027ZM13.5187 18.0761C13.2172 18.0761 12.9546 17.9729 12.7309 17.7665C12.5072 17.5601 12.3953 17.3179 12.3953 17.0397C12.3953 16.7615 12.5072 16.5193 12.7309 16.3129C12.9546 16.1065 13.2172 16.0033 13.5187 16.0033C13.8202 16.0033 14.0823 16.1065 14.3051 16.3129C14.5278 16.5193 14.6396 16.7615 14.6406 17.0397C14.6416 17.3179 14.5297 17.5601 14.3051 17.7665C14.0804 17.9729 13.8178 18.0761 13.5172 18.0761" fill="var(--g-gray-900)" />
        </svg>
      ),
      text: "Eid-Holidays are coming",
      time: "59 minutes ago",
    },
    {
      id: 3,
      bg: "var(--g-red-100)",
      icon: <PiBugBeetle size={35} className="text-g-gray-900 font-normal" />,
      text: "10 leaves need action",
      time: "59 minutes ago",
    },
    {
      id: 4,
      bg: "var(--g-blue-100)",
      icon: <PiBugBeetle size={35} className="text-g-gray-900 font-normal" />,
      text: "System maintenance scheduled tonight",
      time: "2 hours ago",
    },
    {
      id: 5,
      bg: "var(--g-red-100)",
      icon: <PiBugBeetle size={35} className="text-g-gray-900 font-normal" />,
      text: "Payroll update available",
      time: "3 hours ago",
    },
  ];

  const visibleAlerts = showAllAlerts ? alerts : alerts.slice(0, 3);

  return (
    <div className="xl:col-span-4 space-y-4 w-full">
      {/* Alerts Card */}
      <div className="bg-g-background-100 p-4 lg:p-6 border-[1px] border-g-gray-alpha-400 rounded-[var(--g-radius-md)] shadow-geist-card">
        <HeaderWithTooltip
          title="Alerts"
          tooltipContent="This shows the daily leaves of employees."
        />
        <div className="mt-4 space-y-4">
          {visibleAlerts.map((alert) => (
            <div key={alert.id} className="flex items-start gap-3">
              <div className="p-2 rounded-[var(--g-radius-sm)]" style={{ backgroundColor: alert.bg }}>
                {alert.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-g-gray-1000">{alert.text}</p>
                <p className="text-xs font-normal text-g-gray-800">{alert.time}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-2">
          <button onClick={() => setShowAllAlerts(!showAllAlerts)} className="focus-ring-geist rounded-[var(--g-radius-sm)]">
            <IoIosArrowUp className={`w-6 h-6 text-g-gray-800 cursor-pointer ${showAllAlerts ? '' : 'rotate-180'}`} />
          </button>
        </div>
      </div>

      <div className="bg-g-background-100 p-4 border-[1px] border-g-gray-alpha-400 rounded-[var(--g-radius-md)] shadow-geist-card">
        <h2 className="text-g-gray-900 text-heading-20">
          Quick Actions
        </h2>
        <div className="flex flex-col sm:flex-row items-center gap-3 py-4">
          <Button
            label="Add Employee"
            variant="outline"
            icon={Plus}
            onClick={handleCreate}
            className="lg:text-[14px]!"
          />
          <Button
            label="Leaves Management"
            variant="outline"
            icon={IoSettingsOutline}
            onClick={handleLeavesManagement}
            className="lg:text-[14px]"
          />
        </div>
      </div>

      <CustomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Employee"
        variant="bottom-full-no-rounded"
        className="h-full flex flex-col"
      >
        <CreateEmployee
          onSubmit={handleCreateEmployee}
          onCancel={() => setIsModalOpen(false)}
        />
      </CustomModal>
    </div>
  );
};

export default LeaveDashboard;
