import DashboardView from "@/components/admin/dashboard";

export const generateMetadata = () => ({
  title: "Dashboard | SmartHR",
  description:
    "Comprehensive HR dashboard showing employee statistics, attendance summaries, and leave application statuses.",
  keywords: [
    "HR dashboard, employee statistics, attendance tracking, leave management",
  ],
});

export default function HRDashboardPage() {
  return (
    <DashboardView />
  );
}
