import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  STAFF_ATTENDANCE_STATUSES,
  STAFF_ATTENDANCE_STATUS_LABELS,
  PERMISSIONS,
} from "@repo/contracts";
import { IconCheck, IconRefresh } from "@tabler/icons-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@repo/ui/components/ui/field";
import { Input } from "@repo/ui/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import { cn } from "@repo/ui/lib/utils";

import { useDocumentTitle } from "@/hooks/use-document-title";
import {
  EntityPageHeader,
  EntityPageShell,
} from "@/components/entities/entity-page-shell";
import {
  getActiveContext,
  hasPermission,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useStaffAttendanceRosterQuery,
  useUpsertStaffAttendanceDayMutation,
  useStaffAttendanceDayViewQuery,
  type StaffAttendanceRosterFilters,
} from "@/features/staff-attendance/api/use-staff-attendance";
import { z } from "zod";
import { staffAttendanceStatusSchema } from "@repo/contracts";
import { extractApiError } from "@/lib/api-error";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

const STAFF_ATTENDANCE_PAGE_COPY = {
  TITLE: "Staff Attendance",
  DESCRIPTION: "Mark and review daily staff attendance.",
  EMPTY_ROSTER: "Select a date above and load the staff roster.",
  EMPTY_OVERVIEW: "No campus data found for this date.",
} as const;

const STATUS_CONFIG = {
  [STAFF_ATTENDANCE_STATUSES.PRESENT]: {
    active: "bg-green-600 text-white border-green-600 hover:bg-green-600",
    idle: "border-border text-muted-foreground hover:border-green-500 hover:text-green-600",
  },
  [STAFF_ATTENDANCE_STATUSES.ABSENT]: {
    active: "bg-red-600 text-white border-red-600 hover:bg-red-600",
    idle: "border-border text-muted-foreground hover:border-red-500 hover:text-red-600",
  },
  [STAFF_ATTENDANCE_STATUSES.HALF_DAY]: {
    active: "bg-amber-500 text-white border-amber-500 hover:bg-amber-500",
    idle: "border-border text-muted-foreground hover:border-amber-400 hover:text-amber-600",
  },
  [STAFF_ATTENDANCE_STATUSES.ON_LEAVE]: {
    active: "bg-blue-600 text-white border-blue-600 hover:bg-blue-600",
    idle: "border-border text-muted-foreground hover:border-blue-500 hover:text-blue-600",
  },
} as const;

const STATUS_OPTIONS = [
  STAFF_ATTENDANCE_STATUSES.PRESENT,
  STAFF_ATTENDANCE_STATUSES.ABSENT,
  STAFF_ATTENDANCE_STATUSES.HALF_DAY,
  STAFF_ATTENDANCE_STATUSES.ON_LEAVE,
] as const;

type StatusPickerProps = {
  value: string;
  onChange: (value: string) => void;
};

function StatusPicker({ value, onChange }: StatusPickerProps) {
  return (
    <div className="flex items-center gap-1">
      {STATUS_OPTIONS.map((status) => {
        const config = STATUS_CONFIG[status];
        const isActive = value === status;
        return (
          <button
            key={status}
            type="button"
            onClick={() => onChange(status)}
            className={cn(
              "h-8 rounded-md border px-3 text-xs font-medium transition-colors",
              isActive ? config.active : config.idle,
            )}
          >
            {STAFF_ATTENDANCE_STATUS_LABELS[status]}
          </button>
        );
      })}
    </div>
  );
}

const TODAY = new Date().toISOString().slice(0, 10);

const UNSET_STATUS = "" as const;

const TAB_VALUES = {
  MARK: "mark",
  OVERVIEW: "overview",
} as const;

const selectionSchema = z.object({
  attendanceDate: z.string().min(1, "Date is required"),
});

type SelectionValues = z.infer<typeof selectionSchema>;

const entryFormSchema = z.object({
  attendanceDate: z.string().min(1),
  entries: z.array(
    z.object({
      staffMembershipId: z.uuid(),
      status: staffAttendanceStatusSchema.or(z.literal("")),
    }),
  ),
});

type EntryFormValues = z.infer<typeof entryFormSchema>;

export function StaffAttendancePage() {
  useDocumentTitle("Staff Attendance");
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const institutionId = session?.activeOrganization?.id;
  const activeCampusId = session?.activeCampus?.id;
  const activeCampusName = session?.activeCampus?.name;
  const canManageStaffAttendance =
    isStaffContext(session) &&
    hasPermission(session, PERMISSIONS.STAFF_ATTENDANCE_MANAGE);
  const canReadStaffAttendance =
    isStaffContext(session) &&
    hasPermission(session, PERMISSIONS.STAFF_ATTENDANCE_READ);
  const managedInstitutionId = canReadStaffAttendance
    ? institutionId
    : undefined;

  const [activeFilters, setActiveFilters] =
    useState<StaffAttendanceRosterFilters | null>(null);
  const [overviewDate, setOverviewDate] = useState(TODAY);
  const [overviewDraft, setOverviewDraft] = useState(TODAY);
  const [activeTab, setActiveTab] = useState<string>(TAB_VALUES.MARK);

  const selectionForm = useForm<SelectionValues>({
    resolver: zodResolver(selectionSchema),
    mode: "onTouched",
    defaultValues: { attendanceDate: TODAY },
  });
  const entryForm = useForm<EntryFormValues>({
    resolver: zodResolver(entryFormSchema),
    mode: "onTouched",
    defaultValues: { attendanceDate: TODAY, entries: [] },
  });

  const rosterQuery = useStaffAttendanceRosterQuery(
    managedInstitutionId,
    activeFilters,
  );
  const dayViewQuery = useStaffAttendanceDayViewQuery(
    managedInstitutionId,
    overviewDate,
  );
  const saveMutation = useUpsertStaffAttendanceDayMutation(
    managedInstitutionId,
    activeFilters,
  );
  const saveError = saveMutation.error as Error | null | undefined;

  useEffect(() => {
    const data = rosterQuery.data;
    if (!data) return;

    entryForm.reset({
      attendanceDate: data.attendanceDate,
      entries: data.roster.map((item) => ({
        staffMembershipId: item.membershipId,
        status: item.status ?? UNSET_STATUS,
      })),
    });
  }, [rosterQuery.data, entryForm]);

  function handleLoadRoster(values: SelectionValues) {
    if (!activeCampusId) return;
    setActiveFilters({
      campusId: activeCampusId,
      attendanceDate: values.attendanceDate,
    });
  }

  async function handleSaveAttendance(values: EntryFormValues) {
    if (!institutionId || !activeCampusId) return;

    const unmarked = values.entries.filter((e) => e.status === UNSET_STATUS);
    if (unmarked.length > 0) {
      toast.error(
        `${unmarked.length} staff member${unmarked.length === 1 ? "" : "s"} not marked yet.`,
      );
      return;
    }

    try {
       
      await saveMutation.mutateAsync({
        body: {
          campusId: activeCampusId,
          attendanceDate: values.attendanceDate,
          entries: values.entries.map((e) => ({
            staffMembershipId: e.staffMembershipId,
            status: e.status as string,
          })),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      });
      toast.success(
        ERP_TOAST_MESSAGES.updated(ERP_TOAST_SUBJECTS.STAFF_ATTENDANCE),
      );
    } catch (error) {
      toast.error(
        extractApiError(
          error,
          "Could not save staff attendance. Please try again.",
        ),
      );
    }
  }

  const currentRoster = rosterQuery.data;
  const dayView = dayViewQuery.data;
  const campuses = dayView?.campuses ?? [];

  return (
    <EntityPageShell width="full">
      <EntityPageHeader
        description={STAFF_ATTENDANCE_PAGE_COPY.DESCRIPTION}
        title={STAFF_ATTENDANCE_PAGE_COPY.TITLE}
      />

      {!institutionId || !canReadStaffAttendance ? (
        <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-16 text-center text-sm text-muted-foreground">
          {!institutionId
            ? "Sign in with an institution-backed session to manage staff attendance."
            : `Staff attendance is available in Staff view. You are currently in ${activeContext?.label ?? "another"} view.`}
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value={TAB_VALUES.MARK}>Mark</TabsTrigger>
            <TabsTrigger value={TAB_VALUES.OVERVIEW}>Overview</TabsTrigger>
          </TabsList>

          {/* Mark tab */}
          <TabsContent value={TAB_VALUES.MARK} className="mt-4">
            <div className="flex flex-col gap-4">
              {/* Filters toolbar */}
              <div className="rounded-xl border border-border/70 bg-card px-4 py-4">
                <form onSubmit={selectionForm.handleSubmit(handleLoadRoster)}>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Controller
                      control={selectionForm.control}
                      name="attendanceDate"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid || undefined}>
                          <FieldLabel required>Date</FieldLabel>
                          <FieldContent>
                            <Input
                              {...field}
                              aria-invalid={fieldState.invalid}
                              max={TODAY}
                              type="date"
                            />
                            <FieldError>{fieldState.error?.message}</FieldError>
                          </FieldContent>
                        </Field>
                      )}
                    />
                  </div>
                  {activeCampusName ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Working campus: {activeCampusName}
                    </p>
                  ) : null}
                  <div className="mt-3 flex justify-end">
                    <Button size="sm" type="submit">
                      Load staff
                    </Button>
                  </div>
                </form>
              </div>

              {/* Mark attendance list */}
              <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
                {rosterQuery.isLoading ? (
                  <div className="py-16 text-center text-sm text-muted-foreground">
                    Loading staff...
                  </div>
                ) : currentRoster ? (
                  <form onSubmit={entryForm.handleSubmit(handleSaveAttendance)}>
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          Staff — {currentRoster.campusName}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {currentRoster.summary.total} staff members
                        </span>
                        {currentRoster.summary.present > 0 ||
                        currentRoster.summary.absent > 0 ? (
                          <div className="flex gap-2 text-xs">
                            <span className="text-green-700 dark:text-green-400">
                              P {currentRoster.summary.present}
                            </span>
                            <span className="text-red-600 dark:text-red-400">
                              A {currentRoster.summary.absent}
                            </span>
                            <span className="text-amber-600 dark:text-amber-400">
                              HD {currentRoster.summary.halfDay}
                            </span>
                            <span className="text-blue-600 dark:text-blue-400">
                              OL {currentRoster.summary.onLeave}
                            </span>
                          </div>
                        ) : null}
                      </div>
                      {canManageStaffAttendance ? (
                        <Button
                          disabled={saveMutation.isPending}
                          size="sm"
                          type="submit"
                        >
                          <IconCheck className="mr-1.5 size-3.5" />
                          {saveMutation.isPending
                            ? "Saving..."
                            : "Save attendance"}
                        </Button>
                      ) : null}
                    </div>

                    {/* Staff rows */}
                    <div className="divide-y divide-border/60">
                      {currentRoster.roster.map((item, index) => (
                        <div
                          key={item.membershipId}
                          className="flex items-center justify-between gap-4 px-5 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {item.staffName}
                            </p>
                            {item.designation ? (
                              <p className="text-xs text-muted-foreground">
                                {item.designation}
                              </p>
                            ) : null}
                          </div>
                          {canManageStaffAttendance ? (
                            <Controller
                              control={entryForm.control}
                              name={`entries.${index}.status`}
                              render={({ field }) => (
                                <StatusPicker
                                  value={field.value}
                                  onChange={field.onChange}
                                />
                              )}
                            />
                          ) : (
                            <Badge
                              variant={item.status ? "secondary" : "outline"}
                            >
                              {item.status
                                ? STAFF_ATTENDANCE_STATUS_LABELS[
                                    item.status as keyof typeof STAFF_ATTENDANCE_STATUS_LABELS
                                  ]
                                : "Not marked"}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>

                    {saveError ? (
                      <div className="border-t px-5 py-3">
                        <p className="text-sm text-destructive">
                          {saveError.message}
                        </p>
                      </div>
                    ) : null}
                  </form>
                ) : (
                  <div className="py-16 text-center text-sm text-muted-foreground">
                    {STAFF_ATTENDANCE_PAGE_COPY.EMPTY_ROSTER}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Overview tab */}
          <TabsContent value={TAB_VALUES.OVERVIEW} className="mt-4">
            <div className="flex flex-col gap-4">
              {/* Date filter */}
              <div className="rounded-xl border border-border/70 bg-card px-4 py-4">
                <div className="flex items-end gap-3">
                  <Field className="max-w-xs">
                    <FieldLabel>Date</FieldLabel>
                    <FieldContent>
                      <Input
                        type="date"
                        max={TODAY}
                        value={overviewDraft}
                        onChange={(e) => setOverviewDraft(e.target.value)}
                      />
                    </FieldContent>
                  </Field>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setOverviewDate(overviewDraft)}
                  >
                    <IconRefresh className="mr-1.5 size-3.5" />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Overview list */}
              <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
                {dayViewQuery.isLoading ? (
                  <div className="py-16 text-center text-sm text-muted-foreground">
                    Loading...
                  </div>
                ) : campuses.length > 0 ? (
                  <div className="divide-y divide-border/60">
                    {campuses.map((item) => (
                      <div
                        key={item.campusId}
                        className="flex w-full items-center justify-between gap-4 px-5 py-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {item.campusName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.total} staff members
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {item.marked ? (
                            <div className="flex gap-3 text-xs">
                              <span className="text-green-700 dark:text-green-400">
                                P {item.present}
                              </span>
                              <span className="text-red-600 dark:text-red-400">
                                A {item.absent}
                              </span>
                              <span className="text-amber-600 dark:text-amber-400">
                                HD {item.halfDay}
                              </span>
                              <span className="text-blue-600 dark:text-blue-400">
                                OL {item.onLeave}
                              </span>
                            </div>
                          ) : null}
                          <Badge
                            variant={item.marked ? "secondary" : "outline"}
                            className={
                              item.marked
                                ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
                                : "text-muted-foreground"
                            }
                          >
                            {item.marked ? "Marked" : "Pending"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center text-sm text-muted-foreground">
                    {STAFF_ATTENDANCE_PAGE_COPY.EMPTY_OVERVIEW}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </EntityPageShell>
  );
}
