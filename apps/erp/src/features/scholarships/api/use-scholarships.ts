import { useQueryClient } from "@tanstack/react-query";
import { SCHOLARSHIPS_API_PATHS } from "@/features/auth/api/auth.constants";
import { apiQueryClient } from "@/lib/api/client";

function invalidateScholarshipLists(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions("get", SCHOLARSHIPS_API_PATHS.LIST, {
      params: { query: {} },
    }).queryKey,
  });
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions(
      "get",
      SCHOLARSHIPS_API_PATHS.LIST_APPLICATIONS,
      { params: { query: {} } },
    ).queryKey,
  });
}

// ── Scholarships ─────────────────────────────────────────────────────────────

export function useScholarshipsQuery(
  enabled: boolean,
  query: Record<string, unknown> = {},
) {
  return apiQueryClient.useQuery(
    "get",
    SCHOLARSHIPS_API_PATHS.LIST,
    { params: { query } },
    { enabled },
  );
}

export function useCreateScholarshipMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("post", SCHOLARSHIPS_API_PATHS.CREATE, {
    onSuccess: () => {
      invalidateScholarshipLists(queryClient);
    },
  });
}

export function useUpdateScholarshipMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("patch", SCHOLARSHIPS_API_PATHS.UPDATE, {
    onSuccess: () => {
      invalidateScholarshipLists(queryClient);
    },
  });
}

export function useUpdateScholarshipStatusMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "patch",
    SCHOLARSHIPS_API_PATHS.UPDATE_STATUS,
    {
      onSuccess: () => {
        invalidateScholarshipLists(queryClient);
      },
    },
  );
}

// ── Scholarship Applications ─────────────────────────────────────────────────

export function useScholarshipApplicationsQuery(
  enabled: boolean,
  query: Record<string, unknown> = {},
) {
  return apiQueryClient.useQuery(
    "get",
    SCHOLARSHIPS_API_PATHS.LIST_APPLICATIONS,
    { params: { query } },
    { enabled },
  );
}

export function useCreateScholarshipApplicationMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "post",
    SCHOLARSHIPS_API_PATHS.CREATE_APPLICATION,
    {
      onSuccess: () => {
        invalidateScholarshipLists(queryClient);
      },
    },
  );
}

export function useApproveScholarshipApplicationMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "post",
    SCHOLARSHIPS_API_PATHS.APPROVE_APPLICATION,
    {
      onSuccess: () => {
        invalidateScholarshipLists(queryClient);
      },
    },
  );
}

export function useRejectScholarshipApplicationMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "post",
    SCHOLARSHIPS_API_PATHS.REJECT_APPLICATION,
    {
      onSuccess: () => {
        invalidateScholarshipLists(queryClient);
      },
    },
  );
}

export function useUpdateScholarshipApplicationDbtMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "patch",
    SCHOLARSHIPS_API_PATHS.UPDATE_DBT,
    {
      onSuccess: () => {
        invalidateScholarshipLists(queryClient);
      },
    },
  );
}

export function useRenewScholarshipApplicationMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "post",
    SCHOLARSHIPS_API_PATHS.RENEW_APPLICATION,
    {
      onSuccess: () => {
        invalidateScholarshipLists(queryClient);
      },
    },
  );
}
