// "use client";

// import React from "react";
// import { FaEnvelope, FaPhone, FaEdit } from "react-icons/fa";
// import Image from "next/image";
// import Button from "../../Button";

// interface EmployeeProfileProps {
//   user: any;
//   onClose?: () => void;
// }

// const EmployeeProfile: React.FC<EmployeeProfileProps> = ({ user, onClose }) => {
//   if (!user) {
//     return (
//       <div className="flex items-center justify-center min-h-[50vh]">
//         <p className="text-gray-500">Loading profile...</p>
//       </div>
//     );
//   }

//   // 🧩 Extract user data safely
//   const employee = user?.employee || {};
//   const fullName =
//     `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.userName;
//   const designation = employee?.designationName || "Employee";
//   const joiningDate = employee?.joiningDate
//     ? new Date(employee.joiningDate).toLocaleDateString("en-US", {
//         month: "short",
//         day: "numeric",
//         year: "numeric",
//       })
//     : "N/A";

//   const employeeCode = employee?.employeeCode || "N/A";
//   const email = user?.email || "N/A";
//   const phoneNumber = employee?.phoneNumber || "N/A";
//   const bankName = employee?.bankName || "N/A";
//   const iban = employee?.ibanNumber || "N/A";
//   const accountNumber = employee?.accountNumber || "N/A";

//   return (
//     <div className="min-h-screen bg-[#F7FAFF] flex flex-col items-center py-6 px-4 md:px-8">
//       {/* Header */}
//       <div className="w-full max-w-4xl flex items-center mb-6">
//         <Button
//           isArrowButton
//           onClick={onClose || (() => window.history.back())}
//         />
//         <h2 className="ml-3 text-lg font-semibold text-g-gray-1000">Profile</h2>
//       </div>

//       {/* Profile Card */}
//       <div className="w-full max-w-4xl bg-g-background-100 rounded-2xl shadow-sm p-6 space-y-6">
//         {/* Top Section */}
//         <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
//           <div className="flex items-center gap-4">
//             {user?.pictureUrl ? (
//               <Image
//                 src={user.pictureUrl}
//                 alt="Profile"
//                 width={64}
//                 height={64}
//                 className="rounded-full object-cover"
//               />
//             ) : (
//               <div className="w-16 h-16 rounded-full bg-g-gray-100 flex items-center justify-center text-lg font-semibold text-g-gray-1000">
//                 {user?.firstName?.charAt(0)?.toUpperCase() ||
//                   user?.userName?.charAt(0)?.toUpperCase()}
//               </div>
//             )}
//             <div>
//               <h3 className="text-lg font-semibold text-g-gray-1000">
//                 Hi {fullName}!
//               </h3>
//               <p className="text-sm text-g-gray-800">
//                 {designation} • Joined: {joiningDate}
//               </p>
//               <p className="text-xs text-g-gray-800 mt-1">{employeeCode}</p>
//             </div>
//           </div>
//         </div>

//         {/* Tabs */}
//         <div className="flex border-b border-gray-200">
//           {["Personal Info", "Benefits", "Payment Method"].map((tab, i) => (
//             <button
//               key={i}
//               className={`text-sm md:text-base px-4 py-2 ${
//                 i === 0
//                   ? "text-primary-navy-blue border-b-2 border-primary-navy-blue font-medium"
//                   : "text-g-gray-800"
//               }`}
//             >
//               {tab}
//             </button>
//           ))}
//         </div>

//         {/* Basic Info */}
//         <div className="border border-g-gray-alpha-400 rounded-2xl p-5 relative">
//           <h4 className="font-semibold text-g-gray-1000 mb-4">
//             Basic Information
//           </h4>
//           <button className="absolute top-5 right-5 text-[#597BE8]">
//             <FaEdit />
//           </button>

//           <div className="grid sm:grid-cols-2 gap-3 text-sm text-g-gray-1000">
//             <div>
//               <p className="text-g-gray-800">Employee ID</p>
//               <p>{employeeCode}</p>
//             </div>
//             <div>
//               <p className="text-g-gray-800">Email Address</p>
//               <p className="flex items-center gap-1">
//                 <FaEnvelope className="w-3 h-3" /> {email}
//               </p>
//             </div>
//             <div>
//               <p className="text-g-gray-800">Full Name</p>
//               <p>{fullName}</p>
//             </div>
//             <div>
//               <p className="text-g-gray-800">Phone Number</p>
//               <p className="flex items-center gap-1">
//                 <FaPhone className="w-3 h-3" /> {phoneNumber}
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Bank Info */}
//         <div className="border border-g-gray-alpha-400 rounded-2xl p-5">
//           <h4 className="font-semibold text-g-gray-1000 mb-4">
//             Bank Information
//           </h4>
//           <div className="grid sm:grid-cols-2 gap-3 text-sm text-g-gray-1000">
//             <div>
//               <p className="text-g-gray-800">Bank Name</p>
//               <p>{bankName}</p>
//             </div>
//             <div>
//               <p className="text-g-gray-800">IBAN</p>
//               <p>{iban}</p>
//             </div>
//             <div>
//               <p className="text-g-gray-800">Account Number</p>
//               <p>{accountNumber}</p>
//             </div>
//           </div>
//         </div>

//         {/* Actions & Leave Balance */}
//         <div className="grid md:grid-cols-2 gap-4">
//           {/* Quick Actions */}
//           <div className="border border-g-gray-alpha-400 rounded-2xl p-5">
//             <h4 className="font-semibold text-g-gray-1000 mb-4">Quick Actions</h4>
//             <div className="space-y-3">
//               <Button label="Update Contact Info" variant="outline" />
//               <Button label="Change Password" variant="outline" />
//             </div>
//           </div>

//           {/* Leave Balances */}
//           <div className="border border-g-gray-alpha-400 rounded-2xl p-5">
//             <h4 className="font-semibold text-g-gray-1000 mb-4">
//               Leave Balances
//             </h4>
//             <div className="grid grid-cols-2 gap-3 text-sm">
//               <p className="text-g-gray-800">Sick Leaves</p>
//               <p className="text-g-gray-1000 text-right">12</p>
//               <p className="text-g-gray-800">Casual Leaves</p>
//               <p className="text-g-gray-1000 text-right">08</p>
//               <p className="text-g-gray-800">Annual Leaves</p>
//               <p className="text-g-gray-1000 text-right">5</p>
//             </div>
//           </div>
//         </div>

//         {/* Pay Slip */}
//         <div className="border border-g-gray-alpha-400 rounded-2xl p-5">
//           <div className="flex justify-between items-center mb-3">
//             <div>
//               <p className="text-sm text-g-gray-800">
//                 Last Pay Slip •{" "}
//                 {new Date().toLocaleString("default", {
//                   month: "long",
//                   year: "numeric",
//                 })}
//               </p>
//               <p className="text-lg font-semibold text-g-gray-1000">
//                 PKR {Number(employee?.salary || 0).toLocaleString()}
//               </p>
//             </div>
//             <div className="flex gap-3">
//               <Button label="View" variant="outline" />
//               <Button label="Download PDF" />
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EmployeeProfile;

import React, { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { FaEdit, FaEnvelope, FaPhone } from "react-icons/fa";
import Button from "../../Button";
import Image from "next/image";
import { CiLock, CiMail } from "react-icons/ci";
import { GoDotFill } from "react-icons/go";
import { FiEdit2, FiEye } from "react-icons/fi";
import { BiSolidDownload } from "react-icons/bi";

interface EmployeeProfileProps {
  user: any;
  onClose?: () => void;
}
const EmployeeProfile: React.FC<EmployeeProfileProps> = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState<
    "personal" | "benefits" | "payment"
  >("personal");
  const employee = user?.employee || {};
  const fullName =
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.userName;
  const designation = employee?.designation?.title || "Employee";
  const shift = employee?.shift?.shiftType || "Employee";
  const joiningDate = employee?.joiningDate
    ? new Date(employee.joiningDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    : "N/A";
  console.log(user, "user");
  const employeeCode = employee?.employeeCode || "N/A";
  // Employee ID is admin-only — hide it from employees viewing their own profile.
  const viewerRole = useSelector(
    (state: RootState) => state.auth?.user?.role?.code
  );
  const canSeeEmployeeId =
    viewerRole === "admin" || viewerRole === "superAdmin";
  const email = user?.email || "N/A";
  const phoneNumber = employee?.phoneNumber || "N/A";
  const bankName = employee?.bankName || "N/A";
  const iban = employee?.ibanNumber || "N/A";
  const accountNumber = employee?.accountNumber || "N/A";

  return (
    <div className="w-full max-w-4xl p-2 sm:p-6 space-y-6">
      {/* Top Section */}
      <div className="flex flex-col bg-g-background-100 rounded-[var(--g-radius-full)] py-3 px-3.5 border border-g-gray-alpha-400 sm:flex-row md:items-center sm:items-start justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {user?.pictureUrl ? (
            <Image
              src={user.pictureUrl}
              alt="Profile"
              width={64}
              height={64}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-[var(--g-radius-full)] bg-g-gray-200 flex items-center justify-center text-lg font-semibold text-g-gray-1000">
              {user?.firstName?.charAt(0)?.toUpperCase() ||
                user?.userName?.charAt(0)?.toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex flex-col sm:flex-row items-center gap-1 md:gap-3">
              <h3 className="text-lg sm:text-xl md:text-3xl font-semibold text-g-gray-900">
                Hi {fullName}!
              </h3>
              {canSeeEmployeeId && (
                <p className="text-label-14 text-center grow-0 font-medium h-[26px] max-w-[90px] py-1 px-2 rounded-[var(--g-radius-full)] bg-g-gray-200 text-g-gray-900 ">
                  {employeeCode}
                </p>
              )}
            </div>
            <p className="mt-2 flex flex-col sm:flex-row gap-1 sm:gap-2 items-center text-[10px] sm:text-sm font-medium text-g-gray-800">
              <span> {designation}</span>
              <span className="h-1 w-1 rounded-[var(--g-radius-full)] hidden sm:block bg-g-gray-alpha-300"></span>
              <span>{shift}</span>
              <span className="h-1 w-1 rounded-[var(--g-radius-full)] hidden sm:block bg-g-gray-alpha-300"></span>
              <span>Joined : {joiningDate}</span>
            </p>
          </div>
        </div>
      </div>
      <div className="bg-g-background-100 py-8 px-[10px] sm:px-[20px] rounded-3xl">
        <div className="flex border-b border-g-gray-300">
          {[
            { key: "personal", label: "Personal Info" },
            { key: "benefits", label: "Benefits" },
            { key: "payment", label: "Payment Method" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`text-[12px] md:text-base px-4 py-2 transition-colors focus-ring-geist ${activeTab === tab.key
                ? "text-primary-navy-blue border-b-2 border-primary-navy-blue font-medium"
                : "text-g-gray-800 hover:text-primary-navy-blue"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ---------- Section Changes on Tab ---------- */}
        {activeTab === "personal" && (
          <div className="border border-g-gray-300 bg-[var(--profile-border)] rounded-2xl px-4 py-6 sm:p-6 relative mt-6">
            <h4 className="font-semibold text-g-gray-1000 mb-4">
              Basic Information
            </h4>
            <button className="absolute top-5 right-5 text-g-blue-700">
              <FiEdit2 />
            </button>

            <div className="grid sm:grid-cols-3 gap-3 text-sm text-g-gray-1000">
              <div>
                <p className="text-g-gray-800">User Name</p>
                <p>{user.userName}</p>
              </div>
              {canSeeEmployeeId && (
                <div>
                  <p className="text-g-gray-800">Employee ID</p>
                  <p>{employeeCode}</p>
                </div>
              )}
              <div>
                <p className="text-g-gray-800">Email Address</p>
                <p className="flex items-center gap-1">{email}</p>
              </div>
              <div>
                <p className="text-g-gray-800">First Name</p>
                <p>{user?.firstName}</p>
              </div>
              <div>
                <p className="text-g-gray-800">Last Name</p>
                <p>{user?.lastName}</p>
              </div>
              <div>
                <p className="text-g-gray-800">Phone Number</p>
                <p className="flex items-center gap-1">{phoneNumber}</p>
              </div>
            </div>
          </div>
        )}
        {activeTab === "benefits" && (
          <div className=" rounded-2xl relative mt-6">

            {employee.benefits && employee.benefits.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 justify-between items-center">
                {employee.benefits.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="border col-span-2 sm:col-span-1 border-g-gray-alpha-400 bg-[var(--profile-border)] text-center rounded-[20px] p-6 w-full md:min-w-[30%]"
                  >
                    <h5 className="font-medium text-g-gray-1000 text-xl  text-[16px] font-[500] leading-[24px] capitalize">
                      {item.benefit?.name || "Unnamed Benefit"}
                    </h5>
                    <div className="flex items-center justify-center text-sm mt-3">
                      {/* <div>
                <p className={`bg-[#F5F5F5] py-[2px] px-[8px] border-1 border-[#597BE80D] border-solid rounded-2xl ${item.active ? "text-green-600" : "text-red-500"}`}>
                  {item.active ? "Active" : "Inactive"}
                </p>
              </div> */}
                      <div className="border-r-1 border-[#597BE84D] pr-[10px]">
                        <p className="bg-[#F5F5F5] py-[2px] px-[8px] border-1 border-[#597BE80D] border-solid rounded-2xl">{item.benefit?.type || "N/A"}</p>
                      </div>
                      <div className="pl-[10px]">
                        <p>{item.benefit?.frequency || "N/A"}</p>
                      </div>
                    </div>
                    <div className="text-center flex items-baseline-last justify-center mt-6">
                      <p className="text-3xl font-[600] leading-[38px]">
                        {item.benefit?.value ? Number(item.benefit.value).toFixed(0) : "N/A"}{" "}
                      </p>
                      <p>
                        {item.benefit?.valueType === "PERCENTAGE" ? "%" : "PKR"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-g-gray-800 text-sm">No benefits assigned yet.</p>
            )}
          </div>
        )}
        {activeTab === "payment" && (
          <div className="border border-g-gray-alpha-400 bg-[var(--profile-border)] rounded-2xl px-4 py-6 sm:p-6 relative mt-6">
            <h4 className="font-semibold text-g-gray-1000 mb-4">Payment Details</h4>
            <div className="grid sm:grid-cols-2 gap-3 text-sm text-g-gray-1000">
              <div>
                <p className="text-g-gray-800">Bank Name</p>
                <p>{bankName}</p>
              </div>
              <div>
                <p className="text-g-gray-800">IBAN</p>
                <p>{iban}</p>
              </div>
              <div>
                <p className="text-g-gray-800">Account Number</p>
                <p>{accountNumber}</p>
              </div>
              <div>
                <p className="text-g-gray-800">Salary</p>
                <p>PKR {Number(employee?.salary || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="grid md:grid-cols-2 gap-4 ">
        {/* Quick Actions */}
        <div className="border border-g-gray-alpha-400 bg-g-background-100 rounded-2xl p-5">
          <h4 className="font-semibold text-g-gray-1000 mb-4">Quick Actions</h4>
          <div className="space-y-3">
            <Button
              className="[&>svg]:w-5 [&>svg]:h-5 justify-start"
              icon={CiMail} label="Update Contact Info" variant="outline" />
            <Button
              className="[&>svg]:w-5 [&>svg]:h-5 justify-start"
              icon={CiLock} label="Change Password" variant="outline" />
          </div>
        </div>

        {/* Leave Balances */}
        <div className="border border-g-gray-alpha-400 rounded-2xl p-5 bg-g-background-100">
          <h4 className="font-semibold text-g-gray-1000 mb-4">Leave Balances</h4>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-1 col-span-2">
              <GoDotFill color="#F04438" size={16} />
              <p className="text-g-gray-800">Sick Leaves</p>
            </div>
            <p className="text-g-gray-1000 text-right">12</p>
            <div className="flex items-center gap-1 col-span-2">
              <GoDotFill color="#F79009" size={16} />
              <p className="text-g-gray-800">Casual Leaves</p>
            </div>
            <p className="text-g-gray-1000 text-right">08</p>
            <div className="flex items-center gap-1 col-span-2">
              <GoDotFill color="#12B76A" size={16} />
              <p className="text-g-gray-800">Annual Leaves</p>
            </div>
            <p className="text-g-gray-1000 text-right">5</p>
          </div>
        </div>
      </div>

      {/* Pay Slip */}
      <div className="border border-g-gray-alpha-400 rounded-2xl p-5 bg-g-background-100">
        <div className="grid  mb-3">
          <div>
            <p className="text-sm text-g-gray-800">
              Last Pay Slip •{" "}
              {new Date().toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </p>
            <p className="text-lg font-semibold text-g-gray-1000">
              PKR {Number(employee?.salary || 0).toLocaleString()}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Button className="[&>svg]:w-5 [&>svg]:h-5" icon={FiEye} label="View" variant="outline" />
            <Button className="[&>svg]:w-5 [&>svg]:h-5" icon={BiSolidDownload} label="Download PDF" variant="secondary" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;
