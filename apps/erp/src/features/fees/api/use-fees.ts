import { useQueryClient } from "@tanstack/react-query";
import { FEES_API_PATHS } from "@/features/auth/api/auth.constants";
import { apiQueryClient } from "@/lib/api/client";

function invalidateFeesQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  _institutionId: string,
) {
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions("get", FEES_API_PATHS.LIST_STRUCTURES).queryKey,
  });
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions("get", FEES_API_PATHS.LIST_ASSIGNMENTS).queryKey,
  });
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions("get", FEES_API_PATHS.LIST_DUES).queryKey,
  });
}

export function useFeeStructuresQuery(institutionId: string | undefined) {
  return apiQueryClient.useQuery(
    "get",
    FEES_API_PATHS.LIST_STRUCTURES,
    undefined,
    {
      enabled: Boolean(institutionId),
    },
  );
}

export function useCreateFeeStructureMutation(institutionId: string | undefined) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("post", FEES_API_PATHS.CREATE_STRUCTURE, {
    onSuccess: () => {
      if (!institutionId) {
        return;
      }

      invalidateFeesQueries(queryClient, institutionId);
    },
  });
}

export function useFeeAssignmentsQuery(institutionId: string | undefined) {
  return apiQueryClient.useQuery(
    "get",
    FEES_API_PATHS.LIST_ASSIGNMENTS,
    undefined,
    {
      enabled: Boolean(institutionId),
    },
  );
}

export function useCreateFeeAssignmentMutation(
  institutionId: string | undefined,
) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("post", FEES_API_PATHS.CREATE_ASSIGNMENT, {
    onSuccess: () => {
      if (!institutionId) {
        return;
      }

      invalidateFeesQueries(queryClient, institutionId);
    },
  });
}

export function useCreateFeePaymentMutation(institutionId: string | undefined) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("post", FEES_API_PATHS.CREATE_PAYMENT, {
    onSuccess: () => {
      if (!institutionId) {
        return;
      }

      invalidateFeesQueries(queryClient, institutionId);
    },
  });
}

export function useFeeDuesQuery(institutionId: string | undefined) {
  return apiQueryClient.useQuery(
    "get",
    FEES_API_PATHS.LIST_DUES,
    undefined,
    {
      enabled: Boolean(institutionId),
    },
  );
}
