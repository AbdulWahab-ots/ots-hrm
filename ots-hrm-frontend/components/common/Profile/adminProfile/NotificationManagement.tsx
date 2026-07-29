"use client";

import React, { useState } from "react";
import { Formik, Form, Field } from "formik";
import Button from "../../Button";
import { ArrowLeft } from "lucide-react";
import ToggleButton from "../../form/ToggleButton";
import BackButton from "../../BackButton";

interface NotificationManagementProps {
  onBack: () => void;
}

const NotificationManagement: React.FC<NotificationManagementProps> = ({
  onBack,
}) => {
  const handleSubmit = async (values: any) => {
    // Simulate API call
    console.log("Saving notification preferences:", values);
    // On success, go back
    onBack();
  };

  const [settings, setSettings] = useState({
    leaveRequests: false,
    comingHolidays: true,
    payrollUpdates: true,
    attendanceRequests: false,
  });

  const handleToggle = (key: keyof typeof settings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const options = [
    {
      key: "leaveRequests",
      title: "Leave Requests",
      description: "Any kind of leave requests from team members",
    },
    {
      key: "comingHolidays",
      title: "Coming Holidays",
      description:
        "All the public, social, and religious holidays we celebrate.",
    },
    {
      key: "payrollUpdates",
      title: "Payroll Updates & Alerts",
      description: "Upcoming, paid, and leftover paychecks",
    },
    {
      key: "attendanceRequests",
      title: "Attendance Requests",
      description: "Requests to change your clock-in and clock-out times.",
    },
  ] as const;

  return (
    <div className="w-full max-w-[630px] mx-auto">
      <BackButton
        label="Notification Management"
        onClick={() => onBack()}
        iconPosition="left"
        className=""
      />
      <div className="w-full max-w-[630px] mx-auto bg-g-background-100 sm:rounded-3xl rounded-2xl lg:rounded-[32px] border-[1px] border-g-blue-700/30 p-6 space-y-6 shadow-geist-card">
        {options.map((item, index) => (
          <div
            key={item.key}
            className={`flex items-center justify-between ${
              index !== options.length - 1 ? "" : ""
            }`}
          >
            <div>
              <h4 className="text-label-14 text-g-gray-1000">
                {item.title}
              </h4>
              <p className="text-label-12 text-g-gray-700 mt-1">
                {item.description}
              </p>
            </div>

            <div className="flex  items-center gap-2">
              <span className="h-4 w-[1px] bg-g-blue-700/30"></span>
              <ToggleButton
                initialValue={settings[item.key]}
                onChange={(value) => handleToggle(item.key, value)}
                trueBgColor="#597BE8"
                falseBgColor="#F5F5F5"
                width="44px"
                height="24px"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationManagement;
