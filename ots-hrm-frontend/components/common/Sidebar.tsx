"use client";

import { useEffect, useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, ChevronRight, PanelLeftDashed } from "lucide-react";
import {
  adminNavSections,
  employeeNavSections,
  superadminNavSections,
  type NavItem,
  type NavSection,
} from "@/utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  setIsSidebarOpen,
  setIsSidebarCollapsed,
  setActiveSidebarItem,
} from "@/store/features/global/globalSlice";
import { RxCross2 } from "react-icons/rx";
import Image from "next/image";
import { MdOutlineLogout } from "react-icons/md";
import { logoutAPI } from "@/services/authServices";
import { LuLogOut } from "react-icons/lu";

type SidebarItem = NavItem;

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>(
    {}
  );
  const { isSidebarOpen, isSidebarCollapsed } = useSelector(
    (state: RootState) => state.global
  );
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const userRole = user?.role?.code || null;

  const sidebarSections: NavSection[] = useMemo(() => {
    if (!userRole) return [];
    switch (userRole) {
      case "superAdmin":
        return superadminNavSections;
      case "admin":
        return adminNavSections;
      case "employee":
        return employeeNavSections;
      default:
        return adminNavSections;
    }
  }, [userRole]);

  const sidebarItems: SidebarItem[] = useMemo(
    () => sidebarSections.flatMap((section) => section.items),
    [sidebarSections]
  );

  useEffect(() => {
    const currentPath = pathname;
    sidebarItems.forEach((item) => {
      if (item.hasDropdown && Array.isArray(item.subItems)) {
        const match = item.subItems.find(
          (subItem) => currentPath === subItem.href
        );
        if (match) {
          setOpenDropdowns((prev) => ({
            ...prev,
            [item.label]: true,
          }));
          dispatch(
            setActiveSidebarItem({
              parent: item.label,
              child: match.label,
            })
          );
        }
      } else if (item.href && currentPath === item.href && !item.hasDropdown) {
        dispatch(
          setActiveSidebarItem({
            parent: item.label,
            child: null,
          })
        );
      }
    });
  }, [pathname, sidebarItems, dispatch]);

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  const isActive = (path: string) => path === pathname;
  const isAnySubItemActive = (item: SidebarItem) => {
    if (!item.hasDropdown || !item.subItems) return false;
    return item.subItems.some((subItem) => isActive(subItem.href));
  };

  const handleMenuItemClick = (item: SidebarItem) => {
    if (item.hasDropdown) {
      setOpenDropdowns((prev) => ({
        ...prev,
        [item.label]: !prev[item.label],
      }));
    } else if (item.href) {
      dispatch(
        setActiveSidebarItem({
          parent: item.label,
          child: null,
        })
      );
      router.push(item.href);
      if (isSidebarOpen) {
        dispatch(setIsSidebarOpen(false));
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logoutAPI(dispatch);
      router.push("/sign-in");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleSidebarToggle = () => {
    dispatch(setIsSidebarCollapsed(!isSidebarCollapsed));
  };

  return (
    <div
      className={`flex-col z-[99] fixed left-0 top-0 bg-g-background-100 border-r border-g-gray-alpha-400 bottom-0 transition-all duration-300 ease-in-out lg:flex ${
        isSidebarOpen
          ? "flex shadow-geist-modal translate-x-0"
          : "hidden lg:flex -translate-x-full lg:translate-x-0"
      } ${isSidebarCollapsed ? "w-20" : "w-72"}`}
    >
      {isSidebarOpen && (
        <span
          onClick={() => dispatch(setIsSidebarOpen(false))}
          className="absolute top-4 right-4 text-g-gray-800 hover:text-g-gray-1000 lg:hidden block cursor-pointer focus-ring-geist"
        >
          <RxCross2 size={20} />
        </span>
      )}

      <div
        className={`${
          !isSidebarCollapsed
            ? "py-8 px-4 flex justify-between items-center"
            : "py-6 px-4 flex flex-col justify-center items-center gap-4"
        }`}
      >
        <div
          className={`group relative flex items-center justify-center ${
            isSidebarCollapsed ? "w-8 h-8" : "h-8 w-20"
          }`}
        >
          {/* Full wordmark — fades/scales out as the sidebar collapses */}
          <Image
            src="/HRM.svg"
            alt="HRM"
            width={110}
            height={44}
            className={`absolute inset-0 h-8 w-auto object-contain transition-[opacity,transform] duration-200 ease-[var(--g-ease-out)] ${
              isSidebarCollapsed ? "opacity-0 scale-95" : "opacity-100 scale-100"
            }`}
          />
          {/* Logo-mark only — fades/scales in as the sidebar collapses.
              Stays visible on hover; the expand button layers on top of it. */}
          <Image
            src="/HRM-2.svg"
            alt="HRM"
            width={32}
            height={32}
            className={`absolute inset-0 h-8 w-8 object-contain transition-[opacity,transform] duration-200 ease-[var(--g-ease-out)] ${
              isSidebarCollapsed ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
          />
          {isSidebarCollapsed && (
            <button
              type="button"
              aria-label="Expand sidebar"
              onClick={handleSidebarToggle}
              className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 scale-95 pointer-events-none transition-[opacity,transform] duration-150 ease-[var(--g-ease-out)] group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto focus-ring-geist"
              style={{
                boxShadow:
                  "0 0 0 1px var(--g-gray-alpha-400), 0 4px 10px -2px var(--g-gray-alpha-300)",
              }}
            >
              <PanelLeftDashed size={16} className="text-g-gray-800" />
            </button>
          )}
        </div>
        {!isSidebarCollapsed && (
          <PanelLeftDashed
            className="text-g-gray-800 hover:text-g-gray-1000 lg:block hidden cursor-pointer focus-ring-geist"
            onClick={handleSidebarToggle}
          />
        )}
      </div>

      <nav
        className={`flex flex-col flex-1 py-4 ${
          isSidebarCollapsed ? "px-0" : "px-4"
        } overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']`}
      >
        {sidebarSections.map((section, sectionIndex) => (
          <div
            key={section.title ?? `section-${sectionIndex}`}
            className={sectionIndex > 0 ? "mt-4" : ""}
          >
            {section.title && (!isSidebarCollapsed || isSidebarOpen) && (
              <p className="px-3 pb-1 text-label-12 uppercase tracking-wider text-g-gray-700 select-none">
                {section.title}
              </p>
            )}
            {section.title && isSidebarCollapsed && !isSidebarOpen && (
              <div className="mx-4 my-2 border-t border-g-gray-alpha-300" />
            )}
            {section.items.map((item, index) => {
          const isItemActive =
            item.href && !item.hasDropdown && isActive(item.href);
          const isSubItemActive = isAnySubItemActive(item);
          const isDropdownOpen = openDropdowns[item.label];
          const shouldHighlight =
            (!item.hasDropdown && isItemActive) ||
            (item.hasDropdown && isSubItemActive);

          return (
            <div key={item.label ?? index}>
              <div
                className={`flex items-center gap-2 cursor-pointer rounded-[var(--g-radius-sm)] transition-[background-color,transform] duration-150 ease-[var(--g-ease-out)] active:scale-[0.98] focus-ring-geist
                  ${
                    isSidebarCollapsed
                      ? `mx-2 my-1 p-4 justify-center ${
                          shouldHighlight
                            ? "bg-g-gray-alpha-200"
                            : "hover:bg-g-gray-alpha-100"
                        }`
                      : `py-3 pl-3 pr-2 ${
                          shouldHighlight
                            ? "bg-g-gray-alpha-200"
                            : "hover:bg-g-gray-alpha-100"
                        }`
                  }`}
                onClick={() => handleMenuItemClick(item)}
              >
                <span
                  className={`transition-colors duration-150 ease ${
                    shouldHighlight ? "text-g-blue-700" : "text-g-gray-800"
                  }`}
                >
                  {item.icon && <item.icon size={18} />}
                </span>
                {(!isSidebarCollapsed || isSidebarOpen) && (
                  <span
                    className={`flex-1 text-xs sm:text-sm xl:text-sm font-normal transition-colors duration-150 ease ${
                      shouldHighlight ? "text-g-gray-1000" : "text-g-gray-900"
                    }`}
                  >
                    {item.label}
                  </span>
                )}
                {(!isSidebarCollapsed || isSidebarOpen) && item.hasDropdown && (
                  <span className="transition-transform duration-200 ease-in-out text-g-gray-800">
                    {isDropdownOpen ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </span>
                )}
              </div>

              {(!isSidebarCollapsed || isSidebarOpen) && item.hasDropdown && (
                <div
                  className={`grid transition-[grid-template-rows] duration-200 ease-[var(--g-ease-out)] ${
                    isDropdownOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div
                      className={`ml-4 flex flex-col gap-1 transition-[transform,opacity] duration-200 ease-[var(--g-ease-out)] ${
                        isDropdownOpen
                          ? "translate-x-0 opacity-100"
                          : "translate-x-4 opacity-0"
                      }`}
                    >
                      {item.subItems?.map((subItem, subIndex) => {
                        const isSubItemCurrentlyActive = isActive(
                          subItem.href
                        );

                        return (
                          <Link
                            key={subIndex}
                            href={subItem.href || "#"}
                            className={`flex items-center pl-3 py-3 text-xs md:text-sm rounded-[var(--g-radius-sm)] active:scale-[0.98] transition-[background-color,color,transform] duration-150 ease-[var(--g-ease-out)] focus-ring-geist ${
                              isSubItemCurrentlyActive
                                ? "bg-g-gray-alpha-200 text-g-gray-1000 font-normal"
                                : "text-g-gray-900 hover:bg-g-gray-alpha-100 hover:text-g-gray-1000 font-normal"
                            }`}
                            onClick={() => {
                              dispatch(
                                setActiveSidebarItem({
                                  parent: item.label,
                                  child: subItem.label,
                                })
                              );
                              if (isSidebarOpen) {
                                dispatch(setIsSidebarOpen(false));
                              }
                            }}
                          >
                            {subItem.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
          </div>
        ))}
      </nav>

      <div className="pb-6 px-4">
        <div
          className={`flex items-center gap-2 cursor-pointer rounded-[var(--g-radius-sm)] transition-[background-color,transform] duration-150 ease-[var(--g-ease-out)] active:scale-[0.98] hover:bg-g-gray-alpha-100 focus-ring-geist ${
            isSidebarCollapsed ? "mx-2 my-1 p-4 justify-center" : "py-3 pl-3 pr-2"
          }`}
          onClick={() => handleLogout()}
        >
          <span className="text-g-gray-800">
            <LuLogOut size={18} />
          </span>
          {!isSidebarCollapsed && (
            <span className="flex-1 text-xs sm:text-sm xl:text-sm font-normal text-g-gray-900">
              Logout
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
