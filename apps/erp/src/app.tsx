import { useEffect, useState } from "react";
import type { TenantBranding } from "@repo/contracts";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard-layout";
import { RequireSession } from "@/features/auth/ui/require-session";
import { fetchTenantBranding } from "@/lib/api";
import {
  applyTenantBranding,
  cacheTenantBranding,
  readCachedTenantBranding,
} from "@/lib/tenant-branding";
import { DashboardPage } from "@/routes/dashboard-page";
import { ForgotPasswordPage } from "@/routes/forgot-password-page";
import { ResetPasswordPage } from "@/routes/reset-password-page";
import { SignInPage } from "@/routes/sign-in-page";
import { SignUpPage } from "@/routes/sign-up-page";
import { StudentsPage } from "@/routes/students-page";

const router = createBrowserRouter([
  { path: "/", element: <Navigate replace to="/sign-in" /> },
  { path: "/sign-in", element: <SignInPage /> },
  { path: "/sign-up", element: <SignUpPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  {
    element: (
      <RequireSession>
        <DashboardLayout />
      </RequireSession>
    ),
    children: [
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/students", element: <StudentsPage /> },
    ],
  },
]);

export function App() {
  const [branding, setBranding] = useState<TenantBranding | null>(() =>
    readCachedTenantBranding(),
  );

  useEffect(() => {
    if (branding) {
      applyTenantBranding(branding);
    }
  }, [branding]);

  useEffect(() => {
    let isCancelled = false;

    async function bootstrap() {
      try {
        const brandingPayload = await fetchTenantBranding();

        if (isCancelled) {
          return;
        }

        setBranding(brandingPayload);
        cacheTenantBranding(brandingPayload);
        applyTenantBranding(brandingPayload);
      } catch (error) {
        void error;
      }
    }

    void bootstrap();

    return () => {
      isCancelled = true;
    };
  }, []);

  return <RouterProvider router={router} />;
}
