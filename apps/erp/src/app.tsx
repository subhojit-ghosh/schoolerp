import { useEffect, useMemo, useState } from "react";
import type { TenantBranding } from "@academic-platform/contracts";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { RequireSession } from "@/features/auth/ui/require-session";
import { fetchHealth, fetchTenantBranding } from "@/lib/api";
import {
  applyTenantBranding,
  cacheTenantBranding,
  readCachedTenantBranding,
} from "@/lib/tenant-branding";
import { DashboardPage } from "@/routes/dashboard-page";
import { ForgotPasswordPage } from "@/routes/forgot-password-page";
import { HomePage } from "@/routes/home-page";
import { ResetPasswordPage } from "@/routes/reset-password-page";
import { SignInPage } from "@/routes/sign-in-page";
import { SignUpPage } from "@/routes/sign-up-page";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "sign-in", element: <SignInPage /> },
      { path: "sign-up", element: <SignUpPage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "reset-password", element: <ResetPasswordPage /> },
      {
        path: "dashboard",
        element: (
          <RequireSession>
            <DashboardPage />
          </RequireSession>
        ),
      },
    ],
  },
]);

export function App() {
  const [branding, setBranding] = useState<TenantBranding | null>(() => readCachedTenantBranding());
  const [status, setStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (branding) {
      applyTenantBranding(branding);
    }
  }, [branding]);

  useEffect(() => {
    let isCancelled = false;

    async function bootstrap() {
      try {
        const [brandingPayload, healthPayload] = await Promise.all([
          fetchTenantBranding(),
          fetchHealth(),
        ]);

        if (isCancelled) {
          return;
        }

        setBranding(brandingPayload);
        cacheTenantBranding(brandingPayload);
        applyTenantBranding(brandingPayload);
        setStatus(healthPayload.status);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "Failed to bootstrap ERP shell.");
        setStatus("error");
      }
    }

    void bootstrap();

    return () => {
      isCancelled = true;
    };
  }, []);

  const footerMessage = useMemo(() => {
    if (status === "loading") {
      return "Connecting to api-erp and applying tenant branding...";
    }

    if (status === "error") {
      return errorMessage ?? "Bootstrap failed.";
    }

    return `api-erp status: ${status}`;
  }, [errorMessage, status]);

  return (
    <>
      <RouterProvider router={router} />
      <div className="pointer-events-none fixed bottom-4 right-4 hidden w-80 lg:block">
        <Card className="pointer-events-auto bg-white/85 p-4 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Bootstrap Status</p>
          <p className="mt-2 text-sm text-foreground">{footerMessage}</p>
        </Card>
      </div>
    </>
  );
}
