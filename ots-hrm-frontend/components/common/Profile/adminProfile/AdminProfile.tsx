"use client";

import React, { useMemo, useState } from "react";
import { Bell, Edit, KeyRound, User, ArrowLeft } from "lucide-react";
import Button from "../../Button";
import HeaderWithTooltip from "../../Typography/HeaderWithTooltip";
import ChangePassword from "./ChnagePassword";
import NotificationManagement from "./NotificationManagement";
import EditProfile from "./ProfileSetting";
import BackButton from "../../BackButton";

// Placeholder for ChangePasswordWrapper remains the same
const ChangePasswordWrapper: React.FC<{ onBack: () => void }> = ({
  onBack,
}) => {
  return (
    <div className="w-full max-w-[630px] mx-auto p-6">
      <BackButton
        label="Change Password"
        onClick={() => onBack()}
        iconPosition="left"
        className=""
      />
      <div>
        <ChangePassword onSuccess={onBack} />
      </div>
    </div>
  );
};

interface AdminProfileProps {
  user: any;
  onClose?: () => void;
}

const AdminProfile: React.FC<AdminProfileProps> = ({ user }) => {
  const [activeModal, setActiveModal] = useState<
    "notification" | "edit" | "password" | null
  >(null);

  const fullName =
    user?.firstName || user?.lastName
      ? `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
      : user?.userName || "Admin";

  const joinDate = useMemo(() => {
    if (!user?.createdAt) return "—";
    const date = new Date(user.createdAt);
    return date.toLocaleString("default", { month: "short", year: "numeric" });
  }, [user]);

  // Reset to default view
  const resetView = () => setActiveModal(null);

  // Render the content based on activeModal state
  const renderContent = () => {
    switch (activeModal) {
      case "notification":
        return <NotificationManagement onBack={resetView} />;
      case "edit":
        return <EditProfile user={user} onBack={resetView} />;
      case "password":
        return <ChangePasswordWrapper onBack={resetView} />;
      default:
        return (
          <div className="w-full max-w-[830px] mx-auto p-2 sm:p-6">
            {/* Header Section */}
            <div className="flex flex-col bg-g-blue-100 rounded-[var(--g-radius-lg)] p-2 border-[1px] border-g-blue-700/30 sm:flex-row items-center sm:items-start justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                {user?.pictureUrl ? (
                  <img
                    src={user.pictureUrl}
                    alt={`${fullName}'s profile`}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-g-blue-100 flex items-center justify-center text-heading-16 text-g-blue-800">
                    {fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
                    <h2 className="text-heading-16 text-g-gray-900">
                      {fullName}
                    </h2>
                    <p className="text-label-13 flex items-center h-[26px] py-1 px-2 rounded-[var(--g-radius-full)] bg-g-blue-100 text-g-blue-800">
                      {user?.role?.name || "Admin"}
                    </p>
                  </div>
                  <p className="text-copy-14 text-g-gray-800">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6">
              <div className="bg-g-background-100 border border-g-blue-700/30 rounded-[var(--g-radius-md)] p-6 shadow-geist-card">
                <HeaderWithTooltip
                  title="Managed Department"
                  tooltipContent="Shows the department you're responsible for managing."
                  iconSize={14}
                  textClassName="text-heading-16 text-g-gray-900"
                />
                <p className="text-[36px] font-semibold text-g-gray-1000 mt-6">
                  5
                </p>
              </div>

              <div className="bg-g-background-100 border border-g-blue-700/30 rounded-[var(--g-radius-md)] p-6 shadow-geist-card">
                <HeaderWithTooltip
                  title="Member Since"
                  tooltipContent="When the admin account was created."
                  iconSize={14}
                  textClassName="text-heading-16 text-g-gray-900"
                />
                <p className="text-[36px] font-semibold text-g-gray-1000 mt-6">
                  {joinDate}
                </p>
              </div>
            </div>

            {/* Activity Log & Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              {/* Activity Log */}
              <div className="bg-g-background-100 border sm:col-span-2 border-g-blue-700/30 rounded-[var(--g-radius-md)] p-6 shadow-geist-card">
                <HeaderWithTooltip
                  title="Activity Log"
                  tooltipContent="Your recent admin activities."
                  iconSize={14}
                  textClassName="text-heading-16 text-g-gray-900"
                />
                <ul className="space-y-3 text-copy-14 text-g-gray-900 mt-4">
                  <li className="flex items-center gap-2">
                    <span className="p-2 rounded-[var(--g-radius-sm)] bg-g-blue-100">
                      <User className="w-5 h-5 text-g-gray-1000" />
                    </span>
                    <div>
                      <p className="text-label-14 text-g-gray-1000">
                        Profile Updated
                      </p>
                      <span className="text-label-12 text-g-gray-700">Just now</span>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Quick Actions */}
              <div className="bg-g-background-100 border sm:col-span-3 border-g-blue-700/30 rounded-[var(--g-radius-md)] p-6 shadow-geist-card flex flex-col gap-3">
                <h3 className="text-heading-14 text-g-gray-900 mb-1">
                  Quick Actions
                </h3>

                <Button
                  label="Notification Management"
                  icon={Bell}
                  variant="outline"
                  className="justify-start"
                  onClick={() => setActiveModal("notification")}
                />

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    label="Edit Profile"
                    icon={Edit}
                    variant="outline"
                    className="w-1/2 justify-center"
                    onClick={() => setActiveModal("edit")}
                  />
                  <Button
                    label="Change Password"
                    icon={KeyRound}
                    variant="outline"
                    className="w-1/2 justify-center"
                    onClick={() => setActiveModal("password")}
                  />
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return renderContent();
};

export default AdminProfile;
