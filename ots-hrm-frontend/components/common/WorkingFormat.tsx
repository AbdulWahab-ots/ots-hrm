// "use client";

// import React from "react";
// import { Doughnut } from "react-chartjs-2";
// import {
//   Chart as ChartJS,
//   ArcElement,
//   Tooltip,
//   Legend,
//   ChartData,
//   ChartOptions,
// } from "chart.js";
// import { Info } from "lucide-react";

// ChartJS.register(ArcElement, Tooltip, Legend);

// const WorkingFormatChart: React.FC = () => {
//   // Data for the background circle (full semi-transparent circle)
//   const backgroundData: ChartData<"doughnut"> = {
//     labels: ["Background"],
//     datasets: [
//       {
//         data: [100],
//         backgroundColor: ["rgba(255, 255, 255, 0.3)"],
//         borderWidth: 0,
//         borderRadius: 0,
//         spacing: 0,
//       },
//     ],
//   };

//   // Data for the foreground segment (white progress indicator)
//   const foregroundData: ChartData<"doughnut"> = {
//     labels: ["Remote", "Hidden"],
//     datasets: [
//       {
//         data: [40, 60], // 40% visible, 60% transparent
//         backgroundColor: ["#FFFFFF", "rgba(0,0,0,0)"],
//         borderWidth: 0,
//         borderRadius: 50, // Rounded ends
//         spacing: 0,
//       },
//     ],
//   };

//   const options: ChartOptions<"doughnut"> = {
//     responsive: true,
//     cutout: "75%",
//     rotation: -90,
//     circumference: 360,
//     plugins: {
//       legend: {
//         display: false,
//       },
//       tooltip: {
//         enabled: false,
//       },
//     },
//   };

//   return (
//     <div className="w-full max-w-sm p-6 rounded-2xl bg-gradient-to-b from-sky-500 to-emerald-400 text-white shadow-lg">
//       {/* Header */}
//       <div className="flex items-center justify-between mb-6">
//         <h2 className="text-lg font-medium">Working format</h2>
//         <Info size={18} className="opacity-80" />
//       </div>

//       {/* Chart Container */}
//       <div className="flex justify-center items-center">
//         <div className="relative w-40 h-40">
//           {/* Background Chart (Full semi-transparent circle) */}
//           <div className="absolute inset-0">
//             <Doughnut data={backgroundData} options={options} />
//           </div>

//           {/* Foreground Chart (White progress indicator) */}
//           <div className="absolute inset-0">
//             <Doughnut data={foregroundData} options={options} />
//           </div>

//           {/* Center Text */}
//           <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
//             <span className="text-sm font-normal">Remote</span>
//             <span className="text-2xl font-bold">40%</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default WorkingFormatChart;

// "use client";

// import React from "react";
// import { Doughnut } from "react-chartjs-2";
// import {
//   Chart as ChartJS,
//   ArcElement,
//   Tooltip,
//   Legend,
//   ChartData,
//   ChartOptions,
// } from "chart.js";
// import { Info } from "lucide-react";
// import HeaderWithTooltip from "@/components/common/Typography/HeaderWithTooltip";

// ChartJS.register(ArcElement, Tooltip, Legend);
// interface WorkingFormatChartProps {
//   role?: string; // 'employee' or 'admin'
// }

// const WorkingFormatChart: React.FC<WorkingFormatChartProps> = ({ role }) => {
//   // Data for the background circle (full semi-transparent circle)
//    const isEmployee = role === "employee";
//   const backgroundData: ChartData<"doughnut"> = {
//     labels: ["Background"],
//     datasets: [
//       {
//         data: [100],
//         backgroundColor: [
//           isEmployee ? "#E5E7EB" : "rgba(255, 255, 255, 0.3)",
//         ],
//         borderWidth: 0,
//         borderRadius: 0,
//         spacing: 0,
//       },
//     ],
//   };

//   // Data for the foreground segment (white progress indicator)
//   const foregroundData: ChartData<"doughnut"> = {
//     labels: ["Remote", "Hidden"],
//     datasets: [
//       {
//         data: [40, 60], // 40% visible, 60% transparent
//         backgroundColor: [
//           isEmployee ? "#3961E4" : "#FFFFFF", // Blue for employee, white for admin
//           isEmployee ? "#E5E7EB" : "rgba(0,0,0,0)", // Gray for employee, transparent for admin
//         ],
//         borderWidth: 0,
//         borderRadius: 50, // Rounded ends
//         spacing: 0,
//       },
//     ],
//   };

//   const options: ChartOptions<"doughnut"> = {
//     responsive: true,
//     cutout: "75%",
//     rotation: -90,
//     circumference: 360,
//     plugins: {
//       legend: {
//         display: false,
//       },
//       tooltip: {
//         enabled: false,
//       },
//     },
//     maintainAspectRatio: false, // Important for proper sizing
//   };

//   return (
//     <div
//       className="w-full xl:col-span-3  p-6 rounded-3xl border-[#597BE84D] border-[1px] text-white shadow-lg"
//       style={{
//         background: "linear-gradient(135deg, #0097FE 0%, #27C6A0 100%)",
//       }}
//     >
//       {/* Header */}
//       <HeaderWithTooltip
//         title="Working format"
//         tooltipContent="Daily Working format "
//         whiteText={true}
//       />
//       {/* Chart Container */}
//       <div className="flex h-full justify-center items-center">
//         <div className="relative w-56 h-56">
//           <div className="absolute inset-0">
//             <Doughnut data={backgroundData} options={options} />
//           </div>
//           {/* Foreground Chart (White progress indicator) */}
//           <div className="absolute inset-0">
//             <Doughnut data={foregroundData} options={options} />
//           </div>
//           {/* Center Text - properly centered */}
//           <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
//             <span className="text-sm text-[#F2F7FA] font-medium">Remote</span>
//             <span className="lg:text-[33.75px] font-semibold ">40%</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default WorkingFormatChart;


"use client";

import React from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from "chart.js";
import HeaderWithTooltip from "@/components/common/Typography/HeaderWithTooltip";
import { GoDotFill } from "react-icons/go";

ChartJS.register(ArcElement, Tooltip, Legend);

interface WorkingFormatChartProps {
  role?: string; // 'employee' or 'admin'
}

const WorkingFormatChart: React.FC<WorkingFormatChartProps> = ({ role }) => {
  const isEmployee = role === "employee";

  // Background circle
  const backgroundData: ChartData<"doughnut"> = {
    labels: ["Background"],
    datasets: [
      {
        data: [100],
        backgroundColor: [
          isEmployee ? "var(--g-gray-300)" : "rgba(255, 255, 255, 0.3)",
        ],
        borderWidth: 0,
        borderRadius: 0,
        spacing: 0,
      },
    ],
  };

  // Foreground donut
  const foregroundData: ChartData<"doughnut"> = {
    labels: [isEmployee ? "Onsite" : "Remote", "Hidden"],
    datasets: [
      {
        data: [40,60],
        backgroundColor: [
          isEmployee ? "var(--g-blue-700)" : "#FFFFFF", // Blue for employee, white for admin
          isEmployee ? "var(--g-gray-300)" : "rgba(0,0,0,0)", // Gray for employee, transparent for admin
        ],
        borderWidth: 0,
        borderRadius: 50,
        spacing: 0,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    cutout: "75%",
    rotation: -20,
    circumference: 360,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    maintainAspectRatio: false,
  };
  return (
    <div
      className={`w-full xl:col-span-2 p-4  rounded-[var(--g-radius-lg)] border border-[var(--border-light)] shadow-geist-card flex flex-col items-center gap-16 overflow-hidden ${
        isEmployee ? "bg-g-background-100 text-g-gray-1000" : "text-white"
      }`}
      style={
        isEmployee
          ? {}
          : { background: "linear-gradient(135deg, var(--g-blue-700) 0%, var(--g-teal-700) 100%)" }
      }
    >
      {/* Header */}
      <HeaderWithTooltip
        title="Working format"
        tooltipContent="Daily Working format"
        whiteText={!isEmployee}
      />

      {/* Donut + labels grouped vertically */}
      <div className="flex flex-col items-center justify-center gap-20 w-full mt-4">
        {/* Donut Chart */}
        <div className="relative w-38 h-38">
          {/* Background ring */}
          <div className="absolute inset-0">
            <Doughnut data={backgroundData} options={options} />
          </div>

          {/* Foreground donut */}
          <div className="absolute inset-0">
            <Doughnut data={foregroundData} options={options} />
          </div>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span
              className={`text-label-14 font-medium ${
                isEmployee ? "text-[--text-light]" : "text-[var(--General-Surface-Primary)]"
              }`}
            >
              {isEmployee ? "" : "Remote"}
            </span>
            <span className="lg:text-[33.75px] font-semibold">40%</span>
          </div>
        </div>

        {/* Onsite / Remote labels */}
        {isEmployee &&(
          <div className="flex justify-center gap-8 mt-6">
          <div className="flex items-center justify-center gap-1">
            <GoDotFill size={15} className="text-g-blue-200"/>
          <span className="text-label-14 font-medium ">Remote</span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <GoDotFill size={15} className="text-[var(--primary-blue-400)]"/>
          <span className="text-label-14 font-medium text-[var(--text-light)]">Onsite</span>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default WorkingFormatChart;

