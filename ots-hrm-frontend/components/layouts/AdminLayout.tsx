"use client";
import React, { useEffect, useState } from "react";
import Sidebar from "../common/Sidebar";
import Topbar from "../common/Topbar";
import OnboardingSidebar from "../common/OnboardingSidebar";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useRouter, usePathname } from "next/navigation";
import { getCompanyStats } from "@/services/adminServices";
import LoadingSpinner from "../common/LoadingSpinner";

interface CompanyStats {
  departments: number;
  designations: number;
  shifts: number;
  leaveTypes: number;
  benefits: number;
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isSidebarCollapsed } = useSelector(
    (state: RootState) => state.global
  );
  const [companyStats, setCompanyStats] = useState<CompanyStats | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const response = await getCompanyStats(dispatch);
        if (response && response.success) {
          const stats = response.result;
          setCompanyStats(stats);

          const isOnboardingComplete = Object.values({
            departments: stats.departments,
            shifts: stats.shifts,
            leaveTypes: stats.leaveTypes,
            designations: stats.designations,
            benefits: stats.benefits,
          }).every((value) => value > 0);

          const allStatsZero = Object.values({
            departments: stats.departments,
            shifts: stats.shifts,
            leaveTypes: stats.leaveTypes,
            designations: stats.designations,
            benefits: stats.benefits,
          }).every((value) => value === 0);

          const onboardingRoutes = [
            "/admin/onboarding",
            "/admin/onboarding/department",
            "/admin/onboarding/benefit",
            "/admin/onboarding/designation",
            "/admin/onboarding/leave-type",
            "/admin/onboarding/shift",
          ];

          if (isOnboardingComplete && onboardingRoutes.includes(pathname)) {
            router.push("/admin/dashboard");
          } else if (
            !isOnboardingComplete &&
            !onboardingRoutes.includes(pathname)
          ) {
            if (allStatsZero) {
              router.push("/admin/onboarding");
            } else if (stats.departments === 0) {
              router.push("/admin/onboarding/department");
            } else if (stats.benefits === 0) {
              router.push("/admin/onboarding/benefit");
            } else if (stats.designations === 0) {
              router.push("/admin/onboarding/designation");
            } else if (stats.leaveTypes === 0) {
              router.push("/admin/onboarding/leave-type");
            } else if (stats.shifts === 0) {
              router.push("/admin/onboarding/shift");
            }
          }
        } else {
          console.error("Failed to fetch company stats");
        }
      } catch (error) {
        console.error("Error fetching company stats:", error);
        // Handle error
      }
    };

    checkOnboardingStatus();
  }, [router, pathname, dispatch]);

  if (!companyStats) {
    return <LoadingSpinner />;
  }

  const isOnboardingComplete = Object.values({
    departments: companyStats.departments,
    shifts: companyStats.shifts,
    leaveTypes: companyStats.leaveTypes,
    designations: companyStats.designations,
    benefits: companyStats.benefits,
  }).every((value) => value > 0);

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      {isOnboardingComplete ? (
        <Sidebar />
      ) : (
        <OnboardingSidebar companyStats={companyStats} />
      )}
      <div className="w-full">
        {isOnboardingComplete && <Topbar isEmployee={false} />}
        <div
          style={{
            minHeight: isOnboardingComplete ? "calc(100vh - 80px)" : "100vh",
          }}
          className={` ${
            isOnboardingComplete ? "mt-20 p-4 md:p-6 lg:p-8" : ""
          } bg-g-background-100 neo-down transition-all duration-300 ${
            isSidebarCollapsed && isOnboardingComplete
              ? "ml-0 lg:ml-20"
              : "ml-0 lg:ml-72"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AdminPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
