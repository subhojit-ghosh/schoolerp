import { useEffect, useState } from "react";
import { type TenantBranding } from "@repo/contracts";
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
  buildRootAppUrl,
  getCurrentTenantSlug,
  isRootHostname,
} from "@/lib/app-host";
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
import { DeliverySettingsPage } from "@/routes/settings/delivery-page";
import { PaymentSettingsPage } from "@/routes/settings/payment-page";
import { CampusesPage } from "@/routes/settings/campuses-page";
import { RolesPage } from "@/routes/settings/roles-page";
import { ClassesPage } from "@/routes/academics/classes-page";
import { SubjectsPage } from "@/routes/academics/subjects-page";
import { BellSchedulesPage } from "@/routes/academics/bell-schedules-page";
import { TimetablePage } from "@/routes/academics/timetable-page";
import { TeacherTimetablePage } from "@/routes/academics/teacher-timetable-page";
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
import { StudentStrengthPage } from "@/routes/reports/student-strength-page";
import { FeeDefaultersPage } from "@/routes/operations/fee-defaulters-page";
import { AdmissionApplicationSheetRoute } from "@/features/admissions/ui/admission-application-sheet-route";
import { AdmissionEnquirySheetRoute } from "@/features/admissions/ui/admission-enquiry-sheet-route";
import { SubjectSheetRoute } from "@/features/subjects/ui/subject-sheet-route";
import { BellScheduleSheetRoute } from "@/features/bell-schedules/ui/bell-schedule-sheet-route";
import { CalendarEventSheetRoute } from "@/features/calendar/ui/calendar-event-sheet-route";
import { AnnouncementSheetRoute } from "@/features/communications/ui/announcement-sheet-route";
import { HomeworkPage } from "@/routes/operations/homework-page";
import { HomeworkSheetRoute } from "@/features/homework/ui/homework-sheet-route";
import { LeaveApplicationsPage } from "@/routes/leave/leave-applications-page";
import { LeaveTypesPage } from "@/routes/leave/leave-types-page";
import { LeaveApplicationSheetRoute } from "@/features/leave/ui/leave-application-sheet-route";
import { LeaveTypeSheetRoute } from "@/features/leave/ui/leave-type-sheet-route";
import { LibraryBooksPage } from "@/routes/library/library-books-page";
import { LibraryTransactionsPage } from "@/routes/library/library-transactions-page";
import { BookSheetRoute } from "@/features/library/ui/book-sheet-route";
import { IssueBookSheetRoute } from "@/features/library/ui/issue-book-sheet-route";
import { TransportRoutesPage } from "@/routes/transport/transport-routes-page";
import { TransportVehiclesPage } from "@/routes/transport/transport-vehicles-page";
import { TransportAssignmentsPage } from "@/routes/transport/transport-assignments-page";
import { TransportRouteDetailPage } from "@/routes/transport/transport-route-detail-page";
import { RouteSheetRoute } from "@/features/transport/ui/route-sheet-route";
import { VehicleSheetRoute } from "@/features/transport/ui/vehicle-sheet-route";
import { AssignmentSheetRoute } from "@/features/transport/ui/assignment-sheet-route";
import { StopSheetRoute } from "@/features/transport/ui/stop-sheet-route";
import { InventoryCategoriesPage } from "@/routes/inventory/inventory-categories-page";
import { InventoryCategorySheetRoute } from "@/routes/inventory/inventory-category-sheet-route";
import { InventoryItemsPage } from "@/routes/inventory/inventory-items-page";
import { InventoryItemSheetRoute } from "@/routes/inventory/inventory-item-sheet-route";
import { InventoryItemDetailPage } from "@/routes/inventory/inventory-item-detail-page";
import { InventoryTransactionsPage } from "@/routes/inventory/inventory-transactions-page";
import { InventoryTransactionSheetRoute } from "@/routes/inventory/inventory-transaction-sheet-route";
import { InventoryLowStockPage } from "@/routes/inventory/inventory-low-stock-page";
import { HostelBuildingsPage } from "@/routes/hostel/hostel-buildings-page";
import { HostelBuildingSheetRoute } from "@/routes/hostel/hostel-building-sheet-route";
import { HostelBuildingDetailPage } from "@/routes/hostel/hostel-building-detail-page";
import { HostelRoomsPage } from "@/routes/hostel/hostel-rooms-page";
import { HostelRoomSheetRoute } from "@/routes/hostel/hostel-room-sheet-route";
import { HostelAllocationsPage } from "@/routes/hostel/hostel-allocations-page";
import { HostelAllocationSheetRoute } from "@/routes/hostel/hostel-allocation-sheet-route";
import { HostelMessPlansPage } from "@/routes/hostel/hostel-mess-plans-page";
import { HostelMessPlanSheetRoute } from "@/routes/hostel/hostel-mess-plan-sheet-route";
import { SalaryComponentsPage } from "@/routes/hr/salary-components-page";
import { SalaryComponentSheetRoute } from "@/routes/hr/salary-component-sheet-route";
import { SalaryTemplatesPage } from "@/routes/hr/salary-templates-page";
import { SalaryTemplateCreatePage } from "@/routes/hr/salary-template-create-page";
import { SalaryTemplateEditPage } from "@/routes/hr/salary-template-edit-page";
import { SalaryTemplateDetailPage } from "@/routes/hr/salary-template-detail-page";
import { PayrollReportsPage } from "@/routes/hr/payroll-reports-page";
import { SalaryAssignmentsPage } from "@/routes/hr/salary-assignments-page";
import { SalaryAssignmentSheetRoute } from "@/routes/hr/salary-assignment-sheet-route";
import { PayrollRunsPage } from "@/routes/hr/payroll-runs-page";
import { PayrollRunDetailPage } from "@/routes/hr/payroll-run-detail-page";
import { PayslipDetailPage } from "@/routes/hr/payslip-detail-page";
import { PayslipPrintPage } from "@/routes/hr/payslip-print-page";
import { FamilyPortalPage } from "@/features/family/ui/family-portal-page";
import { StudentPortalPage } from "@/features/student-portal/ui/student-portal-page";
import { AdmissionAcknowledgementPage } from "@/routes/documents/admission-acknowledgement-page";
import { BonafideCertificatePage } from "@/routes/documents/bonafide-certificate-page";
import { CharacterCertificatePage } from "@/routes/documents/character-certificate-page";
import { ExamReportCardPage } from "@/routes/documents/exam-report-card-page";
import { FeeReceiptPage } from "@/routes/documents/fee-receipt-page";
import { StaffIdCardPage } from "@/routes/documents/staff-id-card-page";
import { StudentIdCardPage } from "@/routes/documents/student-id-card-page";
import { TransferCertificatePage } from "@/routes/documents/transfer-certificate-page";
import { AccountPage } from "@/routes/account/account-page";
import { SetupWizardPage } from "@/routes/setup/setup-wizard-page";
import { StaffAttendancePage } from "@/routes/staff-attendance/staff-attendance-page";
import { StaffAttendanceReportPage } from "@/routes/staff-attendance/staff-attendance-report-page";

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
    path: ERP_ROUTES.SETUP,
    element: (
      <RequireSession>
        <SetupWizardPage />
      </RequireSession>
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
    path: ERP_ROUTES.STUDENT_TRANSFER_CERTIFICATE,
    element: (
      <RequireSession>
        <TransferCertificatePage />
      </RequireSession>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: ERP_ROUTES.STUDENT_BONAFIDE_CERTIFICATE,
    element: (
      <RequireSession>
        <BonafideCertificatePage />
      </RequireSession>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: ERP_ROUTES.STUDENT_CHARACTER_CERTIFICATE,
    element: (
      <RequireSession>
        <CharacterCertificatePage />
      </RequireSession>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: ERP_ROUTES.DOCUMENT_STUDENT_ID_CARD,
    element: (
      <RequireSession>
        <StudentIdCardPage />
      </RequireSession>
    ),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: ERP_ROUTES.DOCUMENT_STAFF_ID_CARD,
    element: (
      <RequireSession>
        <StaffIdCardPage />
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
      { path: ERP_ROUTES.ACCOUNT, element: <AccountPage /> },
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
        path: ERP_ROUTES.HOMEWORK,
        element: <HomeworkPage />,
        children: [
          {
            path: ERP_ROUTE_SEGMENTS.NEW,
            element: <HomeworkSheetRoute mode="create" />,
          },
          {
            path: `:homeworkId/${ERP_ROUTE_SEGMENTS.EDIT}`,
            element: <HomeworkSheetRoute mode="edit" />,
          },
        ],
      },
      {
        path: ERP_ROUTES.LEAVE_APPLICATIONS,
        element: <LeaveApplicationsPage />,
        children: [
          {
            path: ERP_ROUTE_SEGMENTS.NEW,
            element: <LeaveApplicationSheetRoute />,
          },
        ],
      },
      {
        path: ERP_ROUTES.LEAVE_TYPES,
        element: <LeaveTypesPage />,
        children: [
          {
            path: ERP_ROUTE_SEGMENTS.NEW,
            element: <LeaveTypeSheetRoute mode="create" />,
          },
          {
            path: `:leaveTypeId/${ERP_ROUTE_SEGMENTS.EDIT}`,
            element: <LeaveTypeSheetRoute mode="edit" />,
          },
        ],
      },
      {
        path: ERP_ROUTES.LIBRARY_BOOKS,
        element: <LibraryBooksPage />,
        children: [
          {
            path: ERP_ROUTE_SEGMENTS.NEW,
            element: <BookSheetRoute mode="create" />,
          },
          {
            path: `:bookId/${ERP_ROUTE_SEGMENTS.EDIT}`,
            element: <BookSheetRoute mode="edit" />,
          },
        ],
      },
      {
        path: ERP_ROUTES.LIBRARY_TRANSACTIONS,
        element: <LibraryTransactionsPage />,
        children: [
          {
            path: ERP_ROUTE_SEGMENTS.NEW,
            element: <IssueBookSheetRoute />,
          },
        ],
      },
      {
        path: ERP_ROUTES.TRANSPORT_ROUTES,
        element: <TransportRoutesPage />,
        children: [
          {
            path: ERP_ROUTE_SEGMENTS.NEW,
            element: <RouteSheetRoute mode="create" />,
          },
          {
            path: `:routeId/${ERP_ROUTE_SEGMENTS.EDIT}`,
            element: <RouteSheetRoute mode="edit" />,
          },
        ],
      },
      {
        path: ERP_ROUTES.TRANSPORT_ROUTE_DETAIL,
        element: <TransportRouteDetailPage />,
        children: [
          {
            path: `${ERP_ROUTE_SEGMENTS.STOPS}/${ERP_ROUTE_SEGMENTS.NEW}`,
            element: <StopSheetRoute mode="create" />,
          },
          {
            path: `${ERP_ROUTE_SEGMENTS.STOPS}/:stopId/${ERP_ROUTE_SEGMENTS.EDIT}`,
            element: <StopSheetRoute mode="edit" />,
          },
        ],
      },
      {
        path: ERP_ROUTES.TRANSPORT_VEHICLES,
        element: <TransportVehiclesPage />,
        children: [
          {
            path: ERP_ROUTE_SEGMENTS.NEW,
            element: <VehicleSheetRoute mode="create" />,
          },
          {
            path: `:vehicleId/${ERP_ROUTE_SEGMENTS.EDIT}`,
            element: <VehicleSheetRoute mode="edit" />,
          },
        ],
      },
      {
        path: ERP_ROUTES.TRANSPORT_ASSIGNMENTS,
        element: <TransportAssignmentsPage />,
        children: [
          {
            path: ERP_ROUTE_SEGMENTS.NEW,
            element: <AssignmentSheetRoute mode="create" />,
          },
          {
            path: `:assignmentId/${ERP_ROUTE_SEGMENTS.EDIT}`,
            element: <AssignmentSheetRoute mode="edit" />,
          },
        ],
      },
      // ── Inventory ────────────────────────────────────────────────────
      {
        path: ERP_ROUTES.INVENTORY_CATEGORIES,
        element: <InventoryCategoriesPage />,
        children: [
          {
            path: ERP_ROUTE_SEGMENTS.NEW,
            element: <InventoryCategorySheetRoute mode="create" />,
          },
          {
            path: `:categoryId/${ERP_ROUTE_SEGMENTS.EDIT}`,
            element: <InventoryCategorySheetRoute mode="edit" />,
          },
        ],
      },
      {
        path: ERP_ROUTES.INVENTORY_ITEMS,
        element: <InventoryItemsPage />,
        children: [
          {
            path: ERP_ROUTE_SEGMENTS.NEW,
            element: <InventoryItemSheetRoute mode="create" />,
          },
          {
            path: `:itemId/${ERP_ROUTE_SEGMENTS.EDIT}`,
            element: <InventoryItemSheetRoute mode="edit" />,
          },
        ],
      },
      {
        path: ERP_ROUTES.INVENTORY_ITEM_DETAIL,
        element: <InventoryItemDetailPage />,
      },
      {
        path: ERP_ROUTES.INVENTORY_TRANSACTIONS,
        element: <InventoryTransactionsPage />,
        children: [
          {
            path: ERP_ROUTE_SEGMENTS.NEW,
            element: <InventoryTransactionSheetRoute />,
          },
        ],
      },
      {
        path: ERP_ROUTES.INVENTORY_LOW_STOCK,
        element: <InventoryLowStockPage />,
      },
      // ── Hostel ───────────────────────────────────────────────────────
      {
        path: ERP_ROUTES.HOSTEL_BUILDINGS,
        element: <HostelBuildingsPage />,
        children: [
          {
            path: ERP_ROUTE_SEGMENTS.NEW,
            element: <HostelBuildingSheetRoute mode="create" />,
          },
          {
            path: `:buildingId/${ERP_ROUTE_SEGMENTS.EDIT}`,
            element: <HostelBuildingSheetRoute mode="edit" />,
          },
        ],
      },
      {
        path: ERP_ROUTES.HOSTEL_BUILDING_DETAIL,
        element: <HostelBuildingDetailPage />,
      },
      {
        path: ERP_ROUTES.HOSTEL_ROOMS,
        element: <HostelRoomsPage />,
        children: [
          {
            path: ERP_ROUTE_SEGMENTS.NEW,
            element: <HostelRoomSheetRoute mode="create" />,
          },
          {
            path: `:roomId/${ERP_ROUTE_SEGMENTS.EDIT}`,
            element: <HostelRoomSheetRoute mode="edit" />,
          },
        ],
      },
      {
        path: ERP_ROUTES.HOSTEL_ALLOCATIONS,
        element: <HostelAllocationsPage />,
        children: [
          {
            path: ERP_ROUTE_SEGMENTS.NEW,
            element: <HostelAllocationSheetRoute />,
          },
        ],
      },
      {
        path: ERP_ROUTES.HOSTEL_MESS_PLANS,
        element: <HostelMessPlansPage />,
        children: [
          {
            path: ERP_ROUTE_SEGMENTS.NEW,
            element: <HostelMessPlanSheetRoute mode="create" />,
          },
          {
            path: `:planId/${ERP_ROUTE_SEGMENTS.EDIT}`,
            element: <HostelMessPlanSheetRoute mode="edit" />,
          },
        ],
      },
      // ── Staff Attendance ──────────────────────────────────────────────
      {
        path: ERP_ROUTES.STAFF_ATTENDANCE,
        element: <StaffAttendancePage />,
      },
      {
        path: ERP_ROUTES.STAFF_ATTENDANCE_REPORT,
        element: <StaffAttendanceReportPage />,
      },
      // ── Payroll ──────────────────────────────────────────────────────
      {
        path: ERP_ROUTES.PAYROLL_SALARY_COMPONENTS,
        element: <SalaryComponentsPage />,
        children: [
          {
            path: ERP_ROUTE_SEGMENTS.NEW,
            element: <SalaryComponentSheetRoute mode="create" />,
          },
          {
            path: `:componentId/${ERP_ROUTE_SEGMENTS.EDIT}`,
            element: <SalaryComponentSheetRoute mode="edit" />,
          },
        ],
      },
      {
        path: ERP_ROUTES.PAYROLL_SALARY_TEMPLATES,
        element: <SalaryTemplatesPage />,
      },
      {
        path: ERP_ROUTES.PAYROLL_SALARY_TEMPLATE_CREATE,
        element: <SalaryTemplateCreatePage />,
      },
      {
        path: ERP_ROUTES.PAYROLL_SALARY_TEMPLATE_EDIT,
        element: <SalaryTemplateEditPage />,
      },
      {
        path: ERP_ROUTES.PAYROLL_SALARY_TEMPLATE_DETAIL,
        element: <SalaryTemplateDetailPage />,
      },
      {
        path: ERP_ROUTES.PAYROLL_SALARY_ASSIGNMENTS,
        element: <SalaryAssignmentsPage />,
        children: [
          {
            path: ERP_ROUTE_SEGMENTS.NEW,
            element: <SalaryAssignmentSheetRoute mode="create" />,
          },
          {
            path: `:assignmentId/${ERP_ROUTE_SEGMENTS.EDIT}`,
            element: <SalaryAssignmentSheetRoute mode="edit" />,
          },
        ],
      },
      {
        path: ERP_ROUTES.PAYROLL_RUNS,
        element: <PayrollRunsPage />,
      },
      {
        path: ERP_ROUTES.PAYROLL_RUN_DETAIL,
        element: <PayrollRunDetailPage />,
      },
      {
        path: ERP_ROUTES.PAYROLL_PAYSLIP_DETAIL,
        element: <PayslipDetailPage />,
      },
      {
        path: ERP_ROUTES.PAYROLL_PAYSLIP_PRINT,
        element: <PayslipPrintPage />,
      },
      {
        path: ERP_ROUTES.PAYROLL_REPORTS,
        element: <PayrollReportsPage />,
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
      {
        path: ERP_ROUTES.BELL_SCHEDULES,
        element: <BellSchedulesPage />,
        children: [
          {
            path: ERP_ROUTE_SEGMENTS.NEW,
            element: <BellScheduleSheetRoute mode="create" />,
          },
          {
            path: `:scheduleId/${ERP_ROUTE_SEGMENTS.EDIT}`,
            element: <BellScheduleSheetRoute mode="edit" />,
          },
        ],
      },
      { path: ERP_ROUTES.TIMETABLE, element: <TimetablePage /> },
      {
        path: ERP_ROUTES.TIMETABLE_TEACHER,
        element: <TeacherTimetablePage />,
      },
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
      {
        path: ERP_ROUTES.REPORTS_STUDENT_STRENGTH,
        element: <StudentStrengthPage />,
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
      { path: ERP_ROUTES.FEE_DEFAULTERS, element: <FeeDefaultersPage /> },
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
      { path: ERP_ROUTES.SETTINGS_DELIVERY, element: <DeliverySettingsPage /> },
      { path: ERP_ROUTES.SETTINGS_PAYMENT, element: <PaymentSettingsPage /> },
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
