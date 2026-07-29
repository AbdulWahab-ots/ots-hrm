// app/(auth-pages)/layout.tsx
"use client";
import React from "react";
import { usePathname } from "next/navigation";
import AuthLayout from "@/components/layouts/AuthLayout";
import AuthLayoutContent from "@/components/auth/AuthLayoutContent";

export default function AuthPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSignIn = pathname === "/sign-in";

  return (
    <AuthLayout
      leftContent={
        isSignIn ? undefined : (
          <AuthLayoutContent
            title="Igniting Employee Potential"
            description="Efficiently manage your workforce, streamline operations effectively."
          />
        )
      }
    >
      {children}
    </AuthLayout>
  );
}
