import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
import {
  useClassQuery,
  useUpdateClassMutation,
} from "@/features/classes/api/use-classes";
import { ClassForm } from "@/features/classes/ui/class-form";
import { ERP_ROUTES } from "@/constants/routes";
import type { ClassFormValues } from "@/features/classes/model/class-form-schema";

export function ClassDetailPage() {
  const navigate = useNavigate();
  const { classId } = useParams();
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const institutionId = session?.activeOrganization?.id;
  const canManageClasses = isStaffContext(session);
  const activeCampusId = session?.activeCampus?.id;
  const canQueryClass = canManageClasses && Boolean(institutionId);
  const classQuery = useClassQuery(canQueryClass, classId);
  const updateClassMutation = useUpdateClassMutation();
  const updateError = updateClassMutation.error as Error | null | undefined;

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
      })),
    };
  }, [classQuery.data]);

  async function onSubmit(values: ClassFormValues) {
    if (!institutionId || !classId) {
      return;
    }

    await updateClassMutation.mutateAsync({
      params: { path: { classId } },
      body: { ...values, campusId: activeCampusId ?? "" },
    });

    toast.success("Class updated.");
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <Button asChild className="-ml-3" size="sm" variant="ghost">
            <Link to={ERP_ROUTES.CLASSES}>
              <IconChevronLeft data-icon="inline-start" />
              Back to classes
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">{schoolClass.name}</h2>
            <Badge>{schoolClass.campusName}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Update the class record and reconcile its section list for this campus.
          </p>
        </div>
        <Button onClick={() => void navigate(ERP_ROUTES.CLASSES)} variant="outline">
          Done
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Edit class</CardTitle>
            <CardDescription>
              Keep the structure simple: class identity, campus, and section names.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ClassForm
              defaultValues={defaultValues}
              errorMessage={updateError?.message}
              isPending={updateClassMutation.isPending}
              onSubmit={onSubmit}
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
                  <p className="text-sm font-medium">{section.name}</p>
                  <Badge variant="outline">Section {index + 1}</Badge>
                </div>
                {index < schoolClass.sections.length - 1 ? <Separator /> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
