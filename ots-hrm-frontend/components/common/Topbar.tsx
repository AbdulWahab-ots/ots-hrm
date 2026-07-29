"use client";

import { setIsSidebarOpen } from "@/store/features/global/globalSlice";
import { FaBars } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import TopbarRightSection from "./TopbarRightSection";
import CommandPalette, { CommandPaletteTrigger } from "./CommandPalette";
import { buildBreadcrumbs } from "@/utils/breadcrumbs";

const Topbar = ({ isEmployee = false }) => {
  const dispatch = useDispatch();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const { isSidebarCollapsed } = useSelector(
    (state: RootState) => state.global
  );
  const pathname = usePathname();
  const { user } = useSelector((state: RootState) => state.auth);

  const userRole = user?.role?.code || null;
  const crumbs = buildBreadcrumbs(pathname);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSidebarClick = () => {
    dispatch(setIsSidebarOpen(true));
  };

  const shouldShowNotification =
    userRole === "admin" || userRole === "employee";

  return (
    <div
      className={`fixed top-0 bg-g-background-100 right-0 z-50 w-full ${isSidebarCollapsed
        ? "lg:w-[calc(100%-80px)]"
        : "lg:w-[calc(100%-288px)]"
        } ${isScrolled ? "shadow-geist-card" : ""
        } border-b border-g-gray-alpha-400 transition-all duration-300`}
    >
      <div className="flex justify-between items-center h-20 px-4 sm:px-6 py-3 gap-1">
        {/* Left Section */}
        <div className="flex items-center gap-4 min-w-0">
          <div
            className="lg:hidden block cursor-pointer focus-ring-geist"
            onClick={handleSidebarClick}
          >
            <FaBars size={22} className="text-g-gray-1000" />
          </div>
          <nav
            aria-label="Breadcrumb"
            className="sm:flex hidden items-center gap-1 min-w-0"
          >
            {crumbs.map((crumb, index) => {
              const isLast = index === crumbs.length - 1;
              return (
                <div key={crumb.href} className="flex items-center gap-1 min-w-0">
                  {index > 0 && (
                    <ChevronRight
                      size={14}
                      className="text-g-gray-600 shrink-0"
                    />
                  )}
                  {crumb.isLink && !isLast ? (
                    <Link
                      href={crumb.href}
                      className="text-label-14 text-g-gray-700 hover:text-g-gray-1000 transition-colors truncate focus-ring-geist rounded-[var(--g-radius-sm)]"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      className={`text-label-14 truncate ${
                        isLast ? "text-g-gray-1000 font-medium" : "text-g-gray-700"
                      }`}
                    >
                      {crumb.label}
                    </span>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1 sm:gap-4">
          <CommandPaletteTrigger onClick={() => setIsPaletteOpen(true)} />
          <TopbarRightSection
            dispatch={dispatch}
            showNotification={shouldShowNotification}
          />
        </div>
      </div>

      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
      />
    </div>
  );
};

export default Topbar;
