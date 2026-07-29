"use client";

import NotificationDropdown from "./NotificationDropdown";
import ProfileDropdown from "./ProfileDropdown";
import ThemeToggle from "./ThemeToggle";

interface TopbarRightSectionProps {
  dispatch: any;
  showNotification?: boolean;
}

const TopbarRightSection = ({
  dispatch,
  showNotification = false,
}: TopbarRightSectionProps) => {
  return (
    <div className="flex gap-1 sm:gap-4 items-center">
      <ThemeToggle />
      {showNotification && (
        <>
          <NotificationDropdown
            dispatch={dispatch}
            className="h-[50px] w-[50px] md:h-auto md:w-auto"
          />
          <div className="border-l h-[22px] border-g-gray-alpha-400" />
        </>
      )}
      <ProfileDropdown dispatch={dispatch} />
    </div>
  );
};

export default TopbarRightSection;
