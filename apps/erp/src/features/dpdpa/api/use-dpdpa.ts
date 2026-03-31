import { useQueryClient } from "@tanstack/react-query";
import { DPDPA_API_PATHS } from "@/features/auth/api/auth.constants";
import { apiQueryClient } from "@/lib/api/client";

// ── Session Config ──────────────────────────────────────────────────────────

export function useSessionConfigQuery(enabled: boolean) {
  return apiQueryClient.useQuery(
    "get",
    DPDPA_API_PATHS.GET_SESSION_CONFIG,
    {},
    { enabled },
  );
}

export function useUpdateSessionConfigMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "patch",
    DPDPA_API_PATHS.UPDATE_SESSION_CONFIG,
    {
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: apiQueryClient.queryOptions(
            "get",
            DPDPA_API_PATHS.GET_SESSION_CONFIG,
            {},
          ).queryKey,
        });
      },
    },
  );
}

// ── Consents ────────────────────────────────────────────────────────────────

export function useConsentsQuery(enabled: boolean) {
  return apiQueryClient.useQuery(
    "get",
    DPDPA_API_PATHS.LIST_CONSENTS,
    {},
    { enabled },
  );
}

export function useGrantConsentMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("post", DPDPA_API_PATHS.GRANT_CONSENT, {
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions(
          "get",
          DPDPA_API_PATHS.LIST_CONSENTS,
          {},
        ).queryKey,
      });
    },
  });
}

export function useWithdrawConsentMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "delete",
    DPDPA_API_PATHS.WITHDRAW_CONSENT,
    {
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: apiQueryClient.queryOptions(
            "get",
            DPDPA_API_PATHS.LIST_CONSENTS,
            {},
          ).queryKey,
        });
      },
    },
  );
}

// ── Access Logs ─────────────────────────────────────────────────────────────

export function useAccessLogsQuery(
  enabled: boolean,
  query: Record<string, unknown> = {},
) {
  return apiQueryClient.useQuery(
    "get",
    DPDPA_API_PATHS.LIST_ACCESS_LOGS,
    { params: { query } },
    { enabled },
  );
}
