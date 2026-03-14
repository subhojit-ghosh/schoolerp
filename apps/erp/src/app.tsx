import { useEffect, useState } from "react";
import type { TenantBranding } from "@repo/contracts";
import { createBrowserRouter, Navigate } from "react-router";
import { RouterProvider } from "react-router/dom";
import { DashboardLayout } from "@/components/dashboard-layout";
import { RouteErrorBoundary } from "@/components/route-error-boundary";
import { RequireSession } from "@/features/auth/ui/require-session";
import { AttendancePage } from "@/routes/attendance-page";
import { ERP_ROUTES, ERP_ROUTE_SEGMENTS } from "@/constants/routes";
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
import { FeesPage } from "@/routes/fees-page";
import { BrandingPage } from "@/routes/settings/branding-page";
import { CampusesPage } from "@/routes/settings/campuses-page";
import { ClassesPage } from "@/routes/classes-page";
import { GuardianDetailPage } from "@/routes/guardian-detail-page";
import { GuardiansPage } from "@/routes/guardians-page";
import { StaffCreatePage } from "@/routes/staff-create-page";
import { StaffDetailPage } from "@/routes/staff-detail-page";
import { StaffPage } from "@/routes/staff-page";
import { StudentCreatePage } from "@/routes/student-create-page";
import { StudentDetailPage } from "@/routes/student-detail-page";
import { StudentsPage } from "@/routes/students-page";
import { AcademicYearSheetRoute } from "@/features/academic-years/ui/academic-year-sheet-route";
import { CampusSheetRoute } from "@/features/campuses/ui/campus-sheet-route";
import { ClassSheetRoute } from "@/features/classes/ui/class-sheet-route";

import { Button } from "@repo/ui/components/ui/button";

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
      { path: ERP_ROUTES.STUDENT_CREATE, element: <StudentCreatePage /> },
      { path: ERP_ROUTES.STUDENT_DETAIL, element: <StudentDetailPage /> },
      { path: ERP_ROUTES.GUARDIANS, element: <GuardiansPage /> },
      { path: ERP_ROUTES.GUARDIAN_DETAIL, element: <GuardianDetailPage /> },
      { path: ERP_ROUTES.STAFF, element: <StaffPage /> },
      { path: ERP_ROUTES.STAFF_CREATE, element: <StaffCreatePage /> },
      { path: ERP_ROUTES.STAFF_DETAIL, element: <StaffDetailPage /> },
      {
        path: ERP_ROUTES.ACADEMIC_YEARS,
        element: <AcademicYearsPage />,
        children: [
          {
            path: ERP_ROUTE_SEGMENTS.NEW,
            element: <AcademicYearSheetRoute mode="create" />,
          },
          {
            path: `:academicYearId/${ERP_ROUTE_SEGMENTS.EDIT}`,
            element: <AcademicYearSheetRoute mode="edit" />,
          },
        ],
      },
      {
        path: ERP_ROUTES.CLASSES,
        element: <ClassesPage />,
        children: [
          {
            path: ERP_ROUTE_SEGMENTS.NEW,
            element: <ClassSheetRoute mode="create" />,
          },
          {
            path: `:classId/${ERP_ROUTE_SEGMENTS.EDIT}`,
            element: <ClassSheetRoute mode="edit" />,
          },
        ],
      },
      { path: ERP_ROUTES.ATTENDANCE, element: <AttendancePage /> },
      { path: ERP_ROUTES.EXAMS, element: <ExamsPage /> },
      { path: ERP_ROUTES.FEES, element: <FeesPage /> },
      {
        path: ERP_ROUTES.SETTINGS_CAMPUSES,
        element: <CampusesPage />,
        children: [
          {
            path: ERP_ROUTE_SEGMENTS.NEW,
            element: <CampusSheetRoute />,
          },
        ],
      },
      { path: ERP_ROUTES.SETTINGS_BRANDING, element: <BrandingPage /> },
    ],
  },
]);

export function App() {
  const [branding, setBranding] = useState<TenantBranding | null>(() =>
    readCachedTenantBranding(),
  );
  const [tenantNotFound, setTenantNotFound] = useState(false);

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
        if (
          !isCancelled &&
          error instanceof Error &&
          error.message === "TENANT_NOT_FOUND"
        ) {
          setTenantNotFound(true);
        }
      }
    }

    void bootstrap();

    return () => {
      isCancelled = true;
    };
  }, []);

  if (tenantNotFound) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-background p-6">
        <div className="flex max-w-md flex-col items-center text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted">
            <svg
              className="size-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m15 9-6 6" />
              <path d="m9 9 6 6" />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
            Organization Not Found
          </h1>
          <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
            We couldn't find an organization matching this URL. It might have
            been typed incorrectly or the organization has been removed.
          </p>
          <Button
            asChild
            className="h-11 rounded-xl px-8 shadow-sm"
            style={{
              backgroundColor: "#18181b",
              color: "#fafafa",
            }}
          >
            <a href={buildRootAppUrl()}>Go to main platform</a>
          </Button>
        </div>
      </div>
    );
  }

  return <RouterProvider router={router} />;
}
