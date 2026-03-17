import { useQueryClient } from "@tanstack/react-query";
import { COMMUNICATIONS_API_PATHS } from "@/features/auth/api/auth.constants";
import { apiQueryClient } from "@/lib/api/client";

export type AnnouncementsListQuery = {
  q?: string;
  page?: number;
  limit?: number;
  sort?: "publishedAt" | "status" | "title" | "audience";
  order?: "asc" | "desc";
  campusId?: string;
  audience?: "all" | "staff" | "guardians" | "students";
  status?: "draft" | "published" | "archived";
};

export type NotificationsListQuery = {
  q?: string;
  page?: number;
  limit?: number;
  campusId?: string;
  unreadOnly?: boolean;
  actionRequired?: boolean;
  channel?: "system" | "academics" | "operations" | "finance" | "community";
};

function invalidateAnnouncementQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions(
      "get",
      COMMUNICATIONS_API_PATHS.LIST_ANNOUNCEMENTS,
    ).queryKey,
  });
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions(
      "get",
      COMMUNICATIONS_API_PATHS.LIST_NOTIFICATIONS,
    ).queryKey,
  });
}

export function useAnnouncementsQuery(
  enabled: boolean,
  query: AnnouncementsListQuery = {},
) {
  return apiQueryClient.useQuery(
    "get",
    COMMUNICATIONS_API_PATHS.LIST_ANNOUNCEMENTS,
    { params: { query } },
    { enabled },
  );
}

export function useAnnouncementQuery(
  enabled: boolean,
  announcementId: string | undefined,
) {
  return apiQueryClient.useQuery(
    "get",
    COMMUNICATIONS_API_PATHS.DETAIL_ANNOUNCEMENT,
    { params: { path: { announcementId: announcementId ?? "" } } },
    { enabled: enabled && Boolean(announcementId) },
  );
}

export function useCreateAnnouncementMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation(
    "post",
    COMMUNICATIONS_API_PATHS.CREATE_ANNOUNCEMENT,
    {
      onSuccess: () => {
        invalidateAnnouncementQueries(queryClient);
      },
    },
  );
}

export function useUpdateAnnouncementMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation(
    "patch",
    COMMUNICATIONS_API_PATHS.UPDATE_ANNOUNCEMENT,
    {
      onSuccess: (_, variables) => {
        invalidateAnnouncementQueries(queryClient);
        void queryClient.invalidateQueries({
          queryKey: apiQueryClient.queryOptions(
            "get",
            COMMUNICATIONS_API_PATHS.DETAIL_ANNOUNCEMENT,
            {
              params: {
                path: {
                  announcementId: variables.params.path.announcementId,
                },
              },
            },
          ).queryKey,
        });
      },
    },
  );
}

export function useSetAnnouncementStatusMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation(
    "patch",
    COMMUNICATIONS_API_PATHS.SET_ANNOUNCEMENT_STATUS,
    {
      onSuccess: () => {
        invalidateAnnouncementQueries(queryClient);
      },
    },
  );
}

export function usePublishAnnouncementMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation(
    "post",
    COMMUNICATIONS_API_PATHS.PUBLISH_ANNOUNCEMENT,
    {
      onSuccess: () => {
        invalidateAnnouncementQueries(queryClient);
      },
    },
  );
}

export function useNotificationsQuery(
  enabled: boolean,
  query: NotificationsListQuery = {},
) {
  return apiQueryClient.useQuery(
    "get",
    COMMUNICATIONS_API_PATHS.LIST_NOTIFICATIONS,
    { params: { query } },
    { enabled },
  );
}

export function useMarkNotificationsReadMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation(
    "post",
    COMMUNICATIONS_API_PATHS.MARK_ALL_NOTIFICATIONS_READ,
    {
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: apiQueryClient.queryOptions(
            "get",
            COMMUNICATIONS_API_PATHS.LIST_NOTIFICATIONS,
          ).queryKey,
        });
      },
    },
  );
}
