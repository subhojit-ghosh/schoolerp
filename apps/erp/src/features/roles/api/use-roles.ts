import { useQueryClient } from "@tanstack/react-query";
import { apiQueryClient } from "@/lib/api/client";
import {
  PERMISSIONS_API_PATHS,
  ROLES_API_PATHS,
} from "@/features/auth/api/auth.constants";

export function useRolesQuery(enabled: boolean) {
  return apiQueryClient.useQuery("get", ROLES_API_PATHS.LIST, undefined, {
    enabled,
  });
}

export function usePermissionsQuery(enabled: boolean) {
  return apiQueryClient.useQuery("get", PERMISSIONS_API_PATHS.LIST, undefined, {
    enabled,
  });
}

export function useRoleQuery(enabled: boolean, roleId: string | undefined) {
  return apiQueryClient.useQuery(
    "get",
    ROLES_API_PATHS.DETAIL,
    { params: { path: { roleId: roleId ?? "" } } },
    { enabled: enabled && Boolean(roleId) },
  );
}

export function useCreateRoleMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("post", ROLES_API_PATHS.CREATE, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions("get", ROLES_API_PATHS.LIST)
          .queryKey,
      });
    },
  });
}

export function useUpdateRoleMutation(roleId: string) {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("patch", ROLES_API_PATHS.UPDATE, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions("get", ROLES_API_PATHS.LIST)
          .queryKey,
      });
      await queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions("get", ROLES_API_PATHS.DETAIL, {
          params: { path: { roleId } },
        }).queryKey,
      });
    },
  });
}

export function useDeleteRoleMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("delete", ROLES_API_PATHS.DELETE, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions("get", ROLES_API_PATHS.LIST)
          .queryKey,
      });
    },
  });
}
