import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { IconBuildingEstate, IconMapPinPlus } from "@tabler/icons-react";
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
import { getActiveContext, isStaffContext } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useCampusesQuery,
  useCreateCampusMutation,
} from "@/features/campuses/api/use-campuses";
import {
  campusFormSchema,
  toCampusMutationBody,
  type CampusFormValues,
  type CampusRecord,
} from "@/features/campuses/model/campus-form-schema";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

const DEFAULT_VALUES: CampusFormValues = {
  name: "",
  slug: "",
  code: "",
  isDefault: false,
};

export function CampusesPage() {
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const institutionId = session?.activeOrganization?.id;
  const canManageCampuses = isStaffContext(session);
  const campusesQuery = useCampusesQuery(canManageCampuses && Boolean(institutionId));
  const createCampusMutation = useCreateCampusMutation();
  const createCampusError = createCampusMutation.error as Error | null | undefined;

  const { control, handleSubmit, reset } = useForm<CampusFormValues>({
    resolver: zodResolver(campusFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const campuses = useMemo(
    () => (campusesQuery.data ?? []) as CampusRecord[],
    [campusesQuery.data],
  );
  const activeCampusId = session?.activeCampus?.id;

  async function onSubmit(values: CampusFormValues) {
    await createCampusMutation.mutateAsync({
      body: toCampusMutationBody(values),
    });

    toast.success(ERP_TOAST_MESSAGES.created(ERP_TOAST_SUBJECTS.CAMPUS));
    reset(DEFAULT_VALUES);
  }

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Campuses</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session to manage campuses.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canManageCampuses) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Campuses</CardTitle>
          <CardDescription>
            Campus management is available in Staff view. You are currently in {activeContext?.label ?? "another"} view.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_360px]">
        <Card className="relative overflow-hidden border-border/70 bg-card shadow-sm">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at top left, color-mix(in srgb, var(--primary) 10%, transparent), transparent 40%), radial-gradient(circle at right center, color-mix(in srgb, var(--accent) 12%, transparent), transparent 28%)",
            }}
          />
          <CardContent className="relative flex flex-col gap-6 p-6">
            <div className="space-y-3">
              <Badge className="rounded-full px-3 py-1" variant="secondary">
                <IconBuildingEstate className="mr-1.5 size-3.5" />
                Tenant campuses
              </Badge>
              <div className="space-y-2">
                <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                  Campuses
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Add and review campus nodes inside the current institution. Each campus
                  owns its own classes, sections, student allocation, attendance, and
                  other day-to-day operational structures.
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-background/85 p-4 shadow-xs">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/75">
                  Campuses
                </p>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-3xl font-semibold tracking-tight">
                    {campusesQuery.isLoading ? "—" : campuses.length}
                  </span>
                  <span className="pb-1 text-sm text-muted-foreground">
                    active records
                  </span>
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/85 p-4 shadow-xs">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/75">
                  Default campus
                </p>
                <div className="mt-3 text-lg font-semibold tracking-tight">
                  {campuses.find((campus) => campus.isDefault)?.name ?? "—"}
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/85 p-4 shadow-xs">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/75">
                  Active in session
                </p>
                <div className="mt-3 text-lg font-semibold tracking-tight">
                  {session?.activeCampus?.name ?? "No campus"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Add campus</CardTitle>
            <CardDescription>
              Create a new campus so staff can switch into it and define classes,
              sections, and local operations there.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <FieldGroup className="gap-4">
                <Controller
                  control={control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel htmlFor="campus-name">Campus name</FieldLabel>
                      <FieldContent>
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          id="campus-name"
                          placeholder="Naihati Campus"
                        />
                        <FieldError>{fieldState.error?.message}</FieldError>
                      </FieldContent>
                    </Field>
                  )}
                />

                <Controller
                  control={control}
                  name="slug"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel htmlFor="campus-slug">Campus slug</FieldLabel>
                      <FieldContent>
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          id="campus-slug"
                          placeholder="naihati-campus"
                        />
                        <FieldError>{fieldState.error?.message}</FieldError>
                      </FieldContent>
                    </Field>
                  )}
                />

                <Controller
                  control={control}
                  name="code"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel htmlFor="campus-code">Campus code</FieldLabel>
                      <FieldContent>
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          id="campus-code"
                          placeholder="NH"
                        />
                        <FieldError>{fieldState.error?.message}</FieldError>
                      </FieldContent>
                    </Field>
                  )}
                />

                <Controller
                  control={control}
                  name="isDefault"
                  render={({ field }) => (
                    <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/20 px-3 py-3">
                      <Checkbox
                        checked={field.value}
                        id="campus-default"
                        onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                      />
                      <Label className="text-sm font-normal" htmlFor="campus-default">
                        Make this the default campus for new sessions
                      </Label>
                    </div>
                  )}
                />

                <FieldError>{createCampusError?.message}</FieldError>

                <Button className="w-full" disabled={createCampusMutation.isPending} type="submit">
                  <IconMapPinPlus className="size-4" />
                  {createCampusMutation.isPending ? "Creating..." : "Create campus"}
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </section>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Campus registry</CardTitle>
          <CardDescription>
            These campuses are available to the current institution. Newly created campuses
            are added to the session-backed campus switcher after refresh of auth context.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {campusesQuery.isLoading ? (
            <div className="flex min-h-56 items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 text-sm text-muted-foreground">
              Loading campuses…
            </div>
          ) : campuses.length === 0 ? (
            <div className="flex min-h-56 items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 text-center text-sm text-muted-foreground">
              No campuses found for this institution yet.
            </div>
          ) : (
            <div className="grid gap-3">
              {campuses.map((campus) => {
                const isSessionCampus = campus.id === activeCampusId;

                return (
                  <div
                    key={campus.id}
                    className="rounded-2xl border border-border/70 bg-card px-5 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold tracking-tight text-foreground">
                            {campus.name}
                          </p>
                          {campus.isDefault ? <Badge>Default</Badge> : null}
                          {isSessionCampus ? (
                            <Badge variant="secondary">Current session</Badge>
                          ) : null}
                          <Badge variant="outline" className="capitalize">
                            {campus.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Slug `{campus.slug}`{campus.code ? ` • Code ${campus.code}` : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
