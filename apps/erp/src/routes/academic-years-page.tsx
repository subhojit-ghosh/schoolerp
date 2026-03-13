import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { IconArchive, IconCalendarStats, IconReload } from "@tabler/icons-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/ui/field";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  getActiveContext,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useAcademicYearsQuery,
  useArchiveAcademicYearMutation,
  useCreateAcademicYearMutation,
  useRestoreAcademicYearMutation,
  useSetCurrentAcademicYearMutation,
} from "@/features/academic-years/api/use-academic-years";
import {
  academicYearFormSchema,
  type AcademicYearFormValues,
} from "@/features/academic-years/model/academic-year-form-schema";

const DEFAULT_VALUES: AcademicYearFormValues = {
  name: "",
  startDate: "",
  endDate: "",
  makeCurrent: false,
};

export function AcademicYearsPage() {
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const institutionId = session?.activeOrganization?.id;
  const canManageAcademicYears = isStaffContext(session);
  const managedInstitutionId = canManageAcademicYears ? institutionId : undefined;
  const academicYearsQuery = useAcademicYearsQuery(managedInstitutionId);
  const createMutation = useCreateAcademicYearMutation(managedInstitutionId);
  const setCurrentMutation = useSetCurrentAcademicYearMutation(managedInstitutionId);
  const archiveMutation = useArchiveAcademicYearMutation(managedInstitutionId);
  const restoreMutation = useRestoreAcademicYearMutation(managedInstitutionId);
  const createError = createMutation.error as Error | null | undefined;

  const { control, handleSubmit, reset } = useForm<AcademicYearFormValues>({
    resolver: zodResolver(academicYearFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  async function onSubmit(values: AcademicYearFormValues) {
    if (!institutionId) {
      return;
    }

    await createMutation.mutateAsync({
      params: {
        path: {
          institutionId,
        },
      },
      body: values,
    });

    reset(DEFAULT_VALUES);
    toast.success("Academic year created.");
  }

  async function handleSetCurrent(academicYearId: string) {
    if (!institutionId) {
      return;
    }

    await setCurrentMutation.mutateAsync({
      params: {
        path: {
          institutionId,
          academicYearId,
        },
      },
    });

    toast.success("Current academic year updated.");
  }

  async function handleArchive(academicYearId: string) {
    if (!institutionId) {
      return;
    }

    await archiveMutation.mutateAsync({
      params: {
        path: {
          institutionId,
          academicYearId,
        },
      },
    });

    toast.success("Academic year archived.");
  }

  async function handleRestore(academicYearId: string) {
    if (!institutionId) {
      return;
    }

    await restoreMutation.mutateAsync({
      params: {
        path: {
          institutionId,
          academicYearId,
        },
      },
    });

    toast.success("Academic year restored.");
  }

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Academic years</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session to manage academic years.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canManageAcademicYears) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Academic years</CardTitle>
          <CardDescription>
            Academic-year administration is available in Staff view. You are currently in {activeContext?.label ?? "another"} view.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,420px)]">
      <Card>
        <CardHeader>
          <CardTitle>Academic years</CardTitle>
          <CardDescription>
            Control the active year and keep older records available without deleting them.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {academicYearsQuery.isLoading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Loading academic years...
            </div>
          ) : academicYearsQuery.data?.length ? (
            academicYearsQuery.data.map((academicYear) => (
              <div
                key={academicYear.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{academicYear.name}</p>
                    {academicYear.isCurrent ? <Badge>Current</Badge> : null}
                    <Badge variant="outline">{academicYear.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {academicYear.startDate} to {academicYear.endDate}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!academicYear.isCurrent ? (
                    <Button
                      disabled={setCurrentMutation.isPending}
                      onClick={() => void handleSetCurrent(academicYear.id)}
                      size="sm"
                      variant="outline"
                    >
                      <IconCalendarStats data-icon="inline-start" />
                      Make current
                    </Button>
                  ) : null}
                  {academicYear.status === "active" && !academicYear.isCurrent ? (
                    <Button
                      disabled={archiveMutation.isPending}
                      onClick={() => void handleArchive(academicYear.id)}
                      size="sm"
                      variant="outline"
                    >
                      <IconArchive data-icon="inline-start" />
                      Archive
                    </Button>
                  ) : null}
                  {academicYear.status === "archived" ? (
                    <Button
                      disabled={restoreMutation.isPending}
                      onClick={() => void handleRestore(academicYear.id)}
                      size="sm"
                      variant="outline"
                    >
                      <IconReload data-icon="inline-start" />
                      Restore
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed bg-muted/30 px-6 py-14 text-center">
              <p className="text-sm font-medium">No academic years yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create the first year to anchor timetable, attendance, and exam workflows.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create academic year</CardTitle>
          <CardDescription>
            Add a new year and optionally make it the active year immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup className="gap-5">
              <Controller
                control={control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel>Name</FieldLabel>
                    <FieldContent>
                      <Input
                        {...field}
                        aria-invalid={fieldState.invalid}
                        placeholder="2026-2027"
                      />
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </FieldContent>
                  </Field>
                )}
              />
              <Controller
                control={control}
                name="startDate"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel>Start date</FieldLabel>
                    <FieldContent>
                      <Input {...field} aria-invalid={fieldState.invalid} type="date" />
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </FieldContent>
                  </Field>
                )}
              />
              <Controller
                control={control}
                name="endDate"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel>End date</FieldLabel>
                    <FieldContent>
                      <Input {...field} aria-invalid={fieldState.invalid} type="date" />
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </FieldContent>
                  </Field>
                )}
              />
              <Controller
                control={control}
                name="makeCurrent"
                render={({ field }) => (
                  <Field>
                    <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      <Label className="text-sm font-normal">
                        Make this the active academic year now
                      </Label>
                    </div>
                  </Field>
                )}
              />

              {createError ? <FieldError>{createError.message}</FieldError> : null}

              <Button disabled={createMutation.isPending} type="submit">
                {createMutation.isPending ? "Creating..." : "Create academic year"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
