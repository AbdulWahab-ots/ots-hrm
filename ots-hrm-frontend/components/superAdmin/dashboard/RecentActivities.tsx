"use client";
import { ArrowUpToLine, Plus, User } from "lucide-react";
import React, { useState } from "react";
import CustomModal from "../../common/CustomModal";
import CreateCompanyForm from "../companies/createComapny/CreateCompanyForm";
import AccountSetting from "@/components/common/Profile/SuperAdminProfile/AccountSetting";
import AddUserForm from "../companies/createComapny/AddUserForm";

interface ActivityItem {
  id: number;
  type: "activation" | "registration" | "review" | "deactivation";
  company: string;
  time: string;
  color: "green" | "blue" | "yellow" | "red";
}

interface QuickAction {
  id: number;
  title: string;
  icon: React.ReactNode;
}

const RecentActivities: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [companyDataForUsers, setCompanyDataForUsers] = useState<{
    name: string;
    email: string;
    logo?: File;
  } | null>(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  // Sample data for recent activities
  const activities: ActivityItem[] = [
    {
      id: 1,
      type: "activation",
      company: "TechCorp Inc. activated",
      time: "2 hours ago",
      color: "green",
    },
    {
      id: 2,
      type: "registration",
      company: "New company registration",
      time: "3 hours ago",
      color: "blue",
    },
    {
      id: 3,
      type: "review",
      company: "DataFlow Ltd. pending review",
      time: "5 hours ago",
      color: "yellow",
    },
  ];

  // Sample data for quick actions
  const quickActions: QuickAction[] = [
    {
      id: 1,
      title: "Add New Company",
      icon: <Plus className="w-6 h-6 mr-3 text-[#7782AE]" />,
    },
    {
      id: 2,
      title: "Export Data",
      icon: <ArrowUpToLine className="w-6 h-6 mr-3 text-[#7782AE]" />,
    },
    {
      id: 3,
      title: "Profile Settings",
      icon: <User className="w-6 h-6 mr-3 text-[#7782AE]" />,
    },
  ];

  // Color mapping for activity indicators
  const colorMap = {
    green: "bg-green-500",
    blue: "bg-blue-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
  };

  const handleSettingModalOpen = () => {
    setShowAccountModal(true);
  };

  const handleSettingModalClose = () => {
    setShowAccountModal(false);
  };

  const handleAddCompanyClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleQuickActionClick = (id: number) => {
    switch (id) {
      case 1:
        handleAddCompanyClick();
        break;
      case 3:
        handleSettingModalOpen();
        break;
      default:
        break;
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 pt-6">
        {/* Recent Activities Card */}
        <div className="lg:col-span-2 bg-g-background-100 p-4 lg:p-6 rounded-2xl border-[1px] border-g-gray-alpha-400 lg:rounded-3xl">
          <h2 className="text-2xl font-medium mb-6 text-[#1C202F]">
            Recent Activities
          </h2>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="bg-[#597BE81A] hover:bg-blue-100 transition-colors p-3 lg:p-5 rounded-xl lg:rounded-[20px] flex items-center"
              >
                <span
                  className={`${
                    colorMap[activity.color]
                  } w-3 h-3 rounded-full mr-3`}
                ></span>
                <div>
                  <p className="text-[#1C202F] text-base font-medium">
                    {activity.company}
                  </p>
                  <p className="text-[#7782AE] text-sm font-medium">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="lg:col-span-2 p-4 bg-g-background-100 lg:p-6 rounded-2xl border-[1px] border-g-gray-alpha-400 lg:rounded-3xl">
          <h2 className="text-2xl font-medium mb-6 text-[#1C202F]">
            Quick Actions
          </h2>
          <div className="space-y-4">
            {quickActions.map((action) => (
              <button
                key={action.id}
                className="w-full cursor-pointer border-[1px] transition-colors p-6 border-[#597BE84D] lg:p-[28.25px] rounded-xl lg:rounded-[20px] flex items-center hover:bg-gray-50"
                onClick={() => handleQuickActionClick(action.id)}
              >
                {action.icon}
                <span className="text-[#1C202F] font-medium text-base">
                  {action.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Add New Company Modal */}
      <CustomModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title="Add New Company"
      >
        <CreateCompanyForm
          onClose={handleModalClose}
          onAddUserClick={(data) => {
            setCompanyDataForUsers(data);
            setIsModalOpen(false);
            setIsAddUserModalOpen(true);
          }}
        />
      </CustomModal>

      {/* Add Users Modal */}
      <CustomModal
        isOpen={isAddUserModalOpen}
        onClose={() => {
          setIsAddUserModalOpen(false);
          setIsModalOpen(true);
        }}
        title="Add Users to Company"
      >
        {companyDataForUsers && (
          <AddUserForm
            onClose={() => {
              setIsAddUserModalOpen(false);
              setIsModalOpen(true);
            }}
            companyData={companyDataForUsers}
          />
        )}
      </CustomModal>

      {/* Account Settings Modal */}
      <CustomModal
        isOpen={showAccountModal}
        onClose={handleSettingModalClose}
        title="Account Settings"
        backText="Back"
        confirmText="Save Changes"
        onConfirm={handleSettingModalClose}
      >
        <AccountSetting
          onClose={handleSettingModalClose}
          onAddUserClick={() => {}}
        />
      </CustomModal>
    </>
  );
};

export default RecentActivities;
