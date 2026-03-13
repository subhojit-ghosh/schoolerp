import { useQueryClient } from "@tanstack/react-query";
import { STAFF_API_PATHS } from "@/features/auth/api/auth.constants";
import { apiQueryClient } from "@/lib/api/client";

export function useStaffQuery(institutionId: string | undefined) {
  return apiQueryClient.useQuery(
    "get",
    STAFF_API_PATHS.LIST,
    {
      params: {
        path: {
          institutionId: institutionId ?? "",
        },
      },
    },
    {
      enabled: Boolean(institutionId),
    },
  );
}

export function useStaffRolesQuery(institutionId: string | undefined) {
  return apiQueryClient.useQuery(
    "get",
    STAFF_API_PATHS.ROLES,
    {
      params: {
        path: {
          institutionId: institutionId ?? "",
        },
      },
    },
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
        queryKey: apiQueryClient.queryOptions(
          "get",
          STAFF_API_PATHS.LIST,
          {
            params: {
              path: {
                institutionId,
              },
            },
          },
        ).queryKey,
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
          institutionId: institutionId ?? "",
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
        queryKey: apiQueryClient.queryOptions(
          "get",
          STAFF_API_PATHS.LIST,
          {
            params: {
              path: {
                institutionId,
              },
            },
          },
        ).queryKey,
      });

      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions(
          "get",
          STAFF_API_PATHS.DETAIL,
          {
            params: {
              path: {
                institutionId,
                staffId: variables.params.path.staffId,
              },
            },
          },
        ).queryKey,
      });
    },
  });
}
