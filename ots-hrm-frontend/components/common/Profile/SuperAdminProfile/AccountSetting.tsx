"use client";
import { useRef, useState } from "react";
import Button from "@/components/common/Button";
import Image from "next/image";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import BasicInfo from "./BasicInfo";
import PasswordSecurityForm from "./PasswordSecurityForm";
import { useSelector } from "react-redux";

interface AccountSettingProps {
  onClose: () => void;
  onAddUserClick: () => void;
}

type ActiveView = "account" | "basic-info" | "password";

const AccountSetting: React.FC<AccountSettingProps> = ({
  onClose,
  onAddUserClick,
}) => {
  const [activeView, setActiveView] = useState<ActiveView>("account");
  const passwordFormRef = useRef<{ submitForm: () => void }>(null);

  // Get profile data from Redux store or use dummy data if not available
  const profileData = useSelector((state: any) => state.global.profileData) || {
    result: {
      firstName: "Add",
      lastName: "Name",
      email: "example@gmail.com",
      pictureUrl: null,
    },
  };
  console.log(profileData, "profileData");
  const handleBackToAccount = () => {
    setActiveView("account");
  };

  const handleSaveChanges = () => {
    if (activeView === "password" && passwordFormRef.current) {
      passwordFormRef.current.submitForm();
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
  const getViewTitle = () => {
    switch (activeView) {
      case "basic-info":
        return "Basic Info";
      case "password":
        return "Change Security";
      default:
        return "Account";
    }
  };

  return (
    <div className="flex min-w-[230px] w-[800px] flex-col">
      <div className="flex-col">
        {activeView !== "account" && (
          <button
            className="cursor-pointer flex items-center gap-2 pb-4"
            onClick={handleBackToAccount}
          >
            <span className="p-3 bg-(--chevron-bg) rounded-full">
              <FaChevronLeft className="text-(--chevron-color)" />
            </span>
            <span className="text-(--text-dark) text-[20px] font-semibold">
              {getViewTitle()}
            </span>
          </button>
        )}

        {activeView === "account" ? (
          <div className="min-h-[440px]">
            <div className="flex p-[10px] md:p-6 sm:rounded-3xl rounded-2xl lg:rounded-[32px]  items-center border border-(--genrel-light-stroke) mb-5 bg-(--secondary-alpha-5) gap-2">
              <div className="flex rounded-full items-center cursor-pointer relative">
                {profileData?.result?.pictureUrl ? (
                  <Image
                    src={profileData.result.pictureUrl}
                    alt="Profile"
                    width={56}
                    height={56}
                    className="rounded-full w-[40px] h-[40px] md:w-[56px] md:h-[56px]  border-2 border-(--profile-border)"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full text-(--primary-navy-blue) bg-(--General-Surface-Primary) flex items-center justify-center text-[20px] font-medium">
                    {getInitials()}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-(--genrel-text-light) capitalize text-[14px] md:text-lg font-semibold inline">
                  {profileData?.result?.firstName &&
                  profileData?.result?.lastName
                    ? `${profileData.result.firstName} ${profileData.result.lastName}`
                    : profileData?.result?.userName}
                </h2>
                <h3 className="text-(--text-light) text-[12px] sm:text-base font-normal ">
                  {profileData?.result?.email}
                </h3>
              </div>
            </div>
            <div className="p-2 md:p-4 bg-g-background-100 sm:rounded-3xl rounded-2xl lg:rounded-[32px]  border-[1px] border-(--genrel-light-stroke)">
              <div className="grid mt-4">
                <h1 className="text-(--primary-gray-900) text-lg sm:text-2xl md:text-3xl font-semibold">
                  Profile Information
                </h1>
                <button
                  className="flex px-2 font-medium hover:bg-(--primary-alpha-5) rounded-2xl border-b border-(--chevron-bg) cursor-pointer py-6 text-(--genrel-text-light) justify-between items-center"
                  onClick={() => setActiveView("basic-info")}
                >
                  <p>Image, Name, email</p>
                  <FaChevronRight className="text-(--genrel-text-light)" />
                </button>
                <button
                  className="flex px-2 font-medium cursor-pointer hover:bg-(--primary-alpha-5) mb-2 rounded-2xl py-6 text-(--genrel-text-light) justify-between items-center"
                  onClick={() => setActiveView("password")}
                >
                  <p>Change Password</p>
                  <FaChevronRight className="text-(--genrel-text-light)" />
                </button>
              </div>
            </div>
          </div>
        ) : activeView === "basic-info" ? (
          <BasicInfo
            onClose={handleBackToAccount}
            onAddUserClick={onAddUserClick}
          />
        ) : (
          <PasswordSecurityForm
            ref={passwordFormRef}
            onSuccess={handleBackToAccount}
          />
        )}
      </div>
    </div>
  );
};

export default AccountSetting;
