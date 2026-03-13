import { useQueryClient } from "@tanstack/react-query";
import { STAFF_API_PATHS } from "@/features/auth/api/auth.constants";
import { apiQueryClient } from "@/lib/api/client";

export function useStaffQuery(institutionId: string | undefined) {
  return apiQueryClient.useQuery(
    "get",
    STAFF_API_PATHS.LIST,
    undefined,
    {
      enabled: Boolean(institutionId),
    },
  );
}

export function useStaffRolesQuery(institutionId: string | undefined) {
  return apiQueryClient.useQuery(
    "get",
    STAFF_API_PATHS.ROLES,
    undefined,
    {
      enabled: Boolean(institutionId),
    },
  );
}

export function useCreateStaffMutation(institutionId: string | undefined) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("post", STAFF_API_PATHS.CREATE, {
    onSuccess: () => {
      if (!institutionId) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions("get", STAFF_API_PATHS.LIST).queryKey,
      });
    },
  });
}

export function useStaffDetailQuery(
  institutionId: string | undefined,
  staffId: string | undefined,
) {
  return apiQueryClient.useQuery(
    "get",
    STAFF_API_PATHS.DETAIL,
    {
      params: {
        path: {
          staffId: staffId ?? "",
        },
      },
    },
    {
      enabled: Boolean(institutionId && staffId),
    },
  );
}

export function useUpdateStaffMutation(institutionId: string | undefined) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("patch", STAFF_API_PATHS.UPDATE, {
    onSuccess: (_, variables) => {
      if (!institutionId) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions("get", STAFF_API_PATHS.LIST).queryKey,
      });

      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions(
          "get",
          STAFF_API_PATHS.DETAIL,
          {
            params: {
              path: {
                staffId: variables.params.path.staffId,
              },
            },
          },
        ).queryKey,
      });
    },
  });
}
