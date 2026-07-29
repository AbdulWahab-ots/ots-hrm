// app/employee/dashboard/page.tsx
import EmployeeDashboard from '@/components/employee/dashboard';

export const generateMetadata = () => ({
  title: "Dashboard | SmartHR",
  description: "Your personalized workplace hub showing attendance metrics, leave balances, and important notifications.",
  keywords: [
    "employee dashboard",
    "workplace portal",
    "attendance tracking",
    "leave balance",
    "employee self-service"
  ]
});

export default function DashboardPage() {
  return (
    <EmployeeDashboard />
  );
}