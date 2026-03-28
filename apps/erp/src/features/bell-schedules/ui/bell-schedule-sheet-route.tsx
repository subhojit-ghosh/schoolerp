import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { RouteEntitySheet } from "@/components/entities/route-entity-sheet";
import { ERP_ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useBellScheduleQuery,
  useCreateBellScheduleMutation,
  useReplaceBellSchedulePeriodsMutation,
  useUpdateBellScheduleMutation,
} from "@/features/bell-schedules/api/use-bell-schedules";
import { type BellScheduleFormValues } from "@/features/bell-schedules/model/bell-schedule-schema";
import { BellScheduleForm } from "@/features/bell-schedules/ui/bell-schedule-form";
import { extractApiError } from "@/lib/api-error";
import { appendSearch } from "@/lib/routes";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

type BellScheduleSheetRouteProps = {
  mode: "create" | "edit";
};

const DEFAULT_VALUES: BellScheduleFormValues = {
  isDefault: false,
  name: "",
  periods: [
    {
      endTime: "09:45",
      isBreak: false,
      label: "Period 1",
      periodIndex: 1,
      startTime: "09:00",
    },
  ],
};

function normalizePeriods(
  periods: BellScheduleFormValues["periods"],
): BellScheduleFormValues["periods"] {
  return periods.map((period, index) => ({
    ...period,
    periodIndex: index + 1,
  }));
}

export function BellScheduleSheetRoute({ mode }: BellScheduleSheetRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { scheduleId } = useParams();
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const bellScheduleQuery = useBellScheduleQuery(
    mode === "edit" && Boolean(institutionId),
    scheduleId,
  );
  const createMutation = useCreateBellScheduleMutation();
  const updateMutation = useUpdateBellScheduleMutation();
  const replacePeriodsMutation = useReplaceBellSchedulePeriodsMutation();

  const defaultValues = useMemo<BellScheduleFormValues>(() => {
    if (mode === "create" || !bellScheduleQuery.data) {
      return DEFAULT_VALUES;
    }

    return {
      isDefault: bellScheduleQuery.data.isDefault,
      name: bellScheduleQuery.data.name,
      periods:
        bellScheduleQuery.data.periods.length > 0
          ? normalizePeriods(
              [...bellScheduleQuery.data.periods]
                .sort((left, right) => left.periodIndex - right.periodIndex)
                .map((period) => ({
                  endTime: period.endTime,
                  isBreak: period.isBreak,
                  label: period.label ?? "",
                  periodIndex: period.periodIndex,
                  startTime: period.startTime,
                })),
            )
          : DEFAULT_VALUES.periods,
    };
  }, [bellScheduleQuery.data, mode]);

  async function handleSubmit(values: BellScheduleFormValues) {
    if (!institutionId) {
      return;
    }

    const normalizedPeriods = normalizePeriods(values.periods);

    try {
      if (mode === "create") {
        const created = await createMutation.mutateAsync({
          body: {
            isDefault: values.isDefault,
            name: values.name,
          },
        });

        await replacePeriodsMutation.mutateAsync({
          params: { path: { scheduleId: created.id } },
          body: {
            periods: normalizedPeriods,
          },
        });

        toast.success(
          ERP_TOAST_MESSAGES.created(ERP_TOAST_SUBJECTS.BELL_SCHEDULE),
        );
      } else if (scheduleId) {
        await updateMutation.mutateAsync({
          params: { path: { scheduleId } },
          body: {
            isDefault: values.isDefault,
            name: values.name,
          },
        });

        await replacePeriodsMutation.mutateAsync({
          params: { path: { scheduleId } },
          body: {
            periods: normalizedPeriods,
          },
        });

        toast.success(
          ERP_TOAST_MESSAGES.updated(ERP_TOAST_SUBJECTS.BELL_SCHEDULE),
        );
      }

      void navigate(appendSearch(ERP_ROUTES.BELL_SCHEDULES, location.search));
    } catch (error) {
      toast.error(extractApiError(error, mode === "create" ? "Could not create bell schedule. Please try again." : "Could not update bell schedule. Please try again."));
    }
  }

  if (mode === "edit" && bellScheduleQuery.isLoading) {
    return (
      <RouteEntitySheet
        closeTo={ERP_ROUTES.BELL_SCHEDULES}
        description="Loading the selected bell schedule."
        title="Edit bell schedule"
      >
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Loading bell schedule details...
          </CardContent>
        </Card>
      </RouteEntitySheet>
    );
  }

  if (mode === "edit" && !bellScheduleQuery.data) {
    return (
      <RouteEntitySheet
        closeTo={ERP_ROUTES.BELL_SCHEDULES}
        description="The requested bell schedule could not be loaded."
        title="Bell schedule not found"
      >
        <Card>
          <CardHeader>
            <CardTitle>Bell schedule not found</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Try returning to the list and opening the record again.
          </CardContent>
        </Card>
      </RouteEntitySheet>
    );
  }

  const errorMessage =
    ((createMutation.error as Error | null | undefined)?.message ??
      (updateMutation.error as Error | null | undefined)?.message ??
      (replacePeriodsMutation.error as Error | null | undefined)?.message) ||
    undefined;

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    replacePeriodsMutation.isPending;

  return (
    <RouteEntitySheet
      closeTo={ERP_ROUTES.BELL_SCHEDULES}
      contentClassName="sm:max-w-4xl"
      description={
        mode === "create"
          ? "Create a campus bell schedule and define its periods."
          : "Update the schedule details and period list."
      }
      title={mode === "create" ? "New bell schedule" : "Edit bell schedule"}
    >
      <BellScheduleForm
        defaultValues={defaultValues}
        errorMessage={errorMessage}
        isPending={isPending}
        onCancel={() => {
          void navigate(
            appendSearch(ERP_ROUTES.BELL_SCHEDULES, location.search),
          );
        }}
        onSubmit={handleSubmit}
        submitLabel={
          mode === "create" ? "Create bell schedule" : "Save changes"
        }
      />
    </RouteEntitySheet>
  );
}
