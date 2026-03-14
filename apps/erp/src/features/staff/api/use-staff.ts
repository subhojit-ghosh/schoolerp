import { useQueryClient } from "@tanstack/react-query";
import { SORT_ORDERS } from "@/constants/query";
import { STAFF_API_PATHS } from "@/features/auth/api/auth.constants";
import { STAFF_LIST_SORT_FIELDS } from "@/features/staff/model/staff-list.constants";
import { apiQueryClient } from "@/lib/api/client";

type StaffListSort =
  (typeof STAFF_LIST_SORT_FIELDS)[keyof typeof STAFF_LIST_SORT_FIELDS];

type StaffListQuery = {
  limit?: number;
  order?: (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];
  page?: number;
  q?: string;
  sort?: StaffListSort;
};

function getStaffListQueryKey(_institutionId: string, query?: StaffListQuery) {
  return apiQueryClient.queryOptions(
    "get",
    STAFF_API_PATHS.LIST,
    query
      ? {
          params: {
            query,
          },
        }
      : undefined,
  ).queryKey;
}

export function useStaffQuery(
  institutionId: string | undefined,
  query?: StaffListQuery,
) {
  return apiQueryClient.useQuery(
    "get",
    STAFF_API_PATHS.LIST,
    query
      ? {
          params: {
            query,
          },
        }
      : undefined,
    {
      enabled: Boolean(institutionId),
    },
  );
}

export function useStaffRolesQuery(institutionId: string | undefined) {
  return apiQueryClient.useQuery("get", STAFF_API_PATHS.ROLES, undefined, {
    enabled: Boolean(institutionId),
  });
}

export function useCreateStaffMutation(institutionId: string | undefined) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("post", STAFF_API_PATHS.CREATE, {
    onSuccess: () => {
      if (!institutionId) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: getStaffListQueryKey(institutionId),
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
        queryKey: getStaffListQueryKey(institutionId),
      });

      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions("get", STAFF_API_PATHS.DETAIL, {
          params: {
            path: {
              staffId: variables.params.path.staffId,
            },
          },
        }).queryKey,
      });
    },
  });
}
