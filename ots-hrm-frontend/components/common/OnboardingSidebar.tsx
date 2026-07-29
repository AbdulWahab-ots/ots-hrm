"use client";
import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  setIsSidebarCollapsed,
  setIsSidebarOpen,
} from "@/store/features/global/globalSlice";
import {
  CheckCircle,
  Circle,
  PanelLeftDashed,
  CircleDashed,
} from "lucide-react";
import { MdOutlineCheck, MdOutlineLogout } from "react-icons/md";
import Image from "next/image";
import { logoutAPI } from "@/services/authServices";
import { useRouter } from "next/navigation";
import { RxCross1 } from "react-icons/rx";
import { IoIosArrowForward } from "react-icons/io";
import { fetchProfile } from "@/services/adminServices";

interface CompanyStats {
  departments: number;
  designations: number;
  shifts: number;
  leaveTypes: number;
  benefits: number;
}

interface OnboardingSidebarProps {
  companyStats: CompanyStats | null;
}

function OnboardingSidebar({ companyStats }: OnboardingSidebarProps) {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const router = useRouter();
  const [profileData, setProfileData] = useState<any>(null);
  const isFetchedProfile = useRef(false);
  const { isSidebarOpen, isSidebarCollapsed } = useSelector(
    (state: RootState) => state.global
  );

  const onboardingSteps = [
    {
      path: "/admin/onboarding/departments",
      label: "Departments",
      key: "departments",
    },
    { path: "/admin/onboarding/benefits", label: "Benefits", key: "benefits" },
    {
      path: "/admin/onboarding/designations",
      label: "Designations",
      key: "designations",
    },
    {
      path: "/admin/onboarding/leave-types",
      label: "Leave Types",
      key: "leaveTypes",
    },
    { path: "/admin/onboarding/shifts", label: "Shifts", key: "shifts" },
  ];

  const fetchUserProfile = async () => {
    const response = await fetchProfile(dispatch);
    if (response?.success) {
      setProfileData(response);
    } else {
      setProfileData(null);
    }
  };

  useEffect(() => {
    if (!isFetchedProfile.current) {
      fetchUserProfile();
      isFetchedProfile.current = true;
    }
  }, []);

  // Determine completed, current, and remaining steps
  const completedSteps: typeof onboardingSteps = [];
  const remainingSteps: typeof onboardingSteps = [];
  let currentStep: (typeof onboardingSteps)[0] | null = null;

  if (companyStats) {
    onboardingSteps.forEach((step) => {
      const isCompleted = companyStats[step.key as keyof CompanyStats] > 0;
      const isCurrent = step.path === pathname;

      if (isCompleted) {
        completedSteps.push(step);
      } else if (isCurrent) {
        currentStep = step;
      } else {
        remainingSteps.push(step);
      }
    });

    // If no current step found, set the first incomplete step as current
    if (!currentStep && remainingSteps.length > 0) {
      currentStep = remainingSteps[0];
      // Remove it from remaining steps
      remainingSteps.shift();
    }
  }

  // Calculate progress percentage
  const totalSteps = onboardingSteps.length;
  const completedCount = completedSteps.length;
  const progressPercentage = (completedCount / totalSteps) * 100;

  const handleSidebarToggle = () => {
    dispatch(setIsSidebarCollapsed(!isSidebarCollapsed));
  };

  const handleLogout = async () => {
    try {
      await logoutAPI(dispatch);
      router.push("/sign-in");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div
      className={`flex-col z-[99] fixed left-0 top-0 bg-g-background-100 border-r border-g-gray-alpha-400 bottom-0 transition-all duration-300 ease-in-out lg:flex ${
        isSidebarOpen
          ? "flex shadow-geist-modal translate-x-0"
          : "hidden lg:flex -translate-x-full lg:translate-x-0"
      } ${isSidebarCollapsed ? "w-20" : "w-64"}`}
    >
      <div className="py-8 px-4 flex flex-col gap-3">
        {isSidebarCollapsed ? (
          <Image src="/HRM-2.svg" alt="HRM" width={32} height={32} className="h-8 w-8 object-contain" />
        ) : (
          <Image src="/HRM.svg" alt="HRM" width={110} height={44} className="h-8 w-auto object-contain" />
        )}
        <h2 className="text-g-gray-1000 text-lg font-medium capitalize">
          Hi {profileData?.result?.userName || "User"}!
        </h2>
      </div>

      <nav
        className={`flex flex-col justify-center gap-2 flex-1 py-4 ${
          isSidebarCollapsed ? "px-0" : "px-6"
        } overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']`}
      >
        {/* Completed Steps */}
        {completedSteps.map((step) => (
          <div
            key={step.path}
            className={`flex items-center ${
              isSidebarCollapsed ? "p-6 justify-center" : "py-3 pl-3"
            } rounded-[var(--g-radius-sm)] transition-all duration-200 text-g-gray-900`}
          >
            <div className="flex items-center gap-2">
              <span className="text-g-gray-900">
                <MdOutlineCheck className="text-g-blue-700" size={18} />
              </span>
              {(!isSidebarCollapsed || isSidebarOpen) && (
                <span className="text-xs sm:text-sm font-normal text-g-gray-900">
                  {step.label}
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Current Step */}
        {currentStep && (
          <div
            className={`flex items-center ${
              isSidebarCollapsed ? "p-6 justify-center" : "py-3 pl-3"
            } rounded-[var(--g-radius-sm)] transition-all duration-200 bg-g-blue-100 text-g-blue-700`}
          >
            <div className="flex items-center gap-2">
              <span className="text-g-blue-700">
                <CircleDashed size={18} />
              </span>
              {(!isSidebarCollapsed || isSidebarOpen) && (
                <span className="text-xs sm:text-sm font-normal text-g-blue-700">
                  {currentStep.label}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Remaining Steps */}
        {remainingSteps.map((step) => (
          <div
            key={step.path}
            className={`flex items-center ${
              isSidebarCollapsed ? "p-6 justify-center" : "py-3 pl-3"
            } rounded-[var(--g-radius-sm)] transition-all duration-200 text-g-gray-700 cursor-not-allowed`}
          >
            <div className="flex items-center gap-2">
              <span className="text-g-gray-700">
                <IoIosArrowForward size={18} />
              </span>
              {(!isSidebarCollapsed || isSidebarOpen) && (
                <span className="text-xs sm:text-sm font-normal text-g-gray-700">
                  {step.label}
                </span>
              )}
            </div>
          </div>
        ))}

        {!isSidebarCollapsed && (
          <div className="px-6 py-4 mt-20">
            <div className="w-full bg-g-gray-200 rounded-full h-1 overflow-hidden">
              <div
                className="bg-g-blue-700 h-full rounded-full transition-[width] duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        )}
      </nav>

      <div className="py-8 px-5">
        <div
          className={`text-g-gray-900 items-center py-3 gap-2 flex cursor-pointer rounded-[var(--g-radius-sm)] hover:bg-g-gray-alpha-100 hover:text-g-gray-1000 font-normal focus-ring-geist ${
            isSidebarCollapsed ? "justify-center" : "pl-3"
          }`}
          onClick={handleLogout}
        >
          <MdOutlineLogout size={20} />
          {!isSidebarCollapsed && <span>Logout</span>}
        </div>
      </div>
    </div>
  );
}

export default OnboardingSidebar;
