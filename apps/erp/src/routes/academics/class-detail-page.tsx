import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router";
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
import {
  EntityDetailPageHeader,
  EntityPageShell,
} from "@/components/entities/entity-page-shell";
import { Separator } from "@repo/ui/components/ui/separator";
import {
  getActiveContext,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useClassQuery,
  useUpdateClassMutation,
} from "@/features/classes/api/use-classes";
import { ClassForm } from "@/features/classes/ui/class-form";
import { useStaffQuery } from "@/features/staff/api/use-staff";
import { ERP_ROUTES } from "@/constants/routes";
import type { ClassFormValues } from "@/features/classes/model/class-form-schema";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

export function ClassDetailPage() {
  const navigate = useNavigate();
  const { classId } = useParams();
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const institutionId = session?.activeOrganization?.id;
  const canManageClasses = isStaffContext(session);
  const canQueryClass = canManageClasses && Boolean(institutionId);
  const classQuery = useClassQuery(canQueryClass, classId);
  const updateClassMutation = useUpdateClassMutation();
  const updateError = updateClassMutation.error as Error | null | undefined;
  const staffQuery = useStaffQuery(institutionId, {
    limit: 500,
    status: ["active"],
  });

  const staffOptions = useMemo(
    () =>
      (staffQuery.data?.rows ?? []).map((staff) => ({
        id: staff.id,
        name: staff.name,
      })),
    [staffQuery.data?.rows],
  );

  const defaultValues = useMemo<ClassFormValues>(() => {
    const schoolClass = classQuery.data;

    if (!schoolClass) {
      return { name: "", sections: [{ name: "" }] };
    }

    return {
      name: schoolClass.name,
      sections: schoolClass.sections.map((section) => ({
        id: section.id,
        name: section.name,
        classTeacherMembershipId:
          section.classTeacherMembershipId ?? undefined,
      })),
    };
  }, [classQuery.data]);

  async function onSubmit(values: ClassFormValues) {
    if (!institutionId || !classId) {
      return;
    }

    await updateClassMutation.mutateAsync({
      params: { path: { classId } },
      body: values,
    });

    toast.success(ERP_TOAST_MESSAGES.updated(ERP_TOAST_SUBJECTS.CLASS));
  }

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Class</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session to manage class records.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canManageClasses) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Class</CardTitle>
          <CardDescription>
            Class editing is available in Staff view. You are currently in{" "}
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

  if (classQuery.isLoading) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          Loading class details...
        </CardContent>
      </Card>
    );
  }

  if (!classQuery.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Class not found</CardTitle>
          <CardDescription>
            The requested class could not be loaded for this institution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link to={ERP_ROUTES.CLASSES}>
              <IconChevronLeft data-icon="inline-start" />
              Back to classes
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const schoolClass = classQuery.data;

  return (
    <EntityPageShell width="full">
      <EntityDetailPageHeader
        actions={
          <Button
            onClick={() => void navigate(ERP_ROUTES.CLASSES)}
            variant="outline"
          >
            Done
          </Button>
        }
        backAction={
          <Button asChild className="-ml-3" size="sm" variant="ghost">
            <Link to={ERP_ROUTES.CLASSES}>
              <IconChevronLeft data-icon="inline-start" />
              Back to classes
            </Link>
          </Button>
        }
        badges={<Badge>{schoolClass.campusName}</Badge>}
        meta="Update the class record and reconcile its section list for this campus."
        title={schoolClass.name}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Edit class</CardTitle>
            <CardDescription>
              Keep the structure simple: class identity, campus, and section
              names.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ClassForm
              defaultValues={defaultValues}
              errorMessage={updateError?.message}
              isPending={updateClassMutation.isPending}
              onSubmit={onSubmit}
              staffOptions={staffOptions}
              submitLabel="Save changes"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sections</CardTitle>
            <CardDescription>
              Current sections attached to this class.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {schoolClass.sections.map((section, index) => (
              <div key={section.id} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{section.name}</p>
                    {section.classTeacherName ? (
                      <p className="text-xs text-muted-foreground">
                        Class teacher: {section.classTeacherName}
                      </p>
                    ) : null}
                  </div>
                  <Badge variant="outline">Section {index + 1}</Badge>
                </div>
                {index < schoolClass.sections.length - 1 ? <Separator /> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </EntityPageShell>
  );
}
