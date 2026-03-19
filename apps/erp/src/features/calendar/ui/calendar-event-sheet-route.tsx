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
  useCalendarEventQuery,
  useCreateCalendarEventMutation,
  useUpdateCalendarEventMutation,
} from "@/features/calendar/api/use-calendar";
import type { CalendarFormValues } from "@/features/calendar/model/calendar-form-schema";
import { CalendarEventForm } from "@/features/calendar/ui/calendar-event-form";
import { appendSearch } from "@/lib/routes";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

const DEFAULT_CALENDAR_FORM_VALUES: CalendarFormValues = {
  title: "",
  description: "",
  eventDate: new Date().toISOString().slice(0, 10),
  eventType: "event",
  isAllDay: true,
  startTime: "",
  endTime: "",
};

type CalendarEventSheetRouteProps = {
  mode: "create" | "edit";
};

export function CalendarEventSheetRoute({
  mode,
}: CalendarEventSheetRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { eventId } = useParams();
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const eventQuery = useCalendarEventQuery(
    mode === "edit" && Boolean(institutionId),
    eventId,
  );
  const createEventMutation = useCreateCalendarEventMutation();
  const updateEventMutation = useUpdateCalendarEventMutation();

  const defaultValues = useMemo<CalendarFormValues>(() => {
    if (mode === "create" || !eventQuery.data) {
      return DEFAULT_CALENDAR_FORM_VALUES;
    }

    return {
      title: eventQuery.data.title,
      description: eventQuery.data.description ?? "",
      eventDate: eventQuery.data.eventDate,
      eventType: eventQuery.data.eventType,
      isAllDay: eventQuery.data.isAllDay,
      startTime: eventQuery.data.startTime ?? "",
      endTime: eventQuery.data.endTime ?? "",
    };
  }, [eventQuery.data, mode]);

  async function handleSubmit(values: CalendarFormValues) {
    if (!institutionId) {
      return;
    }

    if (mode === "create") {
      await createEventMutation.mutateAsync({
        body: {
          description: values.description || undefined,
          endTime: values.isAllDay ? undefined : values.endTime || undefined,
          eventDate: values.eventDate,
          eventType: values.eventType,
          isAllDay: values.isAllDay,
          startTime: values.isAllDay
            ? undefined
            : values.startTime || undefined,
          title: values.title,
        },
      });
      toast.success(
        ERP_TOAST_MESSAGES.created(ERP_TOAST_SUBJECTS.CALENDAR_EVENT),
      );
    } else if (eventId) {
      await updateEventMutation.mutateAsync({
        params: {
          path: {
            eventId,
          },
        },
        body: {
          description: values.description || undefined,
          endTime: values.isAllDay ? undefined : values.endTime || undefined,
          eventDate: values.eventDate,
          eventType: values.eventType,
          isAllDay: values.isAllDay,
          startTime: values.isAllDay
            ? undefined
            : values.startTime || undefined,
          title: values.title,
        },
      });
      toast.success(
        ERP_TOAST_MESSAGES.updated(ERP_TOAST_SUBJECTS.CALENDAR_EVENT),
      );
    }

    void navigate(appendSearch(ERP_ROUTES.CALENDAR, location.search));
  }

  if (mode === "edit" && eventQuery.isLoading) {
    return (
      <RouteEntitySheet
        closeTo={ERP_ROUTES.CALENDAR}
        description="Load the event details before editing."
        title="Edit event"
      >
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Loading event details...
          </CardContent>
        </Card>
      </RouteEntitySheet>
    );
  }

  if (mode === "edit" && !eventQuery.data) {
    return (
      <RouteEntitySheet
        closeTo={ERP_ROUTES.CALENDAR}
        description="The requested calendar event could not be loaded for this institution."
        title="Event not found"
      >
        <Card>
          <CardHeader>
            <CardTitle>Event not found</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Try returning to the calendar list and opening the record again.
          </CardContent>
        </Card>
      </RouteEntitySheet>
    );
  }

  const errorMessage =
    mode === "create"
      ? ((createEventMutation.error as Error | null | undefined)?.message ??
        undefined)
      : ((updateEventMutation.error as Error | null | undefined)?.message ??
        undefined);

  const isPending =
    mode === "create"
      ? createEventMutation.isPending
      : updateEventMutation.isPending;

  return (
    <RouteEntitySheet
      closeTo={ERP_ROUTES.CALENDAR}
      description={
        mode === "create"
          ? "Create a new calendar event for your institution."
          : "Update calendar event details."
      }
      title={mode === "create" ? "New calendar event" : "Edit calendar event"}
    >
      <CalendarEventForm
        defaultValues={defaultValues}
        errorMessage={errorMessage}
        isPending={isPending}
        onCancel={() => {
          void navigate(appendSearch(ERP_ROUTES.CALENDAR, location.search));
        }}
        onSubmit={handleSubmit}
        submitLabel={
          mode === "create" ? "Create calendar event" : "Save changes"
        }
      />
    </RouteEntitySheet>
  );
}
