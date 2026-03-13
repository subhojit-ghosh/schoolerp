import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  IconArrowRight,
  IconBuildingEstate,
  IconLayersIntersect2,
  IconPlus,
} from "@tabler/icons-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { cn } from "@repo/ui/lib/utils";
import {
  getActiveContext,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useClassesQuery,
  useCreateClassMutation,
} from "@/features/classes/api/use-classes";
import { ClassForm } from "@/features/classes/ui/class-form";
import { ERP_ROUTES } from "@/constants/routes";
import type { ClassFormValues } from "@/features/classes/model/class-form-schema";

const DEFAULT_VALUES: ClassFormValues = {
  name: "",
  code: "",
  campusId: "",
  sections: [{ name: "" }],
};

export function ClassesPage() {
  const [showForm, setShowForm] = useState(false);
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const institutionId = session?.activeOrganization?.id;
  const canManageClasses = isStaffContext(session);
  const managedInstitutionId = canManageClasses ? institutionId : undefined;
  const campuses = session?.campuses ?? [];
  const classesQuery = useClassesQuery(managedInstitutionId);
  const createClassMutation = useCreateClassMutation(managedInstitutionId);
  const createError = createClassMutation.error as Error | null | undefined;

  const classes = classesQuery.data ?? [];
  const totalSections = classes.reduce(
    (count, schoolClass) => count + schoolClass.sections.length,
    0,
  );

  async function onSubmit(values: ClassFormValues) {
    if (!institutionId) {
      return;
    }

    await createClassMutation.mutateAsync({
      params: { path: { institutionId } },
      body: values,
    });

    toast.success("Class created.");
    setShowForm(false);
  }

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Classes</CardTitle>
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
          <CardTitle>Classes</CardTitle>
          <CardDescription>
            Class administration is available in Staff view. You are currently in{" "}
            {activeContext?.label ?? "another"} view.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_360px]">
        <Card className="border-border/70 shadow-sm">
          <CardContent className="flex flex-col gap-6 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <Badge className="rounded-full px-3 py-1" variant="secondary">
                  <IconLayersIntersect2 className="mr-1.5 size-3.5" />
                  Class structure
                </Badge>
                <div className="space-y-2">
                  <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                    Classes and sections
                  </h2>
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                    Keep the structure intentionally shallow: assign each class to a campus,
                    define the active sections, and leave allocations and timetables for later.
                  </p>
                </div>
              </div>
              <Button
                className="h-11 rounded-xl px-5 text-base shadow-sm"
                onClick={() => setShowForm((value) => !value)}
                variant={showForm ? "outline" : "default"}
              >
                <IconPlus className="size-4" />
                {showForm ? "Close form" : "Add class"}
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-background/85 p-4 shadow-xs">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/75">
                  Active classes
                </p>
                <div className="mt-3 text-3xl font-semibold tracking-tight">
                  {classesQuery.isLoading ? "—" : classes.length}
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/85 p-4 shadow-xs">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/75">
                  Active sections
                </p>
                <div className="mt-3 text-3xl font-semibold tracking-tight">
                  {classesQuery.isLoading ? "—" : totalSections}
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/85 p-4 shadow-xs">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/75">
                  Default campus
                </p>
                <div className="mt-3 flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <IconBuildingEstate className="size-4 text-[var(--primary)]" />
                  {session?.activeCampus?.name ?? "No campus"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Module scope</CardTitle>
            <CardDescription>
              This slice stops at roster structure so the backend boundary stays clean.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/25 p-4">
              Create and edit class records with a campus and a small section list.
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              No timetable, teacher allocation, seat planning, or promotion workflow yet.
            </div>
          </CardContent>
        </Card>
      </section>

      {showForm ? (
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Create class</CardTitle>
            <CardDescription>
              Add a class and define the sections available for admissions and roster views.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ClassForm
              campuses={campuses}
              defaultValues={{
                ...DEFAULT_VALUES,
                campusId: session?.activeCampus?.id ?? "",
              }}
              errorMessage={createError?.message}
              isPending={createClassMutation.isPending}
              onCancel={() => setShowForm(false)}
              onSubmit={onSubmit}
              submitLabel="Create class"
            />
          </CardContent>
        </Card>
      ) : null}

      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardHeader className="border-b border-border/70 bg-muted/20 pb-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Class list</CardTitle>
              <CardDescription>
                Open any record to edit campus assignment or reconcile sections.
              </CardDescription>
            </div>
            <Badge className="rounded-full px-3 py-1.5" variant="outline">
              {classesQuery.isLoading
                ? "Loading…"
                : `${classes.length} active ${classes.length === 1 ? "class" : "classes"}`}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {classesQuery.isLoading ? (
            <div className="flex min-h-56 items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 text-sm text-muted-foreground">
              Loading classes…
            </div>
          ) : classes.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 text-center">
              <div className="space-y-1">
                <p className="text-base font-semibold text-foreground">No classes yet</p>
                <p className="max-w-md text-sm leading-6 text-muted-foreground">
                  Start with the first class and a couple of sections so student and attendance flows have a stable structure later.
                </p>
              </div>
              <Button className="rounded-xl px-4" onClick={() => setShowForm(true)}>
                <IconPlus className="size-4" />
                Add first class
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {classes.map((schoolClass, index) => (
                <Link
                  key={schoolClass.id}
                  className={cn(
                    "group relative flex flex-wrap items-center gap-4 overflow-hidden rounded-2xl border border-border/70 bg-card px-5 py-4 shadow-sm transition-all hover:border-primary/35 hover:shadow-md",
                    index === 0 ? "border-primary/20" : undefined,
                  )}
                  to={ERP_ROUTES.CLASS_DETAIL.replace(":classId", schoolClass.id)}
                >
                  <div className="min-w-[220px] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold tracking-tight text-foreground">
                        {schoolClass.name}
                      </p>
                      {schoolClass.code ? (
                        <Badge className="rounded-full px-3 py-1 font-mono" variant="outline">
                          {schoolClass.code}
                        </Badge>
                      ) : null}
                      <Badge className="rounded-full px-3 py-1" variant="secondary">
                        {schoolClass.campusName}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {schoolClass.sections.length}{" "}
                      {schoolClass.sections.length === 1 ? "section" : "sections"}
                    </p>
                  </div>
                  <div className="flex min-w-[220px] flex-1 flex-wrap gap-2">
                    {schoolClass.sections.map((section) => (
                      <Badge key={section.id} className="rounded-full px-3 py-1" variant="outline">
                        {section.name}
                      </Badge>
                    ))}
                  </div>
                  <div className="ml-auto flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                    Edit
                    <IconArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
