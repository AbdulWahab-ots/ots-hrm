"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Bell } from "lucide-react";
import { AppDispatch } from "@/store/store";
import { fetchPayrolls } from "@/services/payrollService";
import { nowBusiness } from "@/utils/timezone";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function PayrollStatus() {
  const dispatch = useDispatch<AppDispatch>();
  const [pendingAmount, setPendingAmount] = useState(0);
  const [employeesLeft, setEmployeesLeft] = useState(0);
  const [paidCount, setPaidCount] = useState(0);

  useEffect(() => {
    const fetchStatus = async () => {
      const now = nowBusiness();
      try {
        const res: any = await fetchPayrolls(dispatch, {
          page: 1,
          pageSize: 1000,
          payrollYear: now.getFullYear(),
          payrollMonth: now.getMonth() + 1,
        });
        const records: any[] = res?.result?.data ?? [];

        const paid = records.filter((p) => p.status === "PAID");
        const notPaid = records.filter((p) => p.status !== "PAID");

        setPaidCount(paid.length);
        setEmployeesLeft(notPaid.length);
        setPendingAmount(
          notPaid.reduce((sum, p) => sum + (Number(p.netSalary) || 0), 0)
        );
      } catch (error) {
        console.error("Failed to fetch payroll status:", error);
      }
    };
    fetchStatus();
  }, [dispatch]);

  const total = paidCount + employeesLeft;
  const data = {
    datasets: [
      {
        data: total > 0 ? [paidCount, employeesLeft] : [1],
        backgroundColor: total > 0 ? ["#006bff", "#fc0035"] : ["#e5e7eb"],
        borderWidth: 8,
        borderColor: "#ffffff",
        borderRadius: 8,
      },
    ],
  };

  const options = {
    rotation: -90,
    circumference: 180,
    cutout: "70%",
    maintainAspectRatio: false, // Prevent automatic height=width
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
  } as const;

  return (
    <div className="lg:col-span-2 col-span-1 flex flex-col justify-between w-full border-[1px] p-4 border-g-gray-alpha-400 rounded-[var(--g-radius-md)] shadow-geist-card bg-g-background-100">
      <h2 className="text-g-gray-900 text-heading-20">
        Payroll Status
      </h2>
      <div className="relative flex justify-center">
        <div className="flex max-w-[450px] w-full justify-center">
          <Doughnut
            data={data}
            options={options}
            className="lg:w-[360px] w-[300px]"
            height={185}
          />
        </div>
        <div className="absolute top-1/2 pt-6 left-1/2 transform -translate-x-1/2 -translate-y-1 text-center">
          <p className="xl:text-[25px] lg:text-[16px] md:text-[25px] text-[27px]  font-semibold text-g-red-700">
            Rs.{pendingAmount.toLocaleString()}
          </p>
          <p className="text-xs font-medium text-g-gray-800">Pending Amount</p>
        </div>
      </div>
      <div className="p-2 flex items-center gap-2 rounded-[var(--g-radius-full)] border-[1px] border-g-gray-alpha-400">
        <div className="p-2 rounded-full bg-g-red-100 border-[1px] border-g-red-200">
          <Bell className="w-4 h-4 text-g-red-700" />
        </div>
        <p className="text-g-gray-900 font-medium text-xs">
          {employeesLeft} employees are left to be paid
        </p>
      </div>
    </div>
  );
}
