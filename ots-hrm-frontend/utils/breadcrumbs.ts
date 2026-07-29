/* ==========================================================================
   Breadcrumbs — derive a clickable trail from the current pathname.
   `routeLabels` maps real, navigable page paths to human labels; a path
   present here is treated as a link, anything else (index-less parents,
   dynamic ids) renders as plain text so we never emit a broken link.
   ========================================================================== */

export type Crumb = {
  label: string;
  href: string;
  /** true → render as a Link; false → plain text (current page or non-page) */
  isLink: boolean;
};

export const routeLabels: Record<string, string> = {
  // ---- Admin ----
  "/admin/dashboard": "Dashboard",
  "/admin/employees": "Employees",
  "/admin/employees/details": "Employee Details",
  "/admin/leaves": "Leaves",
  "/admin/attendance-report": "Attendance Records",
  "/admin/requests": "Attendance Requests",
  "/admin/performance-indicator": "Performance",
  "/admin/paystub": "PayStub",
  "/admin/departments": "Departments",
  "/admin/designations": "Designations",
  "/admin/shifts": "Shifts",
  "/admin/benefits": "Benefits",
  "/admin/holidays": "Holidays",
  "/admin/leaves-type": "Leave Types",
  "/admin/users": "Users",
  "/admin/users/add": "Add User",
  "/admin/users/roles": "Roles",
  "/admin/users/roles/add": "Add Role",
  "/admin/users/permissions": "Permissions",
  "/admin/alerts/announcements": "Announcements",
  "/admin/alerts/leave-updates": "Leave Updates",
  "/admin/alerts/check-in-out-reminders": "Check-In/Out Reminders",
  "/admin/alerts/payslip-notifications": "Payslip Notifications",
  "/admin/reports/attendance": "Attendance Report",
  "/admin/reports/leave": "Leave Report",
  "/admin/reports/employee": "Employee Report",
  "/admin/reports/payroll": "Payroll Report",
  "/admin/profile": "Profile",
  "/admin/onboarding": "Onboarding",

  // ---- Employee ----
  "/employee/dashboard": "Dashboard",
  "/employee/announcements": "Announcements",
  "/employee/attendance": "Attendance",
  "/employee/attendance-request": "Attendance Requests",
  "/employee/leaves": "Leaves",
  "/employee/paystub": "Paystub",

  // ---- Super Admin ----
  "/superadmin/dashboard": "Dashboard",
  "/superadmin/companies": "Companies",
};

const roleHome: Record<string, string> = {
  admin: "Home",
  employee: "Home",
  superadmin: "Home",
};

const humanize = (segment: string) =>
  segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export function buildBreadcrumbs(pathname: string): Crumb[] {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return [];

  const role = parts[0];
  const home = roleHome[role];
  const dashboardHref = `/${role}/dashboard`;

  const crumbs: Crumb[] = [];
  if (home) {
    crumbs.push({ label: home, href: dashboardHref, isLink: true });
  }

  let acc = `/${role}`;
  for (let i = 1; i < parts.length; i++) {
    acc += `/${parts[i]}`;
    // The home crumb already covers the dashboard.
    if (acc === dashboardHref) continue;

    const known = routeLabels[acc];
    const isLast = i === parts.length - 1;
    crumbs.push({
      label: known ?? humanize(parts[i]),
      href: acc,
      isLink: !isLast && Boolean(known),
    });
  }

  return crumbs;
}
