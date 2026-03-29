import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LEAVE_API_PATHS } from "@/features/auth/api/auth.constants";
import { apiQueryClient } from "@/lib/api/client";
import { APP_FALLBACKS } from "@/constants/api";

function getApiBaseUrl() {
  return import.meta.env.VITE_API_URL ?? APP_FALLBACKS.API_URL;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${url}`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error(`Failed to fetch ${url}`);
  return response.json();
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${url}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Failed to post ${url}`);
  return response.json();
}

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
    queryKey: apiQueryClient.queryOptions(
      "get",
      LEAVE_API_PATHS.LIST_APPLICATIONS,
    ).queryKey,
  });
}

export function useLeaveTypesQuery(
  enabled: boolean,
  status?: "active" | "inactive",
) {
  return apiQueryClient.useQuery(
    "get",
    LEAVE_API_PATHS.LIST_TYPES,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { params: { query: status ? { status } : ({} as any) } },
    { enabled },
  );
}

function invalidateLeaveTypeQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions("get", LEAVE_API_PATHS.LIST_TYPES, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      params: { query: {} as any },
    }).queryKey,
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

// ── Leave Balances ──────────────────────────────────────────────────────────

export type LeaveBalance = {
  id: string;
  staffMemberId: string;
  staffName: string;
  leaveTypeId: string;
  leaveTypeName: string;
  academicYearId: string;
  allocated: number;
  used: number;
  carriedForward: number;
  remaining: number;
};

export function useLeaveBalancesQuery(
  enabled: boolean,
  query: { staffMemberId?: string; academicYearId?: string } = {},
) {
  const params = new URLSearchParams();
  if (query.staffMemberId) params.set("staffMemberId", query.staffMemberId);
  if (query.academicYearId) params.set("academicYearId", query.academicYearId);
  const qs = params.toString();
  const url = `${LEAVE_API_PATHS.LIST_BALANCES}${qs ? `?${qs}` : ""}`;

  return useQuery<LeaveBalance[]>({
    queryKey: ["leave-balances", query],
    queryFn: () => fetchJson(url),
    enabled,
  });
}

export function useAllocateLeaveBalancesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (academicYearId: string) =>
      postJson(LEAVE_API_PATHS.ALLOCATE_BALANCES, { academicYearId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
    },
  });
}

// ── Team Leave Calendar ──────────────────────────────────────────────────────

export type TeamLeaveEntry = {
  id: string;
  staffMemberId: string;
  staffName: string;
  leaveTypeName: string;
  fromDate: string;
  toDate: string;
  daysCount: number;
  isHalfDay: boolean;
  status: "approved";
};

export function useTeamLeaveCalendarQuery(
  enabled: boolean,
  from: string,
  to: string,
) {
  return useQuery<TeamLeaveEntry[]>({
    queryKey: ["team-leave-calendar", from, to],
    queryFn: () =>
      fetchJson(`${LEAVE_API_PATHS.TEAM_CALENDAR}?from=${from}&to=${to}`),
    enabled: enabled && Boolean(from) && Boolean(to),
  });
}
