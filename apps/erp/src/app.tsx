import { useEffect, useState } from "react";
import {
  buildRootAppUrl,
  getCurrentTenantSlug,
  isRootHostname,
  type TenantBranding,
} from "@repo/contracts";
import { createBrowserRouter, Navigate } from "react-router";
import { RouterProvider } from "react-router/dom";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { RouteErrorBoundary } from "@/components/feedback/route-error-boundary";
import { RedirectIfAuthenticated } from "@/features/auth/ui/redirect-if-authenticated";
import { RequireSession } from "@/features/auth/ui/require-session";
import { AttendancePage } from "@/routes/operations/attendance-page";
import { ERP_ROUTES, ERP_ROUTE_SEGMENTS } from "@/constants/routes";
import { fetchTenantBranding } from "@/lib/api";
import {
  applyTenantBranding,
  cacheTenantBranding,
  readCachedTenantBranding,
} from "@/lib/tenant-branding";
import { DashboardPage } from "@/routes/dashboard/dashboard-page";
import { ExamsPage } from "@/routes/operations/exams-page";
import { ForgotPasswordPage } from "@/routes/auth/forgot-password-page";
import { ResetPasswordPage } from "@/routes/auth/reset-password-page";
import { SignInPage } from "@/routes/auth/sign-in-page";
import { AcademicYearsPage } from "@/routes/academics/academic-years-page";
import { FeeStructuresPage } from "@/routes/operations/fee-structures-page";
import { FeeAssignmentsPage } from "@/routes/operations/fee-assignments-page";
import { FeeDuesPage } from "@/routes/operations/fee-dues-page";
import { FeeReportsPage } from "@/routes/operations/fee-reports-page";
import { FeeStructureFormPage } from "@/routes/operations/fee-structure-form-page";
import { FeeAssignmentSheetRoute } from "@/features/fees/ui/fee-assignment-sheet-route";
import { CollectPaymentSheetRoute } from "@/features/fees/ui/collect-payment-sheet-route";
import { BulkFeeAssignmentSheetRoute } from "@/features/fees/ui/bulk-fee-assignment-sheet-route";
import { FeeAdjustmentSheetRoute } from "@/features/fees/ui/fee-adjustment-sheet-route";
import { BrandingPage } from "@/routes/settings/branding-page";
import { AdmissionFormFieldsPage } from "@/routes/settings/admission-form-fields-page";
import { AuditPage } from "@/routes/settings/audit-page";
import { CampusesPage } from "@/routes/settings/campuses-page";
import { RolesPage } from "@/routes/settings/roles-page";
import { ClassesPage } from "@/routes/academics/classes-page";
import { SubjectsPage } from "@/routes/academics/subjects-page";
import { TimetablePage } from "@/routes/academics/timetable-page";
import { CalendarPage } from "@/routes/academics/calendar-page";
import { StudentRolloverPage } from "@/routes/academics/student-rollover-page";
import { GuardianDetailPage } from "@/routes/people/guardian-detail-page";
import { GuardiansPage } from "@/routes/people/guardians-page";
import { AdmissionApplicationsPage } from "@/routes/admissions/admission-applications-page";
import { AdmissionEnquiriesPage } from "@/routes/admissions/admission-enquiries-page";
import { NotificationsPage } from "@/routes/notifications/notifications-page";
import { AnnouncementsPage } from "@/routes/communications/announcements-page";
import { StaffCreatePage } from "@/routes/people/staff-create-page";
import { StaffDetailPage } from "@/routes/people/staff-detail-page";
import { StaffPage } from "@/routes/people/staff-page";
import { StudentCreatePage } from "@/routes/people/student-create-page";
import { StudentDetailPage } from "@/routes/people/student-detail-page";
import { StudentsPage } from "@/routes/people/students-page";
import { AcademicYearSheetRoute } from "@/features/academic-years/ui/academic-year-sheet-route";
import { CampusSheetRoute } from "@/features/campuses/ui/campus-sheet-route";
import { ClassSheetRoute } from "@/features/classes/ui/class-sheet-route";
import { RoleSheetRoute } from "@/features/roles/ui/role-sheet-route";
import { AttendanceReportsPage } from "@/routes/reports/attendance-report-page";
import { AdmissionApplicationSheetRoute } from "@/features/admissions/ui/admission-application-sheet-route";
import { AdmissionEnquirySheetRoute } from "@/features/admissions/ui/admission-enquiry-sheet-route";
import { SubjectSheetRoute } from "@/features/subjects/ui/subject-sheet-route";
import { CalendarEventSheetRoute } from "@/features/calendar/ui/calendar-event-sheet-route";
import { AnnouncementSheetRoute } from "@/features/communications/ui/announcement-sheet-route";
import { FamilyPortalPage } from "@/features/family/ui/family-portal-page";
import { StudentPortalPage } from "@/features/student-portal/ui/student-portal-page";
import { AdmissionAcknowledgementPage } from "@/routes/documents/admission-acknowledgement-page";
import { ExamReportCardPage } from "@/routes/documents/exam-report-card-page";
import { FeeReceiptPage } from "@/routes/documents/fee-receipt-page";

import { Button } from "@repo/ui/components/ui/button";

const router = createBrowserRouter([
  {
    path: ERP_ROUTES.ROOT,
    element: (
      <RedirectIfAuthenticated>
        <Navigate replace to={ERP_ROUTES.SIGN_IN} />
      </RedirectIfAuthenticated>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: ERP_ROUTES.SIGN_IN,
    element: (
      <RedirectIfAuthenticated>
        <SignInPage />
      </RedirectIfAuthenticated>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: ERP_ROUTES.FORGOT_PASSWORD,
    element: (
      <RedirectIfAuthenticated>
        <ForgotPasswordPage />
      </RedirectIfAuthenticated>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: ERP_ROUTES.RESET_PASSWORD,
    element: (
      <RedirectIfAuthenticated>
        <ResetPasswordPage />
      </RedirectIfAuthenticated>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: ERP_ROUTES.FEE_ASSIGNMENT_RECEIPT,
    element: (
      <RequireSession>
        <FeeReceiptPage />
      </RequireSession>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: ERP_ROUTES.ADMISSIONS_APPLICATION_ACKNOWLEDGEMENT,
    element: (
      <RequireSession>
        <AdmissionAcknowledgementPage />
      </RequireSession>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: ERP_ROUTES.EXAM_REPORT_CARD,
    element: (
      <RequireSession>
        <ExamReportCardPage />
      </RequireSession>
    ),
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
      {
        path: ERP_ROUTES.FAMILY_CHILDREN,
        element: <FamilyPortalPage view="children" />,
      },
      {
        path: ERP_ROUTES.FAMILY_ATTENDANCE,
        element: <FamilyPortalPage view="attendance" />,
      },
      {
        path: ERP_ROUTES.FAMILY_TIMETABLE,
        element: <FamilyPortalPage view="timetable" />,
      },
      {
        path: ERP_ROUTES.FAMILY_EXAMS,
        element: <FamilyPortalPage view="exams" />,
      },
      {
        path: ERP_ROUTES.FAMILY_FEES,
        element: <FamilyPortalPage view="fees" />,
      },
      {
        path: ERP_ROUTES.FAMILY_ANNOUNCEMENTS,
        element: <FamilyPortalPage view="announcements" />,
      },
      {
        path: ERP_ROUTES.FAMILY_CALENDAR,
        element: <FamilyPortalPage view="calendar" />,
      },
      {
        path: ERP_ROUTES.STUDENT_TIMETABLE,
        element: <StudentPortalPage view="timetable" />,
      },
      {
        path: ERP_ROUTES.STUDENT_ATTENDANCE,
        element: <StudentPortalPage view="attendance" />,
      },
      {
        path: ERP_ROUTES.STUDENT_EXAMS,
        element: <StudentPortalPage view="exams" />,
      },
      {
        path: ERP_ROUTES.STUDENT_RESULTS,
        element: <StudentPortalPage view="results" />,
      },
      {
        path: ERP_ROUTES.STUDENT_ANNOUNCEMENTS,
        element: <StudentPortalPage view="announcements" />,
      },
      {
        path: ERP_ROUTES.STUDENT_CALENDAR,
        element: <StudentPortalPage view="calendar" />,
      },
      { path: ERP_ROUTES.NOTIFICATIONS, element: <NotificationsPage /> },
      {
        path: ERP_ROUTES.ANNOUNCEMENTS,
        element: <AnnouncementsPage />,
        children: [
          {
            path: ERP_ROUTE_SEGMENTS.NEW,
            element: <AnnouncementSheetRoute mode="create" />,
          },
          {
            path: `:announcementId/${ERP_ROUTE_SEGMENTS.EDIT}`,
            element: <AnnouncementSheetRoute mode="edit" />,
          },
        ],
      },
      {
        path: ERP_ROUTES.ADMISSIONS_ENQUIRIES,
        element: <AdmissionEnquiriesPage />,
        children: [
          {
            path: ERP_ROUTE_SEGMENTS.NEW,
            element: <AdmissionEnquirySheetRoute mode="create" />,
          },
          {
            path: `:enquiryId/${ERP_ROUTE_SEGMENTS.EDIT}`,
            element: <AdmissionEnquirySheetRoute mode="edit" />,
          },
        ],
      },
      {
        path: ERP_ROUTES.ADMISSIONS_APPLICATIONS,
        element: <AdmissionApplicationsPage />,
        children: [
          {
            path: ERP_ROUTE_SEGMENTS.NEW,
            element: <AdmissionApplicationSheetRoute mode="create" />,
          },
          {
            path: `:applicationId/${ERP_ROUTE_SEGMENTS.EDIT}`,
            element: <AdmissionApplicationSheetRoute mode="edit" />,
          },
        ],
      },
      { path: ERP_ROUTES.STUDENTS, element: <StudentsPage /> },
      { path: ERP_ROUTES.STUDENT_CREATE, element: <StudentCreatePage /> },
      { path: ERP_ROUTES.STUDENT_DETAIL, element: <StudentDetailPage /> },
      { path: ERP_ROUTES.STUDENT_ROLLOVER, element: <StudentRolloverPage /> },
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
      {
        path: ERP_ROUTES.SUBJECTS,
        element: <SubjectsPage />,
        children: [
          {
            path: ERP_ROUTE_SEGMENTS.NEW,
            element: <SubjectSheetRoute mode="create" />,
          },
          {
            path: `:subjectId/${ERP_ROUTE_SEGMENTS.EDIT}`,
            element: <SubjectSheetRoute mode="edit" />,
          },
        ],
      },
      { path: ERP_ROUTES.TIMETABLE, element: <TimetablePage /> },
      {
        path: ERP_ROUTES.CALENDAR,
        element: <CalendarPage />,
        children: [
          {
            path: ERP_ROUTE_SEGMENTS.NEW,
            element: <CalendarEventSheetRoute mode="create" />,
          },
          {
            path: `:eventId/${ERP_ROUTE_SEGMENTS.EDIT}`,
            element: <CalendarEventSheetRoute mode="edit" />,
          },
        ],
      },
      { path: ERP_ROUTES.ATTENDANCE, element: <AttendancePage /> },
      {
        path: ERP_ROUTES.REPORTS_ATTENDANCE,
        element: <AttendanceReportsPage />,
      },
      { path: ERP_ROUTES.EXAMS, element: <ExamsPage /> },
      {
        path: ERP_ROUTES.FEES,
        element: <Navigate replace to={ERP_ROUTES.FEE_STRUCTURES} />,
      },
      { path: ERP_ROUTES.FEE_STRUCTURES, element: <FeeStructuresPage /> },
      {
        path: ERP_ROUTES.FEE_STRUCTURE_CREATE,
        element: <FeeStructureFormPage mode="create" />,
      },
      {
        path: ERP_ROUTES.FEE_STRUCTURE_EDIT,
        element: <FeeStructureFormPage mode="edit" />,
      },
      {
        path: ERP_ROUTES.FEE_ASSIGNMENTS,
        element: <FeeAssignmentsPage />,
        children: [
          {
            path: ERP_ROUTE_SEGMENTS.NEW,
            element: <FeeAssignmentSheetRoute mode="create" />,
          },
          {
            path: ERP_ROUTE_SEGMENTS.BULK,
            element: <BulkFeeAssignmentSheetRoute />,
          },
          {
            path: `:feeAssignmentId/${ERP_ROUTE_SEGMENTS.EDIT}`,
            element: <FeeAssignmentSheetRoute mode="edit" />,
          },
          {
            path: `:feeAssignmentId/${ERP_ROUTE_SEGMENTS.ADJUSTMENT}`,
            element: <FeeAdjustmentSheetRoute />,
          },
          {
            path: `:feeAssignmentId/${ERP_ROUTE_SEGMENTS.COLLECT}`,
            element: <CollectPaymentSheetRoute />,
          },
        ],
      },
      { path: ERP_ROUTES.FEE_DUES, element: <FeeDuesPage /> },
      { path: ERP_ROUTES.FEE_REPORTS, element: <FeeReportsPage /> },
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
      {
        path: ERP_ROUTES.SETTINGS_ROLES,
        element: <RolesPage />,
        children: [
          {
            path: ERP_ROUTE_SEGMENTS.NEW,
            element: <RoleSheetRoute mode="create" />,
          },
          {
            path: `:roleId/${ERP_ROUTE_SEGMENTS.EDIT}`,
            element: <RoleSheetRoute mode="edit" />,
          },
        ],
      },
      { path: ERP_ROUTES.SETTINGS_AUDIT, element: <AuditPage /> },
      { path: ERP_ROUTES.SETTINGS_BRANDING, element: <BrandingPage /> },
      {
        path: ERP_ROUTES.SETTINGS_ADMISSION_FIELDS,
        element: <AdmissionFormFieldsPage />,
      },
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
