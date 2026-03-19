import { useQueryClient } from "@tanstack/react-query";
import { SORT_ORDERS } from "@/constants/query";
import { CALENDAR_API_PATHS } from "@/features/auth/api/auth.constants";
import { CALENDAR_LIST_SORT_FIELDS } from "@/features/calendar/model/calendar-list.constants";
import { apiQueryClient } from "@/lib/api/client";

type CalendarListSort =
  (typeof CALENDAR_LIST_SORT_FIELDS)[keyof typeof CALENDAR_LIST_SORT_FIELDS];

type CalendarEventsListQuery = {
  fromDate?: string;
  toDate?: string;
  limit?: number;
  order?: (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];
  page?: number;
  q?: string;
  sort?: CalendarListSort;
};

export function useCalendarEventsQuery(
  enabled: boolean,
  query: CalendarEventsListQuery = {},
) {
  return apiQueryClient.useQuery(
    "get",
    CALENDAR_API_PATHS.LIST_EVENTS,
    {
      params: {
        query,
      },
    },
    {
      enabled,
    },
  );
}

export function useCalendarEventQuery(
  enabled: boolean,
  eventId: string | undefined,
) {
  return apiQueryClient.useQuery(
    "get",
    CALENDAR_API_PATHS.DETAIL_EVENT,
    {
      params: {
        path: {
          eventId: eventId ?? "",
        },
      },
    },
    {
      enabled: enabled && Boolean(eventId),
    },
  );
}

export function useCreateCalendarEventMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("post", CALENDAR_API_PATHS.CREATE_EVENT, {
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions(
          "get",
          CALENDAR_API_PATHS.LIST_EVENTS,
        ).queryKey,
      });
    },
  });
}

export function useUpdateCalendarEventMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("patch", CALENDAR_API_PATHS.UPDATE_EVENT, {
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions(
          "get",
          CALENDAR_API_PATHS.LIST_EVENTS,
        ).queryKey,
      });

      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions(
          "get",
          CALENDAR_API_PATHS.DETAIL_EVENT,
          {
            params: {
              path: {
                eventId: variables.params.path.eventId,
              },
            },
          },
        ).queryKey,
      });
    },
  });
}

export function useSetCalendarEventStatusMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation(
    "patch",
    CALENDAR_API_PATHS.SET_EVENT_STATUS,
    {
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: apiQueryClient.queryOptions(
            "get",
            CALENDAR_API_PATHS.LIST_EVENTS,
          ).queryKey,
        });
      },
    },
  );
}

export function useDeleteCalendarEventMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("delete", CALENDAR_API_PATHS.DELETE_EVENT, {
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions(
          "get",
          CALENDAR_API_PATHS.LIST_EVENTS,
        ).queryKey,
      });
    },
  });
}
