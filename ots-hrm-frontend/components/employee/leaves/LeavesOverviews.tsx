// "use client";

// import React from "react";
// import Image from "next/image";

// import Casual from "../../../public/Casual-Icon.svg";
// import Annual from "../../../public/Annual-icon.svg";
// import Sick from "../../../public/Sick-Icon.svg";

// interface LeaveCardProps {
//   title: string;
//   count: number;
//   icon: any;
//   bgColor?: string;
// }

// const LeaveCard: React.FC<LeaveCardProps> = ({
//   title,
//   count,
//   icon,
//   bgColor,
// }) => {
//   return (
//     <div
//       className="flex flex-col items-center justify-between rounded-2xl border"
//       style={{
//         height: "398px",
//         borderColor: "#597BE84D",
//         backgroundColor: bgColor || "#FFFFFF",
//         padding: "24px",
//       }}
//     >
//       {/* Title */}
//       <div className="w-full text-left text-sm font-medium text-gray-700">
//         {title}
//       </div>

//       {/* Icon */}
//       <div className="flex flex-1 items-center justify-center">
//         <Image src={icon} alt={title} width={120} height={120} />
//       </div>

//       {/* Count */}
//       <div className="flex items-baseline gap-1">
//         <span
//           className={`text-4xl font-bold ${
//             bgColor === "#F97066" ? "text-white" : "text-black"
//           }`}
//         >
//           {count}
//         </span>
//         <span
//           className={`text-sm ${
//             bgColor === "#F97066" ? "text-white" : "text-gray-600"
//           }`}
//         >
//           Left
//         </span>
//       </div>
//     </div>
//   );
// };

// const LeavesOverviews = () => {
//   const leaveData = [
//     {
//       title: "Casual Leaves",
//       count: 3,
//       icon: Casual,
//       bgColor: "#F97066",
//     },
//     {
//       title: "Sick Leaves",
//       count: 5,
//       icon: Sick,
//       bgColor: "#FFFFFF",
//     },
//     {
//       title: "Annual Leaves",
//       count: 12,
//       icon: Annual,
//       bgColor: "#FFFFFF",
//     },
//   ];

//   return (
//     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//       {leaveData.map((leave, idx) => (
//         <LeaveCard
//           key={idx}
//           title={leave.title}
//           count={leave.count}
//           icon={leave.icon}
//           bgColor={leave.bgColor}
//         />
//       ))}
//     </div>
//   );
// };

// export default LeavesOverviews;
"use client";

import React from "react";
import Image from "next/image";

import Casual from "../../../public/Casual-Icon.svg";
import Annual from "../../../public/Annual-icon.svg";
import Sick from "../../../public/Sick-Icon.svg";

interface LeaveCardProps {
  title: string;
  count: number;
  icon: any;
  bgColor?: string;
}

const LeaveCard: React.FC<LeaveCardProps> = ({
  title,
  count,
  icon,
  bgColor,
}) => {
  const isPrimary = bgColor === "#F97066"; // first card special style

  return (
    <div
      className={`flex flex-col rounded-[var(--g-radius-md)] border shadow-geist-card ${isPrimary ? "bg-g-red-700 border-g-red-700" : "bg-g-background-100 border-g-gray-alpha-400"
        }`}
      style={{
        height: "",
        padding: "24px",
      }}
    >
      {/* Title */}
      <div
        className={`text-[16px] font-medium leading-6 tracking-[-0.02em] ${isPrimary ? "text-white" : "text-g-gray-900"
          }`}
      >
        {title}
      </div>

      {/* Icon (center vertically) */}
      <div className="flex flex-1 items-center justify-center">
        <Image src={icon} alt={title} width={120} height={120} />
      </div>

      {/* Count & Left text (bottom-left) */}
      <div className="flex items-center  gap-2">
        <span
          className={`font-semibold text-[60px] leading-[72px] ${isPrimary ? "text-white" : "text-g-gray-1000"
            }`}
        >
          {count}
        </span>
        <span
          className={`${isPrimary ? "text-white" : "text-g-gray-800"
            } text-base font-medium`}
        >
          Left
        </span>
      </div>
    </div>
  );
};

const LeavesOverviews = () => {
  const leaveData = [
    {
      title: "Casual Leaves",
      count: 3,
      icon: Casual,
      bgColor: "#F97066",
    },
    {
      title: "Sick Leaves",
      count: 5,
      icon: Sick,
      bgColor: "#FFFFFF",
    },
    {
      title: "Annual Leaves",
      count: 12,
      icon: Annual,
      bgColor: "#FFFFFF",
    },
  ];

  return (
    <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {leaveData.map((leave, idx) => (
        <LeaveCard
          key={idx}
          title={leave.title}
          count={leave.count}
          icon={leave.icon}
          bgColor={leave.bgColor}
        />
      ))}
    </div>
  );
};

export default LeavesOverviews;
