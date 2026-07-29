"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { fetchProfile } from "@/services/adminServices";
import { LuUser } from "react-icons/lu";
import { MdOutlineLogout } from "react-icons/md";
import AccountSetting from "./Profile/SuperAdminProfile/AccountSetting";
import EmployeeProfile from "./Profile/EmployeeProfile/EmployeeProfile";
import AdminProfile from "./Profile/adminProfile/AdminProfile";
import CustomModal from "./CustomModal";
import { logoutAPI } from "@/services/authServices";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import ModalPortal from "./ModalPortal";

interface ProfileDropdownProps {
  dispatch: any;
}

const ProfileDropdown = ({ dispatch }: ProfileDropdownProps) => {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [profileData, setProfileData] = useState<any>(null);
  const isFetchedProfile = useRef(false);

  const { user } = useSelector((state: RootState) => state.auth);
  const userRole = user?.role?.code || null;
  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setIsProfileDropdownOpen(false);
    }
  };

  const fetchUserProfile = async () => {
    const response = await fetchProfile(dispatch);
    if (response?.success) {
      setProfileData(response);
    } else {
      setProfileData(null);
    }
  };

  useEffect(() => {
    if (user && !isFetchedProfile.current) {
      fetchUserProfile();
      isFetchedProfile.current = true;
    }
  }, [user]);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logoutAPI(dispatch);
      router.push("/sign-in");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getInitials = () => {
    const firstName = profileData?.result?.firstName || "";
    const lastName = profileData?.result?.lastName || "";
    const userName = profileData?.result?.userName || "";
    if (!firstName && !lastName && userName) {
      return userName.charAt(0).toUpperCase();
    }
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const showProfileSection =
    userRole === "superAdmin" || userRole === "employee";

  console.log(user, "user,  profile");
  // ✅ Get modal configuration based on role
  const getModalConfig = () => {
    switch (userRole) {
      case "employee":
        return {
          variant: "bottom-full-no-rounded" as const,
          className: "h-full flex flex-col",
          // title: "Profile Settings",
          content: (
            <EmployeeProfile
              user={profileData?.result}
              onClose={() => setShowAccountModal(false)}
            />
          ),
        };
      case "admin":
        return {
          variant: "bottom-full" as const,
          className: "",
          // title: "Admin Profile",
          content: (
            <AdminProfile
              user={profileData?.result}
              onClose={() => setShowAccountModal(false)}
            />
          ),
        };
      case "superAdmin":
      default:
        return {
          variant: "default" as const,
          className: "",
          // title: "Account Settings",
          content: (
            <AccountSetting
              onClose={() => setShowAccountModal(false)}
              onAddUserClick={() => { }}
            />
          ),
        };
    }
  };

  const modalConfig = getModalConfig();

  return (
    <>
      {/* ✅ Profile Dropdown */}
      <div
        className="sm:flex bg-g-background-100 rounded-4xl hover:bg-g-gray-alpha-100 cursor-pointer border-[1px] border-g-gray-alpha-400 sm:py-[6px] sm:px-[6px] items-center sm:gap-4 focus-ring-geist"
        ref={dropdownRef}
        onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
      >
        <div
          className={`flex rounded-full items-center cursor-pointer relative ${userRole === "superAdmin"
            ? "border-[2px] md:border-[4px] border-g-blue-400"
            : ""
            }`}
        >
          {profileData?.result?.pictureUrl ? (
            <Image
              src={profileData.result.pictureUrl}
              alt="Profile"
              width={40}
              height={40}
              className="rounded-full w-[40px] h-[40px]"
            />
          ) : (
            <div className="w-10 h-10 rounded-full text-(--primary-navy-blue) bg-g-background-100 flex items-center justify-center text-lg font-medium">
              {getInitials()}
            </div>
          )}
        </div>

        {userRole === "admin" && (
          <div className="hidden sm:flex flex-col">
            <span className="text-label-14 font-semibold text-nowrap capitalize text-g-gray-1000">
              {profileData?.result?.firstName
                ? `${profileData.result.firstName} ${profileData.result.lastName}`
                : profileData?.result?.userName}
            </span>
            <span className="text-label-14 font-normal text-g-gray-900 capitalize">
              {userRole}
            </span>
          </div>
        )}

        <div className="pr-2">
          <ChevronRight
            className={`text-g-gray-800 hidden h-5 w-5 sm:block gap-4 transition-all duration-300 ease-in-out ${isProfileDropdownOpen ? "rotate-270" : "rotate-90"
              }`}
          />
        </div>

        {isProfileDropdownOpen && (
          <div className="absolute right-0 sm:right-4 top-20 z-50 bg-g-background-100 border border-g-gray-alpha-400 rounded-[var(--g-radius-md)] shadow-geist-menu sm:w-[344px]">
            <ul className="py-2">
              {showProfileSection && (
                <li
                  className="px-4 py-2 text-label-14 border-b-[1px] border-g-gray-alpha-400 text-g-gray-1000 hover:bg-g-gray-alpha-100 cursor-pointer"
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    setShowAccountModal(true);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex rounded-full items-center cursor-pointer relative">
                      {profileData?.result?.pictureUrl ? (
                        <Image
                          src={profileData.result.pictureUrl}
                          alt="Profile"
                          width={56}
                          height={56}
                          className="rounded-full w-[56px] h-[56px] border-2 border-g-gray-alpha-400"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-(--primary-navy-blue) text-(--General-Surface-Primary) flex items-center justify-center text-lg font-medium">
                          {getInitials()}
                        </div>
                      )}
                    </div>
                    <div>
                      <h2 className="text-[var(--surface-secondary)] text-lg font-semibold">
                        {profileData?.result?.firstName
                          ? `${profileData.result.firstName} ${profileData.result.lastName}`
                          : profileData?.result?.userName}
                      </h2>
                      <h3 className="text-[var(--text-light)] text-base font-normal">
                        {profileData?.result?.email}
                      </h3>
                    </div>
                  </div>
                </li>
              )}

              {userRole !== "superAdmin" && (
                <li
                  className="px-4 py-[14px] flex items-center border-b-[1px] border-g-gray-alpha-400 text-label-14 font-medium gap-2 text-g-gray-900 hover:bg-g-gray-alpha-100 cursor-pointer"
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    setShowAccountModal(true);
                  }}
                >
                  <LuUser className="h-4 w-4" />
                  <p>Profile</p>
                </li>
              )}

              <li
                className="px-4 flex gap-2 py-[14px] items-center text-label-14 font-normal text-g-red-700 hover:bg-g-gray-alpha-100 cursor-pointer"
                onClick={() => {
                  handleLogout();
                  setIsProfileDropdownOpen(false);
                }}
              >
                <MdOutlineLogout className="h-4 w-4 text-g-red-700" />
                <p>Logout</p>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* ✅ Account Settings Modal - MOVED OUTSIDE dropdown container */}
      <ModalPortal>
        <CustomModal
          isOpen={showAccountModal}
          onClose={() => setShowAccountModal(false)}
          // title={modalConfig.title}
          variant={modalConfig.variant}
          className={modalConfig.className}
          backText="Back"
          confirmText="Save Changes"
          onConfirm={() => setShowAccountModal(false)}
        >
          {modalConfig.content}
        </CustomModal>
      </ModalPortal>
    </>
  );
};

export default ProfileDropdown;
