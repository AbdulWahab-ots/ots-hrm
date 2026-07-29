import EmployeeDetailsView from "@/components/admin/employees/details";

export const generateMetadata = () => ({
  title: "Employee Details | SmartHR",
  description: "View and manage an employee's profile and record.",
});

export default function EmployeeDetailsPage() {
  return <EmployeeDetailsView />;
}
