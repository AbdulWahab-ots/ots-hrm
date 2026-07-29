import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function checkSession(request: NextRequest) {
    const userCookie = request.cookies.get("user")?.value;
    const url = request.nextUrl;
    if (!userCookie) {
        // If user not logged in and trying to access /admin, redirect to /sign-in
        if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/employee") || url.pathname.startsWith("/superadmin")) {
            return NextResponse.redirect(new URL("/sign-in", request.url));
        }
    } else {
        const user = JSON.parse(userCookie);

        // If user is companyAdmin, redirect from any admin route except dashboard
        if (user?.result?.role?.code === "admin" && !url.pathname.startsWith("/admin")) {
            return NextResponse.redirect(new URL("/admin/dashboard", request.url));
        }

        // If user is companyAdmin, redirect from any admin route except dashboard
        if (user?.result?.role?.code === "employee" && !url.pathname.startsWith("/employee")) {
            return NextResponse.redirect(new URL("/employee/dashboard", request.url));
        }

        // If user is superAdmin, redirect from any admin route except dashboard
        if (user?.result?.role?.code === "superAdmin" && !url.pathname.startsWith("/superadmin")) {
            return NextResponse.redirect(new URL("/superadmin/dashboard", request.url));
        }
    }

    return NextResponse.next();
}
