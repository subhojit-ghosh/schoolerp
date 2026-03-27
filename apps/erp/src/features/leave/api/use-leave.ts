import { useQueryClient } from "@tanstack/react-query";
import { LEAVE_API_PATHS } from "@/features/auth/api/auth.constants";
import { apiQueryClient } from "@/lib/api/client";

export type LeaveApplicationListQuery = {
  q?: string;
  staffMemberId?: string;
  leaveTypeId?: string;
  status?: "pending" | "approved" | "rejected" | "cancelled";
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  sort?: "fromDate" | "createdAt" | "status";
  order?: "asc" | "desc";
};

function invalidateLeaveApplicationQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions("get", LEAVE_API_PATHS.LIST_APPLICATIONS)
      .queryKey,
  });
}

export function useLeaveTypesQuery(enabled: boolean, status?: "active" | "inactive") {
  return apiQueryClient.useQuery(
    "get",
    LEAVE_API_PATHS.LIST_TYPES,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { params: { query: status ? { status } : {} as any } },
    { enabled },
  );
}

function invalidateLeaveTypeQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryKey: apiQueryClient.queryOptions("get", LEAVE_API_PATHS.LIST_TYPES, { params: { query: {} as any } })
      .queryKey,
  });
}

export function useCreateLeaveTypeMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("post", LEAVE_API_PATHS.CREATE_TYPE, {
    onSuccess: () => {
      invalidateLeaveTypeQueries(queryClient);
    },
  });
}

export function useUpdateLeaveTypeMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("put", LEAVE_API_PATHS.UPDATE_TYPE, {
    onSuccess: () => {
      invalidateLeaveTypeQueries(queryClient);
    },
  });
}

export function useLeaveApplicationsQuery(
  enabled: boolean,
  query: LeaveApplicationListQuery = {},
) {
  return apiQueryClient.useQuery(
    "get",
    LEAVE_API_PATHS.LIST_APPLICATIONS,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { params: { query: query as any } },
    { enabled },
  );
}

export function useLeaveApplicationDetailQuery(
  enabled: boolean,
  applicationId: string | undefined,
) {
  return apiQueryClient.useQuery(
    "get",
    LEAVE_API_PATHS.DETAIL_APPLICATION,
    { params: { path: { applicationId: applicationId ?? "" } } },
    { enabled: enabled && Boolean(applicationId) },
  );
}

export function useApplyLeaveMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("post", LEAVE_API_PATHS.APPLY, {
    onSuccess: () => {
      invalidateLeaveApplicationQueries(queryClient);
    },
  });
}

export function useApplyLeaveForStaffMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("post", LEAVE_API_PATHS.APPLY_FOR_STAFF, {
    onSuccess: () => {
      invalidateLeaveApplicationQueries(queryClient);
    },
  });
}

export function useReviewLeaveApplicationMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("post", LEAVE_API_PATHS.REVIEW, {
    onSuccess: (_, variables) => {
      invalidateLeaveApplicationQueries(queryClient);
      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions(
          "get",
          LEAVE_API_PATHS.DETAIL_APPLICATION,
          {
            params: {
              path: { applicationId: variables.params.path.applicationId },
            },
          },
        ).queryKey,
      });
    },
  });
}

export function useCancelLeaveApplicationMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("post", LEAVE_API_PATHS.CANCEL, {
    onSuccess: () => {
      invalidateLeaveApplicationQueries(queryClient);
    },
  });
}
