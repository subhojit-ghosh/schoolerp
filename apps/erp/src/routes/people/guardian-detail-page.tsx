import { GUARDIAN_RELATIONSHIPS } from "@repo/contracts";
import { useMemo } from "react";
import { Link, useLocation, useParams } from "react-router";
import { toast } from "sonner";
import { IconChevronLeft } from "@tabler/icons-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Separator } from "@repo/ui/components/ui/separator";
import {
  getActiveContext,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useStudentOptionsQuery } from "@/features/students/api/use-students";
import {
  useGuardianQuery,
  useLinkGuardianStudentMutation,
  useUnlinkGuardianStudentMutation,
  useUpdateGuardianMutation,
  useUpdateGuardianStudentLinkMutation,
} from "@/features/guardians/api/use-guardians";
import { GuardianForm } from "@/features/guardians/ui/guardian-form";
import { GuardianStudentLinkForm } from "@/features/guardians/ui/guardian-student-link-form";
import {
  type GuardianFormValues,
  type GuardianStudentLinkFormValues,
} from "@/features/guardians/model/guardian-form-schema";
import { ERP_ROUTES } from "@/constants/routes";
import { appendSearch } from "@/lib/routes";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

function toInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function GuardianDetailPage() {
  const location = useLocation();
  const { guardianId } = useParams();
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const institutionId = session?.activeOrganization?.id;
  const canManageGuardians = isStaffContext(session);
  const managedInstitutionId = canManageGuardians ? institutionId : undefined;
  const campuses = session?.campuses ?? [];
  const guardianQuery = useGuardianQuery(managedInstitutionId, guardianId);
  const studentOptionsQuery = useStudentOptionsQuery(managedInstitutionId);
  const updateGuardianMutation = useUpdateGuardianMutation(
    managedInstitutionId,
    guardianId,
  );
  const linkStudentMutation = useLinkGuardianStudentMutation(
    managedInstitutionId,
    guardianId,
  );
  const updateStudentLinkMutation = useUpdateGuardianStudentLinkMutation(
    managedInstitutionId,
    guardianId,
  );
  const unlinkStudentMutation = useUnlinkGuardianStudentMutation(
    managedInstitutionId,
    guardianId,
  );

  const guardianDefaultValues = useMemo<GuardianFormValues>(() => {
    const guardian = guardianQuery.data;

    if (!guardian) {
      return {
        name: "",
        mobile: "",
        email: "",
        campusId: session?.activeCampus?.id ?? "",
      };
    }

    return {
      name: guardian.name,
      mobile: guardian.mobile,
      email: guardian.email ?? "",
      campusId: guardian.campusId,
    };
  }, [guardianQuery.data, session?.activeCampus?.id]);

  const studentOptions = useMemo(
    () =>
      (studentOptionsQuery.data ?? []).map((student) => ({
        id: student.id,
        fullName: student.fullName,
        admissionNumber: student.admissionNumber,
        campusName: student.campusName,
      })),
    [studentOptionsQuery.data],
  );

  const availableStudents = useMemo(() => {
    const linkedStudentIds = new Set(
      guardianQuery.data?.linkedStudents.map((student) => student.studentId) ??
        [],
    );

    return studentOptions.filter(
      (student) => !linkedStudentIds.has(student.id),
    );
  }, [guardianQuery.data?.linkedStudents, studentOptions]);

  const addLinkDefaultValues = useMemo<GuardianStudentLinkFormValues>(
    () => ({
      studentId: availableStudents[0]?.id ?? "",
      relationship: GUARDIAN_RELATIONSHIPS.GUARDIAN,
      isPrimary: false,
    }),
    [availableStudents],
  );

  async function handleGuardianSubmit(values: GuardianFormValues) {
    if (!institutionId || !guardianId) {
      return;
    }

    await updateGuardianMutation.mutateAsync({
      params: {
        path: {
          guardianId,
        },
      },
      body: values,
    });

    toast.success(ERP_TOAST_MESSAGES.updated(ERP_TOAST_SUBJECTS.GUARDIAN));
  }

  async function handleStudentLinkSubmit(
    values: GuardianStudentLinkFormValues,
  ) {
    if (!institutionId || !guardianId) {
      return;
    }

    await linkStudentMutation.mutateAsync({
      params: {
        path: {
          guardianId,
        },
      },
      body: values,
    });

    toast.success(ERP_TOAST_MESSAGES.linked(ERP_TOAST_SUBJECTS.STUDENT));
  }

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Guardian</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session to manage guardian
            records.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canManageGuardians) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Guardian</CardTitle>
          <CardDescription>
            Guardian editing is available in Staff view. You are currently in{" "}
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

  if (guardianQuery.isLoading) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          Loading guardian details...
        </CardContent>
      </Card>
    );
  }

  if (!guardianQuery.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Guardian not found</CardTitle>
          <CardDescription>
            The requested guardian record could not be loaded for this
            institution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link to={appendSearch(ERP_ROUTES.GUARDIANS, location.search)}>
              <IconChevronLeft data-icon="inline-start" />
              Back to guardians
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const guardian = guardianQuery.data;
  const updateGuardianError = updateGuardianMutation.error as
    | Error
    | null
    | undefined;
  const linkStudentError = linkStudentMutation.error as
    | Error
    | null
    | undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-lg font-semibold text-muted-foreground">
            {toInitials(guardian.name)}
          </div>
          <div className="space-y-1">
            <Button asChild className="-ml-3" size="sm" variant="ghost">
              <Link to={appendSearch(ERP_ROUTES.GUARDIANS, location.search)}>
                <IconChevronLeft data-icon="inline-start" />
                Back to guardians
              </Link>
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-foreground">
                {guardian.name}
              </h2>
              <Badge variant="outline">{guardian.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {guardian.mobile}
              {guardian.email ? ` • ${guardian.email}` : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Edit guardian</CardTitle>
            <CardDescription>
              Update guardian contact details and primary campus assignment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GuardianForm
              campuses={campuses}
              defaultValues={guardianDefaultValues}
              errorMessage={updateGuardianError?.message}
              isPending={updateGuardianMutation.isPending}
              onSubmit={handleGuardianSubmit}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Link student</CardTitle>
            <CardDescription>
              Attach this guardian to another student and optionally mark that
              relationship as primary.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {availableStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                All current students in this institution are already linked to
                this guardian.
              </p>
            ) : (
              <GuardianStudentLinkForm
                defaultValues={addLinkDefaultValues}
                errorMessage={linkStudentError?.message}
                isPending={linkStudentMutation.isPending}
                onSubmit={handleStudentLinkSubmit}
                students={availableStudents}
                submitLabel="Link student"
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Linked students</CardTitle>
          <CardDescription>
            Manage linked students and guardian roles.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {guardian.linkedStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No students are currently linked to this guardian.
            </p>
          ) : (
            guardian.linkedStudents.map((linkedStudent, index) => {
              const linkError =
                updateStudentLinkMutation.variables?.params.path.studentId ===
                linkedStudent.studentId
                  ? (
                      updateStudentLinkMutation.error as
                        | Error
                        | null
                        | undefined
                    )?.message
                  : unlinkStudentMutation.variables?.params.path.studentId ===
                      linkedStudent.studentId
                    ? (unlinkStudentMutation.error as Error | null | undefined)
                        ?.message
                    : undefined;
              const linkPending =
                (updateStudentLinkMutation.isPending &&
                  updateStudentLinkMutation.variables?.params.path.studentId ===
                    linkedStudent.studentId) ||
                (unlinkStudentMutation.isPending &&
                  unlinkStudentMutation.variables?.params.path.studentId ===
                    linkedStudent.studentId);

              return (
                <div key={linkedStudent.studentId} className="space-y-4">
                  <GuardianStudentLinkForm
                    defaultValues={{
                      studentId: linkedStudent.studentId,
                      relationship: linkedStudent.relationship,
                      isPrimary: linkedStudent.isPrimary,
                    }}
                    errorMessage={linkError}
                    isPending={linkPending}
                    onDelete={async () => {
                      if (!institutionId || !guardianId) {
                        return;
                      }

                      await unlinkStudentMutation.mutateAsync({
                        params: {
                          path: {
                            guardianId,
                            studentId: linkedStudent.studentId,
                          },
                        },
                      });

                      toast.success(
                        ERP_TOAST_MESSAGES.unlinked(ERP_TOAST_SUBJECTS.STUDENT),
                      );
                    }}
                    onSubmit={async (values) => {
                      if (!institutionId || !guardianId) {
                        return;
                      }

                      await updateStudentLinkMutation.mutateAsync({
                        params: {
                          path: {
                            guardianId,
                            studentId: linkedStudent.studentId,
                          },
                        },
                        body: {
                          relationship: values.relationship,
                          isPrimary: values.isPrimary,
                        },
                      });

                      toast.success(
                        ERP_TOAST_MESSAGES.updated(
                          ERP_TOAST_SUBJECTS.RELATIONSHIP,
                        ),
                      );
                    }}
                    showStudentSelect={false}
                    students={studentOptions}
                    submitLabel="Save link"
                  />
                  {index < guardian.linkedStudents.length - 1 ? (
                    <Separator />
                  ) : null}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
