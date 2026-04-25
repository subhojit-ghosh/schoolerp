import {
  ADMISSION_FORM_FIELD_SCOPES,
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUSES,
  DISCIPLINARY_SEVERITY,
  SIBLING_RELATIONSHIPS,
  type DisciplinarySeverity,
  type SiblingRelationship,
} from "@repo/contracts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  IconCalendarStats,
  IconCertificate,
  IconCurrencyRupee,
  IconEdit,
  IconHistory,
  IconReceipt,
  IconReportAnalytics,
  IconSchool,
  IconTimeline,
  IconUserHeart,
  IconUsers,
} from "@tabler/icons-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/ui/field";
import { Input } from "@repo/ui/components/ui/input";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import {
  EntityDetailPageHeader,
  EntityPageShell,
} from "@/components/entities/entity-page-shell";
import { Separator } from "@repo/ui/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import {
  ERP_ROUTES,
  buildStudentDetailRoute,
  buildStudentBonafideCertificateRoute,
  buildStudentCharacterCertificateRoute,
  buildStudentIdCardRoute,
  buildStudentTransferCertificateRoute,
} from "@/constants/routes";
import { useAcademicYearsQuery } from "@/features/academic-years/api/use-academic-years";
import { useAdmissionFormFieldsQuery } from "@/features/admissions/api/use-admissions";
import {
  filterAdmissionFormFieldsForScope,
  normalizeCustomFieldValues,
} from "@/features/admissions/model/admission-custom-fields";
import {
  getActiveContext,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  formatFeeDate,
  formatRupees,
} from "@/features/fees/model/fee-formatters";
import {
  useCreateDisciplinaryRecordMutation,
  useCreateSiblingLinkMutation,
  useDisciplinaryRecordsQuery,
  useDeleteSiblingLinkMutation,
  useSiblingsQuery,
  useStudentMedicalRecordQuery,
  useStudentOptionsQuery,
  useStudentSummaryQuery,
  useUpsertMedicalRecordMutation,
  useUpdateStudentMutation,
} from "@/features/students/api/use-students";
import {
  EMPTY_CURRENT_ENROLLMENT,
  toStudentMutationBody,
  type StudentFormValues,
} from "@/features/students/model/student-form-schema";
import { StudentForm } from "@/features/students/ui/student-form";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { extractApiError } from "@/lib/api-error";
import { appendSearch } from "@/lib/routes";
import { formatAcademicYear, formatPhone } from "@/lib/format";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";
import { z } from "zod";

const STUDENT_DETAIL_TAB_VALUES = {
  OVERVIEW: "overview",
  MEDICAL_RECORDS: "medical-records",
  DISCIPLINARY_LOG: "disciplinary-log",
  SIBLINGS: "siblings",
  EDIT: "edit",
} as const;

const SIBLING_RELATIONSHIP_LABELS: Record<SiblingRelationship, string> = {
  [SIBLING_RELATIONSHIPS.ELDER_BROTHER]: "Elder brother",
  [SIBLING_RELATIONSHIPS.YOUNGER_BROTHER]: "Younger brother",
  [SIBLING_RELATIONSHIPS.ELDER_SISTER]: "Elder sister",
  [SIBLING_RELATIONSHIPS.YOUNGER_SISTER]: "Younger sister",
  [SIBLING_RELATIONSHIPS.ELDER_SIBLING]: "Elder sibling",
  [SIBLING_RELATIONSHIPS.YOUNGER_SIBLING]: "Younger sibling",
};

const SIBLING_RELATIONSHIP_OPTIONS: SiblingRelationship[] = [
  SIBLING_RELATIONSHIPS.ELDER_BROTHER,
  SIBLING_RELATIONSHIPS.YOUNGER_BROTHER,
  SIBLING_RELATIONSHIPS.ELDER_SISTER,
  SIBLING_RELATIONSHIPS.YOUNGER_SISTER,
];

const DISCIPLINARY_SEVERITY_OPTIONS: DisciplinarySeverity[] = [
  DISCIPLINARY_SEVERITY.MINOR,
  DISCIPLINARY_SEVERITY.MODERATE,
  DISCIPLINARY_SEVERITY.MAJOR,
];

const DISCIPLINARY_SEVERITY_LABELS: Record<DisciplinarySeverity, string> = {
  [DISCIPLINARY_SEVERITY.MINOR]: "Minor",
  [DISCIPLINARY_SEVERITY.MODERATE]: "Moderate",
  [DISCIPLINARY_SEVERITY.MAJOR]: "Major",
};

const studentMedicalRecordFormSchema = z.object({
  allergies: z.string().trim(),
  conditions: z.string().trim(),
  medications: z.string().trim(),
  emergencyMedicalInfo: z.string().trim(),
  doctorName: z.string().trim(),
  doctorPhone: z.string().trim(),
  insuranceInfo: z.string().trim(),
});

type StudentMedicalRecordFormValues = z.infer<
  typeof studentMedicalRecordFormSchema
>;

const EMPTY_MEDICAL_RECORD_VALUES: StudentMedicalRecordFormValues = {
  allergies: "",
  conditions: "",
  medications: "",
  emergencyMedicalInfo: "",
  doctorName: "",
  doctorPhone: "",
  insuranceInfo: "",
};

const studentDisciplinaryEntryFormSchema = z.object({
  incidentDate: z.string().min(1, "Incident date is required"),
  severity: z.enum(DISCIPLINARY_SEVERITY_OPTIONS),
  description: z.string().trim().min(1, "Description is required"),
  actionTaken: z.string().trim(),
  parentNotified: z.boolean(),
});

type StudentDisciplinaryEntryFormValues = z.infer<
  typeof studentDisciplinaryEntryFormSchema
>;

const EMPTY_DISCIPLINARY_ENTRY_VALUES: StudentDisciplinaryEntryFormValues = {
  incidentDate: "",
  severity: DISCIPLINARY_SEVERITY.MINOR,
  description: "",
  actionTaken: "",
  parentNotified: false,
};

function toNullableText(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function toInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatStudentPlacement(student: {
  className: string;
  currentEnrollment?:
    | {
        className: string;
        sectionName: string;
        academicYearName: string;
      }
    | null
    | undefined;
  sectionName: string;
}) {
  if (student.currentEnrollment) {
    return {
      academicYearName: student.currentEnrollment.academicYearName,
      isManagedEnrollment: true,
      placementLabel:
        `${student.currentEnrollment.className} ${student.currentEnrollment.sectionName}`.trim(),
    };
  }

  const fallbackPlacement =
    `${student.className} ${student.sectionName}`.trim();

  return {
    academicYearName: null,
    isManagedEnrollment: false,
    placementLabel: fallbackPlacement,
  };
}

function attendanceBadgeVariant(status: string) {
  if (status === ATTENDANCE_STATUSES.ABSENT) {
    return "destructive";
  }

  if (status === ATTENDANCE_STATUSES.PRESENT) {
    return "default";
  }

  if (status === ATTENDANCE_STATUSES.EXCUSED) {
    return "outline";
  }

  return "secondary";
}

type MetricCardProps = {
  description: string;
  Icon: typeof IconUsers;
  title: string;
  value: string;
};

function MetricCard({ description, Icon, title, value }: MetricCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: "var(--primary)" }}
      />
      <CardHeader className="gap-3">
        <CardDescription className="flex items-center gap-2">
          <span
            className="flex size-7 items-center justify-center rounded-lg"
            style={{
              background: "color-mix(in srgb, var(--primary) 14%, transparent)",
            }}
          >
            <Icon className="size-4" style={{ color: "var(--primary)" }} />
          </span>
          {title}
        </CardDescription>
        <CardTitle className="text-3xl font-semibold">{value}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
    </Card>
  );
}

export function StudentDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { studentId } = useParams();
  const [selectedSiblingId, setSelectedSiblingId] = useState("");
  const [selectedSiblingRelationship, setSelectedSiblingRelationship] =
    useState<SiblingRelationship | "">("");
  const [isEditingMedicalRecord, setIsEditingMedicalRecord] = useState(false);
  const [isAddingDisciplinaryEntry, setIsAddingDisciplinaryEntry] =
    useState(false);
  const [pendingDeleteSibling, setPendingDeleteSibling] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const institutionId = session?.activeOrganization?.id;
  const canManageStudents = isStaffContext(session);
  const managedInstitutionId = canManageStudents ? institutionId : undefined;
  const academicYearsQuery = useAcademicYearsQuery(managedInstitutionId);
  const formFieldsQuery = useAdmissionFormFieldsQuery(
    managedInstitutionId,
    ADMISSION_FORM_FIELD_SCOPES.STUDENT,
  );
  const studentSummaryQuery = useStudentSummaryQuery(
    managedInstitutionId,
    studentId,
  );
  const studentMedicalRecordQuery = useStudentMedicalRecordQuery(
    managedInstitutionId,
    studentId,
  );
  const disciplinaryRecordsQuery = useDisciplinaryRecordsQuery(
    managedInstitutionId,
    studentId,
  );
  const studentOptionsQuery = useStudentOptionsQuery(managedInstitutionId);
  const siblingsQuery = useSiblingsQuery(managedInstitutionId, studentId);
  const studentName = studentSummaryQuery.data?.student
    ? `${studentSummaryQuery.data.student.firstName} ${studentSummaryQuery.data.student.lastName ?? ""}`.trim()
    : "Student Details";
  useDocumentTitle(studentName);
  const updateStudentMutation = useUpdateStudentMutation(managedInstitutionId);
  const createSiblingLinkMutation =
    useCreateSiblingLinkMutation(managedInstitutionId);
  const createDisciplinaryRecordMutation =
    useCreateDisciplinaryRecordMutation(managedInstitutionId);
  const deleteSiblingLinkMutation =
    useDeleteSiblingLinkMutation(managedInstitutionId);
  const upsertMedicalRecordMutation =
    useUpsertMedicalRecordMutation(managedInstitutionId);
  const updateError = updateStudentMutation.error as Error | null | undefined;
  const medicalRecordError = studentMedicalRecordQuery.error as
    | Error
    | null
    | undefined;
  const disciplinaryRecordsError = disciplinaryRecordsQuery.error as
    | Error
    | null
    | undefined;
  const customFields = filterAdmissionFormFieldsForScope(
    formFieldsQuery.data?.rows ?? [],
    "student",
  );
  const medicalRecordDefaultValues = useMemo<StudentMedicalRecordFormValues>(
    () => ({
      allergies: studentMedicalRecordQuery.data?.allergies ?? "",
      conditions: studentMedicalRecordQuery.data?.conditions ?? "",
      medications: studentMedicalRecordQuery.data?.medications ?? "",
      emergencyMedicalInfo:
        studentMedicalRecordQuery.data?.emergencyMedicalInfo ?? "",
      doctorName: studentMedicalRecordQuery.data?.doctorName ?? "",
      doctorPhone: studentMedicalRecordQuery.data?.doctorPhone ?? "",
      insuranceInfo: studentMedicalRecordQuery.data?.insuranceInfo ?? "",
    }),
    [studentMedicalRecordQuery.data],
  );
  const {
    control: medicalRecordControl,
    handleSubmit: handleSubmitMedicalRecord,
    reset: resetMedicalRecord,
  } = useForm<StudentMedicalRecordFormValues>({
    resolver: zodResolver(studentMedicalRecordFormSchema),
    mode: "onTouched",
    defaultValues: EMPTY_MEDICAL_RECORD_VALUES,
  });
  const {
    control: disciplinaryEntryControl,
    handleSubmit: handleSubmitDisciplinaryEntry,
    reset: resetDisciplinaryEntry,
  } = useForm<StudentDisciplinaryEntryFormValues>({
    resolver: zodResolver(studentDisciplinaryEntryFormSchema),
    mode: "onTouched",
    defaultValues: EMPTY_DISCIPLINARY_ENTRY_VALUES,
  });

  const defaultValues = useMemo<StudentFormValues>(() => {
    const student = studentSummaryQuery.data?.student;

    if (!student) {
      return {
        admissionNumber: "",
        firstName: "",
        lastName: "",
        classId: "",
        sectionId: "",
        guardians: [],
        customFieldValues: normalizeCustomFieldValues(customFields),
        currentEnrollment: EMPTY_CURRENT_ENROLLMENT,
      };
    }

    return {
      admissionNumber: student.admissionNumber,
      firstName: student.firstName,
      lastName: student.lastName ?? "",
      classId: student.classId,
      sectionId: student.sectionId,
      guardians: student.guardians.map((guardian) => ({
        name: guardian.name,
        mobile: guardian.mobile,
        email: guardian.email ?? "",
        relationship: guardian.relationship,
        isPrimary: guardian.isPrimary,
      })),
      customFieldValues: normalizeCustomFieldValues(
        customFields,
        student.customFieldValues,
      ),
      currentEnrollment: student.currentEnrollment
        ? {
            academicYearId: student.currentEnrollment.academicYearId,
            classId: student.currentEnrollment.classId,
            sectionId: student.currentEnrollment.sectionId,
          }
        : EMPTY_CURRENT_ENROLLMENT,
    };
  }, [customFields, studentSummaryQuery.data?.student]);

  const studentPlacement = useMemo(() => {
    if (!studentSummaryQuery.data?.student) {
      return {
        academicYearName: null,
        isManagedEnrollment: false,
        placementLabel: "",
      };
    }

    return formatStudentPlacement(studentSummaryQuery.data.student);
  }, [studentSummaryQuery.data]);

  const availableSiblingOptions = useMemo(() => {
    const currentStudentId = studentSummaryQuery.data?.student.id;
    const linkedSiblingIds = new Set(
      (siblingsQuery.data ?? []).map((sibling) => sibling.siblingStudentId),
    );

    return (studentOptionsQuery.data ?? []).filter((option) => {
      if (option.id === currentStudentId) {
        return false;
      }

      return !linkedSiblingIds.has(option.id);
    });
  }, [siblingsQuery.data, studentOptionsQuery.data, studentSummaryQuery.data]);

  useEffect(() => {
    resetMedicalRecord(medicalRecordDefaultValues);
  }, [medicalRecordDefaultValues, resetMedicalRecord]);

  useEffect(() => {
    if (!isAddingDisciplinaryEntry) {
      resetDisciplinaryEntry(EMPTY_DISCIPLINARY_ENTRY_VALUES);
    }
  }, [isAddingDisciplinaryEntry, resetDisciplinaryEntry]);

  async function onSubmit(values: StudentFormValues) {
    if (!institutionId || !studentId) {
      return;
    }

    try {
      await updateStudentMutation.mutateAsync({
        params: {
          path: {
            studentId,
          },
        },
        body: toStudentMutationBody(values),
      });

      toast.success(ERP_TOAST_MESSAGES.updated(ERP_TOAST_SUBJECTS.STUDENT));
    } catch (error) {
      toast.error(
        extractApiError(
          error,
          "Could not update student record. Please try again.",
        ),
      );
    }
  }

  async function handleCreateSiblingLink() {
    if (
      !institutionId ||
      !studentId ||
      !selectedSiblingId ||
      !selectedSiblingRelationship
    ) {
      return;
    }

    try {
      await createSiblingLinkMutation.mutateAsync({
        params: {
          path: {
            studentId,
          },
        },
        body: {
          siblingStudentId: selectedSiblingId,
          relationship: selectedSiblingRelationship,
        },
      });

      setSelectedSiblingId("");
      setSelectedSiblingRelationship("");
      toast.success("Sibling link created.");
    } catch (error) {
      toast.error(
        extractApiError(
          error,
          "Could not create the sibling link. Please try again.",
        ),
      );
    }
  }

  async function handleDeleteSiblingLink() {
    if (!institutionId || !studentId || !pendingDeleteSibling) {
      return;
    }

    try {
      await deleteSiblingLinkMutation.mutateAsync({
        params: {
          path: {
            studentId,
            linkId: pendingDeleteSibling.id,
          },
        },
      });

      setPendingDeleteSibling(null);
      toast.success("Sibling link removed.");
    } catch (error) {
      toast.error(
        extractApiError(
          error,
          "Could not remove the sibling link. Please try again.",
        ),
      );
    }
  }

  async function handleMedicalRecordSubmit(
    values: StudentMedicalRecordFormValues,
  ) {
    if (!institutionId || !studentId) {
      return;
    }

    try {
      await upsertMedicalRecordMutation.mutateAsync({
        params: {
          path: {
            studentId,
          },
        },
        body: {
          allergies: toNullableText(values.allergies),
          conditions: toNullableText(values.conditions),
          medications: toNullableText(values.medications),
          emergencyMedicalInfo: toNullableText(values.emergencyMedicalInfo),
          doctorName: toNullableText(values.doctorName),
          doctorPhone: toNullableText(values.doctorPhone),
          insuranceInfo: toNullableText(values.insuranceInfo),
        },
      });

      setIsEditingMedicalRecord(false);
      toast.success("Medical records saved.");
    } catch (error) {
      toast.error(
        extractApiError(
          error,
          "Could not save medical records. Please try again.",
        ),
      );
    }
  }

  async function handleDisciplinaryEntrySubmit(
    values: StudentDisciplinaryEntryFormValues,
  ) {
    if (!institutionId || !studentId) {
      return;
    }

    try {
      await createDisciplinaryRecordMutation.mutateAsync({
        params: {
          path: {
            studentId,
          },
        },
        body: {
          incidentDate: values.incidentDate,
          severity: values.severity,
          description: values.description.trim(),
          actionTaken: toNullableText(values.actionTaken),
          parentNotified: values.parentNotified,
        },
      });

      setIsAddingDisciplinaryEntry(false);
      resetDisciplinaryEntry(EMPTY_DISCIPLINARY_ENTRY_VALUES);
      toast.success("Disciplinary entry saved.");
    } catch (error) {
      toast.error(
        extractApiError(
          error,
          "Could not save disciplinary entry. Please try again.",
        ),
      );
    }
  }

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Student</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session to manage student
            records.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canManageStudents) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Student</CardTitle>
          <CardDescription>
            Student management is available in Staff view. You are currently in{" "}
            {activeContext?.label ?? "another"} view.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link to={ERP_ROUTES.DASHBOARD}>Back to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (studentSummaryQuery.isLoading) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          Loading student profile...
        </CardContent>
      </Card>
    );
  }

  if (!studentSummaryQuery.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Student not found</CardTitle>
          <CardDescription>
            The requested record could not be loaded for this institution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Breadcrumbs
            items={[
              {
                label: "Students",
                href: appendSearch(ERP_ROUTES.STUDENTS, location.search),
              },
              { label: "Not found" },
            ]}
          />
        </CardContent>
      </Card>
    );
  }

  const summary = studentSummaryQuery.data;
  const student = summary.student;
  const latestExam = summary.exams.latestTerm;
  return (
    <EntityPageShell width="full">
      <EntityDetailPageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to={ERP_ROUTES.REPORTS_ATTENDANCE}>Attendance report</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={ERP_ROUTES.FEE_DUES}>Fee dues</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={ERP_ROUTES.EXAMS}>Exam records</Link>
            </Button>
            {studentId ? (
              <>
                <Button asChild variant="outline">
                  <Link
                    to={buildStudentTransferCertificateRoute(studentId)}
                    target="_blank"
                  >
                    <IconCertificate className="size-4" />
                    TC
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link
                    to={buildStudentBonafideCertificateRoute(studentId)}
                    target="_blank"
                  >
                    <IconCertificate className="size-4" />
                    Bonafide
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link
                    to={buildStudentCharacterCertificateRoute(studentId)}
                    target="_blank"
                  >
                    <IconCertificate className="size-4" />
                    Character
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to={buildStudentIdCardRoute(studentId)} target="_blank">
                    <IconCertificate className="size-4" />
                    ID Card
                  </Link>
                </Button>
              </>
            ) : null}
            <Button asChild size="sm" variant="ghost">
              <Link
                to={`${ERP_ROUTES.SETTINGS_AUDIT}?q=${encodeURIComponent(student.fullName)}`}
              >
                <IconHistory className="size-4" />
                View history
              </Link>
            </Button>
            <Button
              onClick={() =>
                void navigate(
                  appendSearch(ERP_ROUTES.STUDENTS, location.search),
                )
              }
              variant="outline"
            >
              Done
            </Button>
          </div>
        }
        avatar={
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-lg font-semibold text-muted-foreground">
            {toInitials(student.fullName)}
          </div>
        }
        backAction={
          <Breadcrumbs
            items={[
              {
                label: "Students",
                href: appendSearch(ERP_ROUTES.STUDENTS, location.search),
              },
              { label: student.fullName },
            ]}
          />
        }
        badges={
          <Badge
            variant={student.status === "active" ? "default" : "secondary"}
          >
            {student.status}
          </Badge>
        }
        meta={`Admission ${student.admissionNumber} • ${
          studentPlacement.placementLabel || "Placement not assigned"
        } • ${student.campusName}`}
        title={student.fullName}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          description={`${summary.attendance.present} present out of ${summary.attendance.totalMarkedDays} marked days in the last 30 days.`}
          Icon={IconCalendarStats}
          title="Attendance"
          value={`${summary.attendance.attendancePercent}%`}
        />
        <MetricCard
          description={
            summary.fees.nextDueDate
              ? `Next due on ${formatFeeDate(summary.fees.nextDueDate)}`
              : "No outstanding dues right now."
          }
          Icon={IconCurrencyRupee}
          title="Outstanding fees"
          value={formatRupees(summary.fees.totalOutstandingInPaise)}
        />
        <MetricCard
          description={
            latestExam
              ? `${latestExam.examTermName} in ${formatAcademicYear(latestExam.academicYearName)}`
              : "No marks recorded yet."
          }
          Icon={IconReportAnalytics}
          title="Latest exam"
          value={latestExam ? latestExam.overallGrade : "—"}
        />
        <MetricCard
          description={
            student.guardians.length === 1
              ? "Primary guardian contact is linked to this student."
              : "Family contacts are linked to this student."
          }
          Icon={IconUsers}
          title="Linked guardians"
          value={String(student.guardians.length)}
        />
      </div>

      <Tabs defaultValue={STUDENT_DETAIL_TAB_VALUES.OVERVIEW}>
        <TabsList className="h-auto flex-wrap rounded-2xl bg-muted/70 p-1">
          <TabsTrigger value={STUDENT_DETAIL_TAB_VALUES.OVERVIEW}>
            Student 360
          </TabsTrigger>
          <TabsTrigger value={STUDENT_DETAIL_TAB_VALUES.MEDICAL_RECORDS}>
            <IconUserHeart className="size-4" />
            Medical Records
          </TabsTrigger>
          <TabsTrigger value={STUDENT_DETAIL_TAB_VALUES.DISCIPLINARY_LOG}>
            <IconHistory className="size-4" />
            Disciplinary Log
          </TabsTrigger>
          <TabsTrigger value={STUDENT_DETAIL_TAB_VALUES.SIBLINGS}>
            Sibling links
          </TabsTrigger>
          <TabsTrigger value={STUDENT_DETAIL_TAB_VALUES.EDIT}>
            <IconEdit className="size-4" />
            Edit student
          </TabsTrigger>
        </TabsList>

        <TabsContent
          className="mt-6 flex flex-col gap-6"
          value={STUDENT_DETAIL_TAB_VALUES.OVERVIEW}
        >
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_360px]">
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance snapshot</CardTitle>
                  <CardDescription>
                    Last 30 days of recorded attendance for this student.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border bg-muted/30 p-4">
                      <p className="text-2xl font-semibold">
                        {summary.attendance.present}
                      </p>
                      <p className="text-sm text-muted-foreground">Present</p>
                    </div>
                    <div className="rounded-xl border bg-muted/30 p-4">
                      <p className="text-2xl font-semibold">
                        {summary.attendance.absent}
                      </p>
                      <p className="text-sm text-muted-foreground">Absent</p>
                    </div>
                    <div className="rounded-xl border bg-muted/30 p-4">
                      <p className="text-2xl font-semibold">
                        {summary.attendance.late}
                      </p>
                      <p className="text-sm text-muted-foreground">Late</p>
                    </div>
                    <div className="rounded-xl border bg-muted/30 p-4">
                      <p className="text-2xl font-semibold">
                        {summary.attendance.absentStreak}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Current absent streak
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">Recent records</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(summary.attendance.startDate)} to{" "}
                        {formatDate(summary.attendance.endDate)}
                      </p>
                    </div>
                    {summary.attendance.recentRecords.length > 0 ? (
                      <div className="space-y-2">
                        {summary.attendance.recentRecords.map((record) => (
                          <div
                            key={`${record.date}-${record.status}`}
                            className="flex items-center justify-between rounded-xl border px-4 py-3"
                          >
                            <div>
                              <p className="text-sm font-medium">
                                {formatDate(record.date)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Attendance entry
                              </p>
                            </div>
                            <Badge
                              variant={attendanceBadgeVariant(record.status)}
                            >
                              {
                                ATTENDANCE_STATUS_LABELS[
                                  record.status as keyof typeof ATTENDANCE_STATUS_LABELS
                                ]
                              }
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No attendance has been marked for this student yet.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fees snapshot</CardTitle>
                  <CardDescription>
                    Outstanding dues, recent assignments, and latest payments.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border bg-muted/30 p-4">
                      <p className="text-2xl font-semibold">
                        {formatRupees(summary.fees.totalOutstandingInPaise)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Outstanding
                      </p>
                    </div>
                    <div className="rounded-xl border bg-muted/30 p-4">
                      <p className="text-2xl font-semibold">
                        {formatRupees(summary.fees.totalPaidInPaise)}
                      </p>
                      <p className="text-sm text-muted-foreground">Collected</p>
                    </div>
                    <div className="rounded-xl border bg-muted/30 p-4">
                      <p className="text-2xl font-semibold">
                        {summary.fees.overdueCount}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Overdue items
                      </p>
                    </div>
                    <div className="rounded-xl border bg-muted/30 p-4">
                      <p className="text-2xl font-semibold">
                        {summary.fees.paymentCount}
                      </p>
                      <p className="text-sm text-muted-foreground">Payments</p>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Open assignments</p>
                      {summary.fees.recentAssignments.length > 0 ? (
                        summary.fees.recentAssignments.map((assignment) => (
                          <div
                            key={assignment.id}
                            className="rounded-xl border px-4 py-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium">
                                  {assignment.feeStructureName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {assignment.installmentLabel
                                    ? `${assignment.installmentLabel} • `
                                    : ""}
                                  Due {formatFeeDate(assignment.dueDate)}
                                </p>
                              </div>
                              <Badge variant="secondary">
                                {assignment.status}
                              </Badge>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                              <span>
                                Assigned{" "}
                                {formatRupees(assignment.assignedAmountInPaise)}
                              </span>
                              <span>
                                Paid{" "}
                                {formatRupees(assignment.paidAmountInPaise)}
                              </span>
                              <span>
                                Due{" "}
                                {formatRupees(
                                  assignment.outstandingAmountInPaise,
                                )}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No fee assignments are visible for this student.
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-medium">Recent payments</p>
                      {summary.fees.recentPayments.length > 0 ? (
                        summary.fees.recentPayments.map((payment) => (
                          <div
                            key={payment.id}
                            className="rounded-xl border px-4 py-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium">
                                  {formatRupees(payment.amountInPaise)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFeeDate(payment.paymentDate)} •{" "}
                                  {payment.paymentMethod.replaceAll("_", " ")}
                                </p>
                              </div>
                              <IconReceipt className="size-4 text-muted-foreground" />
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No payments have been collected for this student yet.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Exam snapshot</CardTitle>
                  <CardDescription>
                    Latest overall performance and recent exam terms.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  {latestExam ? (
                    <div className="rounded-2xl border bg-muted/25 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-semibold">
                            {latestExam.examTermName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatAcademicYear(latestExam.academicYearName)} •
                            Closed on {formatDate(latestExam.endDate)}
                          </p>
                        </div>
                        <Badge variant="default">
                          Grade {latestExam.overallGrade}
                        </Badge>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border bg-background p-4">
                          <p className="text-2xl font-semibold">
                            {latestExam.overallPercent}%
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Overall percent
                          </p>
                        </div>
                        <div className="rounded-xl border bg-background p-4">
                          <p className="text-2xl font-semibold">
                            {latestExam.totalObtainedMarks}/
                            {latestExam.totalMaxMarks}
                          </p>
                          <p className="text-sm text-muted-foreground">Marks</p>
                        </div>
                        <div className="rounded-xl border bg-background p-4">
                          <p className="text-2xl font-semibold">
                            {latestExam.subjectCount}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Subjects
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No exam marks have been recorded for this student yet.
                    </p>
                  )}

                  {summary.exams.recentTerms.length > 1 ? (
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Recent terms</p>
                      {summary.exams.recentTerms.slice(1).map((term) => (
                        <div
                          key={term.examTermId}
                          className="flex items-center justify-between rounded-xl border px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {term.examTermName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatAcademicYear(term.academicYearName)} •{" "}
                              {formatDate(term.endDate)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {term.overallPercent}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Grade {term.overallGrade}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile snapshot</CardTitle>
                  <CardDescription>
                    Current placement and identity details for daily operations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div>
                    <p className="text-sm font-medium">{student.campusName}</p>
                    <p className="text-xs text-muted-foreground">Campus</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium">
                      {studentPlacement.placementLabel || "Not assigned"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {studentPlacement.isManagedEnrollment
                        ? "Current class and section"
                        : "Student profile placement"}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium">
                      {studentPlacement.academicYearName
                        ? formatAcademicYear(studentPlacement.academicYearName)
                        : "Not linked to an academic year"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {studentPlacement.isManagedEnrollment
                        ? "Current academic year"
                        : "Enrollment academic year"}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium">
                      {student.admissionNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Admission number
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Linked guardians</CardTitle>
                  <CardDescription>
                    Guardians available for outreach and student follow-up.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {student.guardians.map((guardian) => (
                    <div key={guardian.membershipId} className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{guardian.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatPhone(guardian.mobile)}
                            {guardian.email ? ` • ${guardian.email}` : ""}
                          </p>
                        </div>
                        <Badge
                          variant={guardian.isPrimary ? "default" : "outline"}
                        >
                          {guardian.isPrimary
                            ? "Primary"
                            : guardian.relationship}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Latest activity</CardTitle>
                  <CardDescription>
                    A quick timeline across profile, attendance, fees, and exam
                    events.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {summary.timeline.length > 0 ? (
                    summary.timeline.map((event, index) => (
                      <div key={`${event.type}-${event.occurredAt}-${index}`}>
                        <div className="flex items-start gap-3">
                          <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                            {event.type === "fee_payment" ? (
                              <IconCurrencyRupee className="size-4" />
                            ) : event.type === "attendance" ? (
                              <IconCalendarStats className="size-4" />
                            ) : event.type === "exam" ? (
                              <IconSchool className="size-4" />
                            ) : event.type === "guardian" ? (
                              <IconUsers className="size-4" />
                            ) : (
                              <IconTimeline className="size-4" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-medium">
                                {event.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDateTime(event.occurredAt)}
                              </p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {event.description}
                            </p>
                          </div>
                        </div>
                        {index < summary.timeline.length - 1 ? (
                          <Separator className="mt-4" />
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No recent activity is available for this student yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent
          className="mt-6 flex flex-col gap-6"
          value={STUDENT_DETAIL_TAB_VALUES.MEDICAL_RECORDS}
        >
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Medical Records</CardTitle>
                <CardDescription>
                  Track allergies, medical conditions, medications, and emergency
                  support details for this student.
                </CardDescription>
              </div>
              {isEditingMedicalRecord ? null : (
                <Button
                  className="h-10 rounded-lg"
                  disabled={studentMedicalRecordQuery.isLoading}
                  onClick={() => {
                    setIsEditingMedicalRecord(true);
                    resetMedicalRecord(medicalRecordDefaultValues);
                  }}
                  type="button"
                  variant="outline"
                >
                  {studentMedicalRecordQuery.data ? "Edit" : "Add"}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {studentMedicalRecordQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">
                  Loading medical records...
                </p>
              ) : medicalRecordError ? (
                <p className="text-sm text-destructive">
                  {medicalRecordError.message}
                </p>
              ) : isEditingMedicalRecord ? (
                <form
                  onSubmit={handleSubmitMedicalRecord(handleMedicalRecordSubmit)}
                >
                  <FieldGroup className="gap-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Controller
                        control={medicalRecordControl}
                        name="allergies"
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid || undefined}>
                            <FieldLabel htmlFor="student-medical-allergies">
                              Allergies
                            </FieldLabel>
                            <FieldContent>
                              <Input
                                {...field}
                                aria-invalid={fieldState.invalid}
                                id="student-medical-allergies"
                              />
                              <FieldError>{fieldState.error?.message}</FieldError>
                            </FieldContent>
                          </Field>
                        )}
                      />
                      <Controller
                        control={medicalRecordControl}
                        name="conditions"
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid || undefined}>
                            <FieldLabel htmlFor="student-medical-conditions">
                              Medical conditions
                            </FieldLabel>
                            <FieldContent>
                              <Input
                                {...field}
                                aria-invalid={fieldState.invalid}
                                id="student-medical-conditions"
                              />
                              <FieldError>{fieldState.error?.message}</FieldError>
                            </FieldContent>
                          </Field>
                        )}
                      />
                      <Controller
                        control={medicalRecordControl}
                        name="medications"
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid || undefined}>
                            <FieldLabel htmlFor="student-medical-medications">
                              Medications
                            </FieldLabel>
                            <FieldContent>
                              <Input
                                {...field}
                                aria-invalid={fieldState.invalid}
                                id="student-medical-medications"
                              />
                              <FieldError>{fieldState.error?.message}</FieldError>
                            </FieldContent>
                          </Field>
                        )}
                      />
                      <Controller
                        control={medicalRecordControl}
                        name="doctorName"
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid || undefined}>
                            <FieldLabel htmlFor="student-medical-doctor-name">
                              Doctor name
                            </FieldLabel>
                            <FieldContent>
                              <Input
                                {...field}
                                aria-invalid={fieldState.invalid}
                                id="student-medical-doctor-name"
                              />
                              <FieldError>{fieldState.error?.message}</FieldError>
                            </FieldContent>
                          </Field>
                        )}
                      />
                      <Controller
                        control={medicalRecordControl}
                        name="doctorPhone"
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid || undefined}>
                            <FieldLabel htmlFor="student-medical-doctor-phone">
                              Doctor phone
                            </FieldLabel>
                            <FieldContent>
                              <Input
                                {...field}
                                aria-invalid={fieldState.invalid}
                                id="student-medical-doctor-phone"
                                inputMode="tel"
                              />
                              <FieldError>{fieldState.error?.message}</FieldError>
                            </FieldContent>
                          </Field>
                        )}
                      />
                      <Controller
                        control={medicalRecordControl}
                        name="insuranceInfo"
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid || undefined}>
                            <FieldLabel htmlFor="student-medical-insurance-info">
                              Insurance details
                            </FieldLabel>
                            <FieldContent>
                              <Input
                                {...field}
                                aria-invalid={fieldState.invalid}
                                id="student-medical-insurance-info"
                              />
                              <FieldError>{fieldState.error?.message}</FieldError>
                            </FieldContent>
                          </Field>
                        )}
                      />
                    </div>
                    <Controller
                      control={medicalRecordControl}
                      name="emergencyMedicalInfo"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid || undefined}>
                          <FieldLabel htmlFor="student-medical-emergency-info">
                            Emergency contact info
                          </FieldLabel>
                          <FieldContent>
                            <Input
                              {...field}
                              aria-invalid={fieldState.invalid}
                              id="student-medical-emergency-info"
                              placeholder="Emergency contact details and instructions"
                            />
                            <FieldError>{fieldState.error?.message}</FieldError>
                          </FieldContent>
                        </Field>
                      )}
                    />
                    <div className="flex gap-2">
                      <Button
                        className="h-10 rounded-lg"
                        disabled={upsertMedicalRecordMutation.isPending}
                        type="submit"
                      >
                        {upsertMedicalRecordMutation.isPending
                          ? "Saving..."
                          : "Save medical records"}
                      </Button>
                      <Button
                        className="h-10 rounded-lg"
                        onClick={() => {
                          setIsEditingMedicalRecord(false);
                          resetMedicalRecord(medicalRecordDefaultValues);
                        }}
                        type="button"
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </FieldGroup>
                </form>
              ) : studentMedicalRecordQuery.data ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium">
                      {studentMedicalRecordQuery.data.allergies || "Not provided"}
                    </p>
                    <p className="text-xs text-muted-foreground">Allergies</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {studentMedicalRecordQuery.data.conditions || "Not provided"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Medical conditions
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {studentMedicalRecordQuery.data.medications || "Not provided"}
                    </p>
                    <p className="text-xs text-muted-foreground">Medications</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {studentMedicalRecordQuery.data.doctorName || "Not provided"}
                    </p>
                    <p className="text-xs text-muted-foreground">Doctor name</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {studentMedicalRecordQuery.data.doctorPhone || "Not provided"}
                    </p>
                    <p className="text-xs text-muted-foreground">Doctor phone</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {studentMedicalRecordQuery.data.insuranceInfo ||
                        "Not provided"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Insurance details
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-sm font-medium">
                      {studentMedicalRecordQuery.data.emergencyMedicalInfo ||
                        "Not provided"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Emergency contact info
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                  No medical records added yet. Click Add to create the first
                  record.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          className="mt-6 flex flex-col gap-6"
          value={STUDENT_DETAIL_TAB_VALUES.DISCIPLINARY_LOG}
        >
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Disciplinary Log</CardTitle>
                <CardDescription>
                  Record incidents, actions taken, and parent notification
                  status for this student.
                </CardDescription>
              </div>
              {isAddingDisciplinaryEntry ? null : (
                <Button
                  className="h-10 rounded-lg"
                  onClick={() => setIsAddingDisciplinaryEntry(true)}
                  type="button"
                  variant="outline"
                >
                  Add Entry
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {isAddingDisciplinaryEntry ? (
                <form
                  onSubmit={handleSubmitDisciplinaryEntry(
                    handleDisciplinaryEntrySubmit,
                  )}
                >
                  <FieldGroup className="gap-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Controller
                        control={disciplinaryEntryControl}
                        name="incidentDate"
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid || undefined}>
                            <FieldLabel htmlFor="student-disciplinary-incident-date" required>
                              Incident date
                            </FieldLabel>
                            <FieldContent>
                              <Input
                                {...field}
                                aria-invalid={fieldState.invalid}
                                id="student-disciplinary-incident-date"
                                type="date"
                              />
                              <FieldError>{fieldState.error?.message}</FieldError>
                            </FieldContent>
                          </Field>
                        )}
                      />
                      <Controller
                        control={disciplinaryEntryControl}
                        name="severity"
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid || undefined}>
                            <FieldLabel required>Severity</FieldLabel>
                            <FieldContent>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger aria-invalid={fieldState.invalid}>
                                  <SelectValue placeholder="Select severity" />
                                </SelectTrigger>
                                <SelectContent>
                                  {DISCIPLINARY_SEVERITY_OPTIONS.map((severity) => (
                                    <SelectItem key={severity} value={severity}>
                                      {DISCIPLINARY_SEVERITY_LABELS[severity]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FieldError>{fieldState.error?.message}</FieldError>
                            </FieldContent>
                          </Field>
                        )}
                      />
                    </div>
                    <Controller
                      control={disciplinaryEntryControl}
                      name="description"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid || undefined}>
                          <FieldLabel htmlFor="student-disciplinary-description" required>
                            Description of the incident
                          </FieldLabel>
                          <FieldContent>
                            <Input
                              {...field}
                              aria-invalid={fieldState.invalid}
                              id="student-disciplinary-description"
                            />
                            <FieldError>{fieldState.error?.message}</FieldError>
                          </FieldContent>
                        </Field>
                      )}
                    />
                    <Controller
                      control={disciplinaryEntryControl}
                      name="actionTaken"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid || undefined}>
                          <FieldLabel htmlFor="student-disciplinary-action-taken">
                            Action taken
                          </FieldLabel>
                          <FieldContent>
                            <Input
                              {...field}
                              aria-invalid={fieldState.invalid}
                              id="student-disciplinary-action-taken"
                              placeholder="Optional internal note"
                            />
                            <FieldError>{fieldState.error?.message}</FieldError>
                          </FieldContent>
                        </Field>
                      )}
                    />
                    <Controller
                      control={disciplinaryEntryControl}
                      name="parentNotified"
                      render={({ field }) => (
                        <Field>
                          <FieldContent>
                            <label
                              className="flex items-center gap-3 rounded-lg border px-3 py-2"
                              htmlFor="student-disciplinary-parent-notified"
                            >
                              <Checkbox
                                checked={field.value}
                                id="student-disciplinary-parent-notified"
                                onCheckedChange={(checked) =>
                                  field.onChange(checked === true)
                                }
                              />
                              <span className="text-sm font-medium">
                                Parent notified
                              </span>
                            </label>
                          </FieldContent>
                        </Field>
                      )}
                    />
                    <div className="flex gap-2">
                      <Button
                        className="h-10 rounded-lg"
                        disabled={createDisciplinaryRecordMutation.isPending}
                        type="submit"
                      >
                        {createDisciplinaryRecordMutation.isPending
                          ? "Saving..."
                          : "Save entry"}
                      </Button>
                      <Button
                        className="h-10 rounded-lg"
                        onClick={() => setIsAddingDisciplinaryEntry(false)}
                        type="button"
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </FieldGroup>
                </form>
              ) : null}

              {disciplinaryRecordsQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">
                  Loading disciplinary entries...
                </p>
              ) : disciplinaryRecordsError ? (
                <p className="text-sm text-destructive">
                  {disciplinaryRecordsError.message}
                </p>
              ) : disciplinaryRecordsQuery.data &&
                disciplinaryRecordsQuery.data.length > 0 ? (
                <div className="space-y-3">
                  {disciplinaryRecordsQuery.data.map((record) => (
                    <div
                      key={record.id}
                      className="rounded-xl border p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">
                            {formatDate(record.incidentDate)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Logged by {record.reportedByName}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {DISCIPLINARY_SEVERITY_LABELS[record.severity]}
                        </Badge>
                      </div>
                      <div className="mt-3 space-y-2">
                        <p className="text-sm">{record.description}</p>
                        {record.actionTaken ? (
                          <p className="text-xs text-muted-foreground">
                            Action taken: {record.actionTaken}
                          </p>
                        ) : null}
                        <p className="text-xs text-muted-foreground">
                          Parent notified: {record.parentNotified ? "Yes" : "No"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                  No disciplinary entries yet. Click Add Entry to create the
                  first record.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          className="mt-6 flex flex-col gap-6"
          value={STUDENT_DETAIL_TAB_VALUES.SIBLINGS}
        >
          <Card>
            <CardHeader>
              <CardTitle>Sibling links</CardTitle>
              <CardDescription>
                Link related student records so staff can move between siblings
                from one place.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
                <Select
                  onValueChange={setSelectedSiblingId}
                  value={selectedSiblingId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSiblingOptions.length > 0 ? (
                      availableSiblingOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.fullName} ({option.admissionNumber}) -{" "}
                          {option.campusName}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem disabled value="none">
                        No students available to link
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Select
                  onValueChange={(value) =>
                    setSelectedSiblingRelationship(value as SiblingRelationship)
                  }
                  value={selectedSiblingRelationship}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {SIBLING_RELATIONSHIP_OPTIONS.map((relationship) => (
                      <SelectItem key={relationship} value={relationship}>
                        {SIBLING_RELATIONSHIP_LABELS[relationship]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  className="h-10 rounded-lg"
                  disabled={
                    !selectedSiblingId ||
                    !selectedSiblingRelationship ||
                    createSiblingLinkMutation.isPending
                  }
                  onClick={() => void handleCreateSiblingLink()}
                  type="button"
                >
                  {createSiblingLinkMutation.isPending
                    ? "Linking..."
                    : "Link sibling"}
                </Button>
              </div>

              {siblingsQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">
                  Loading sibling links...
                </p>
              ) : siblingsQuery.data && siblingsQuery.data.length > 0 ? (
                <div className="space-y-3">
                  {siblingsQuery.data.map((sibling) => (
                    <div
                      key={sibling.id}
                      className="flex flex-col gap-4 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {sibling.siblingFullName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {SIBLING_RELATIONSHIP_LABELS[sibling.relationship]}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Admission no. {sibling.siblingAdmissionNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {sibling.siblingClassName}{" "}
                          {sibling.siblingSectionName}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          asChild
                          className="h-8 rounded-md"
                          variant="outline"
                        >
                          <Link
                            to={appendSearch(
                              buildStudentDetailRoute(sibling.siblingStudentId),
                              location.search,
                            )}
                          >
                            Open student
                          </Link>
                        </Button>
                        <Button
                          className="h-8 rounded-md"
                          onClick={() =>
                            setPendingDeleteSibling({
                              id: sibling.id,
                              name: sibling.siblingFullName,
                            })
                          }
                          type="button"
                          variant="destructive"
                        >
                          Remove link
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                  No sibling links yet. Select another student above to create
                  the first link.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent
          className="mt-6 flex flex-col gap-6"
          value={STUDENT_DETAIL_TAB_VALUES.EDIT}
        >
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <Card>
              <CardHeader>
                <CardTitle>Edit student</CardTitle>
                <CardDescription>
                  Update the student profile and linked guardians for the active
                  campus.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StudentForm
                  academicYears={academicYearsQuery.data?.rows ?? []}
                  campusId={student.campusId}
                  campusName={student.campusName}
                  customFields={customFields}
                  defaultValues={defaultValues}
                  errorMessage={updateError?.message}
                  isPending={updateStudentMutation.isPending}
                  mode="edit"
                  onSubmit={onSubmit}
                  submitLabel="Save changes"
                />
              </CardContent>
            </Card>

            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Current enrollment</CardTitle>
                  <CardDescription>
                    Backend-owned placement for the active academic year, class,
                    and section.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {student.currentEnrollment ? (
                    <>
                      <div>
                        <p className="text-sm font-medium">
                          {formatAcademicYear(
                            student.currentEnrollment.academicYearName,
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Academic year
                        </p>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium">
                          {student.currentEnrollment.className}
                        </p>
                        <p className="text-xs text-muted-foreground">Class</p>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium">
                          {student.currentEnrollment.sectionName}
                        </p>
                        <p className="text-xs text-muted-foreground">Section</p>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        No backend-managed current enrollment is linked yet.
                      </p>
                      {studentPlacement.placementLabel ? (
                        <>
                          <Separator />
                          <div>
                            <p className="text-sm font-medium">
                              {studentPlacement.placementLabel}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Student profile placement
                            </p>
                          </div>
                        </>
                      ) : null}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Linked guardians</CardTitle>
                  <CardDescription>
                    Current guardian contacts available to the student record.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {student.guardians.map((guardian, index) => (
                    <div key={guardian.membershipId} className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{guardian.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatPhone(guardian.mobile)}
                            {guardian.email ? ` • ${guardian.email}` : ""}
                          </p>
                        </div>
                        <Badge
                          variant={guardian.isPrimary ? "default" : "outline"}
                        >
                          {guardian.isPrimary
                            ? "Primary"
                            : guardian.relationship}
                        </Badge>
                      </div>
                      {index < student.guardians.length - 1 ? (
                        <Separator />
                      ) : null}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      <ConfirmDialog
        confirmLabel="Remove sibling link"
        description={`Remove the sibling link with ${pendingDeleteSibling?.name ?? "this student"}?`}
        isPending={deleteSiblingLinkMutation.isPending}
        onConfirm={() => void handleDeleteSiblingLink()}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDeleteSibling(null);
          }
        }}
        open={Boolean(pendingDeleteSibling)}
        title="Remove sibling link"
      />
    </EntityPageShell>
  );
}
