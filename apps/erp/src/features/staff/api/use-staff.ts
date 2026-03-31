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
  status?: ("active" | "inactive" | "suspended")[];
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

export function useStaffRoleAssignmentsQuery(
  institutionId: string | undefined,
  staffId: string | undefined,
) {
  return apiQueryClient.useQuery(
    "get",
    STAFF_API_PATHS.LIST_ASSIGNMENTS,
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

export function useCreateStaffRoleAssignmentMutation(
  institutionId: string | undefined,
) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("post", STAFF_API_PATHS.CREATE_ASSIGNMENT, {
    onSuccess: (_, variables) => {
      if (!institutionId) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: getStaffListQueryKey(institutionId),
      });

      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions(
          "get",
          STAFF_API_PATHS.LIST_ASSIGNMENTS,
          {
            params: {
              path: {
                staffId: variables.params.path.staffId,
              },
            },
          },
        ).queryKey,
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

export function useSetStaffStatusMutation(institutionId: string | undefined) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("patch", STAFF_API_PATHS.SET_STATUS, {
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

export function useDeleteStaffMutation(institutionId: string | undefined) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("delete", STAFF_API_PATHS.DELETE, {
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

export function useResetStaffPasswordMutation(
  _institutionId: string | undefined,
) {
  return apiQueryClient.useMutation("post", STAFF_API_PATHS.RESET_PASSWORD);
}

export function useStaffSubjectAssignmentsQuery(
  institutionId: string | undefined,
  staffId: string | undefined,
) {
  return apiQueryClient.useQuery(
    "get",
    STAFF_API_PATHS.LIST_SUBJECTS,
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

export function useCreateStaffSubjectAssignmentMutation(
  institutionId: string | undefined,
) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("post", STAFF_API_PATHS.CREATE_SUBJECT, {
    onSuccess: (_, variables) => {
      if (!institutionId) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions(
          "get",
          STAFF_API_PATHS.LIST_SUBJECTS,
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

export function useDeleteStaffSubjectAssignmentMutation(
  institutionId: string | undefined,
) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("delete", STAFF_API_PATHS.DELETE_SUBJECT, {
    onSuccess: (_, variables) => {
      if (!institutionId) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions(
          "get",
          STAFF_API_PATHS.LIST_SUBJECTS,
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

export function useDeleteStaffRoleAssignmentMutation(
  institutionId: string | undefined,
) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation(
    "delete",
    STAFF_API_PATHS.DELETE_ASSIGNMENT,
    {
      onSuccess: (_, variables) => {
        if (!institutionId) {
          return;
        }

        void queryClient.invalidateQueries({
          queryKey: getStaffListQueryKey(institutionId),
        });

        void queryClient.invalidateQueries({
          queryKey: apiQueryClient.queryOptions(
            "get",
            STAFF_API_PATHS.LIST_ASSIGNMENTS,
            {
              params: {
                path: {
                  staffId: variables.params.path.staffId,
                },
              },
            },
          ).queryKey,
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
    },
  );
}

// --- Phase 2: Staff Documents ---

export function useStaffDocumentsQuery(
  institutionId: string | undefined,
  staffId: string | undefined,
) {
  return apiQueryClient.useQuery(
    "get",
    STAFF_API_PATHS.LIST_DOCUMENTS,
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

function invalidateStaffDocuments(
  queryClient: ReturnType<typeof useQueryClient>,
  staffId: string,
) {
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions(
      "get",
      STAFF_API_PATHS.LIST_DOCUMENTS,
      {
        params: {
          path: { staffId },
        },
      },
    ).queryKey,
  });
}

export function useCreateStaffDocumentMutation(
  institutionId: string | undefined,
) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("post", STAFF_API_PATHS.CREATE_DOCUMENT, {
    onSuccess: (_, variables) => {
      if (!institutionId) {
        return;
      }

      invalidateStaffDocuments(queryClient, variables.params.path.staffId);
    },
  });
}

export function useUpdateStaffDocumentMutation(
  institutionId: string | undefined,
) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("patch", STAFF_API_PATHS.UPDATE_DOCUMENT, {
    onSuccess: (_, variables) => {
      if (!institutionId) {
        return;
      }

      invalidateStaffDocuments(queryClient, variables.params.path.staffId);
    },
  });
}

export function useDeleteStaffDocumentMutation(
  institutionId: string | undefined,
) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("delete", STAFF_API_PATHS.DELETE_DOCUMENT, {
    onSuccess: (_, variables) => {
      if (!institutionId) {
        return;
      }

      invalidateStaffDocuments(queryClient, variables.params.path.staffId);
    },
  });
}

// --- Phase 2: Teaching Load ---

export function useTeachingLoadQuery(
  institutionId: string | undefined,
  staffId: string | undefined,
) {
  return apiQueryClient.useQuery(
    "get",
    STAFF_API_PATHS.TEACHING_LOAD,
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

// --- Phase 2: Campus Transfers ---

export function useStaffCampusTransfersQuery(
  institutionId: string | undefined,
  staffId: string | undefined,
) {
  return apiQueryClient.useQuery(
    "get",
    STAFF_API_PATHS.LIST_CAMPUS_TRANSFERS,
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

export function useCreateStaffCampusTransferMutation(
  institutionId: string | undefined,
) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation(
    "post",
    STAFF_API_PATHS.CREATE_CAMPUS_TRANSFER,
    {
      onSuccess: (_, variables) => {
        if (!institutionId) {
          return;
        }

        void queryClient.invalidateQueries({
          queryKey: apiQueryClient.queryOptions(
            "get",
            STAFF_API_PATHS.LIST_CAMPUS_TRANSFERS,
            {
              params: {
                path: {
                  staffId: variables.params.path.staffId,
                },
              },
            },
          ).queryKey,
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

        void queryClient.invalidateQueries({
          queryKey: getStaffListQueryKey(institutionId),
        });
      },
    },
  );
}
