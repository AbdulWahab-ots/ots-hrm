// frontend/app/employee/paystub/page.tsx
import EmployeePayslips from "@/components/employee/paystub/EmployeePayslips";

export const generateMetadata = () => ({
  title: "My Payslips | SmartHR",
  description: "View your salary slips.",
});

export default function Page() {
  return <EmployeePayslips />;
}
