import { useEffect, useState } from "react";
import type { TenantBranding } from "@repo/contracts";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard-layout";
import { RouteErrorBoundary } from "@/components/route-error-boundary";
import { RequireSession } from "@/features/auth/ui/require-session";
import { AttendancePage } from "@/routes/attendance-page";
import { ERP_ROUTES } from "@/constants/routes";
import { fetchTenantBranding } from "@/lib/api";
import {
  applyTenantBranding,
  cacheTenantBranding,
  readCachedTenantBranding,
} from "@/lib/tenant-branding";
import {
  buildRootAppUrl,
  getCurrentTenantSlug,
  isRootHostname,
} from "@/lib/tenant-context";
import { DashboardPage } from "@/routes/dashboard-page";
import { ExamsPage } from "@/routes/exams-page";
import { ForgotPasswordPage } from "@/routes/forgot-password-page";
import { ResetPasswordPage } from "@/routes/reset-password-page";
import { SignInPage } from "@/routes/sign-in-page";
import { AcademicYearsPage } from "@/routes/academic-years-page";
import { BrandingPage } from "@/routes/settings/branding-page";
import { ClassDetailPage } from "@/routes/class-detail-page";
import { ClassesPage } from "@/routes/classes-page";
import { GuardianDetailPage } from "@/routes/guardian-detail-page";
import { GuardiansPage } from "@/routes/guardians-page";
import { StaffDetailPage } from "@/routes/staff-detail-page";
import { StaffPage } from "@/routes/staff-page";
import { StudentDetailPage } from "@/routes/student-detail-page";
import { StudentsPage } from "@/routes/students-page";

const router = createBrowserRouter([
  {
    path: ERP_ROUTES.ROOT,
    element: <Navigate replace to={ERP_ROUTES.SIGN_IN} />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: ERP_ROUTES.SIGN_IN,
    element: <SignInPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: ERP_ROUTES.FORGOT_PASSWORD,
    element: <ForgotPasswordPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: ERP_ROUTES.RESET_PASSWORD,
    element: <ResetPasswordPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    element: (
      <RequireSession>
        <DashboardLayout />
      </RequireSession>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: ERP_ROUTES.DASHBOARD, element: <DashboardPage /> },
      { path: ERP_ROUTES.STUDENTS, element: <StudentsPage /> },
      { path: ERP_ROUTES.STUDENT_DETAIL, element: <StudentDetailPage /> },
      { path: ERP_ROUTES.GUARDIANS, element: <GuardiansPage /> },
      { path: ERP_ROUTES.GUARDIAN_DETAIL, element: <GuardianDetailPage /> },
      { path: ERP_ROUTES.STAFF, element: <StaffPage /> },
      { path: ERP_ROUTES.STAFF_DETAIL, element: <StaffDetailPage /> },
      { path: ERP_ROUTES.ACADEMIC_YEARS, element: <AcademicYearsPage /> },
      { path: ERP_ROUTES.CLASSES, element: <ClassesPage /> },
      { path: ERP_ROUTES.CLASS_DETAIL, element: <ClassDetailPage /> },
      { path: ERP_ROUTES.ATTENDANCE, element: <AttendancePage /> },
      { path: ERP_ROUTES.EXAMS, element: <ExamsPage /> },
      { path: ERP_ROUTES.CLASSES, element: <ClassesPage /> },
      { path: ERP_ROUTES.CLASS_DETAIL, element: <ClassDetailPage /> },
      { path: ERP_ROUTES.ATTENDANCE, element: <AttendancePage /> },
      { path: ERP_ROUTES.SETTINGS_BRANDING, element: <BrandingPage /> },
    ],
  },
]);

export function App() {
  const [branding, setBranding] = useState<TenantBranding | null>(() =>
    readCachedTenantBranding(),
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!getCurrentTenantSlug() && isRootHostname(window.location.hostname)) {
      window.location.replace(buildRootAppUrl());
    }
  }, []);

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
