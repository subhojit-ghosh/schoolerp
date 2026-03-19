import { useQueryClient } from "@tanstack/react-query";
import { SORT_ORDERS } from "@/constants/query";
import { FEES_API_PATHS } from "@/features/auth/api/auth.constants";
import { FEE_STRUCTURE_LIST_SORT_FIELDS } from "@/features/fees/model/fee-structure-list.constants";
import { FEE_ASSIGNMENT_LIST_SORT_FIELDS } from "@/features/fees/model/fee-assignment-list.constants";
import { apiQueryClient } from "@/lib/api/client";

type FeeStructureSortField =
  (typeof FEE_STRUCTURE_LIST_SORT_FIELDS)[keyof typeof FEE_STRUCTURE_LIST_SORT_FIELDS];

type FeeAssignmentSortField =
  (typeof FEE_ASSIGNMENT_LIST_SORT_FIELDS)[keyof typeof FEE_ASSIGNMENT_LIST_SORT_FIELDS];

type SortOrder = (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];

export type FeeStructuresListQuery = {
  q?: string;
  page?: number;
  limit?: number;
  sort?: FeeStructureSortField;
  order?: SortOrder;
  academicYearId?: string;
  status?: "active" | "archived";
};

export type FeeAssignmentsListQuery = {
  q?: string;
  page?: number;
  limit?: number;
  sort?: FeeAssignmentSortField;
  order?: SortOrder;
  feeStructureId?: string;
  status?: "pending" | "partial" | "paid";
};

export type FeeDuesListQuery = {
  q?: string;
  page?: number;
  limit?: number;
  sort?: FeeAssignmentSortField;
  order?: SortOrder;
  overdue?: boolean;
};

export type CollectionSummaryQuery = {
  academicYearId?: string;
};

function invalidateFeesLists(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions("get", FEES_API_PATHS.LIST_STRUCTURES)
      .queryKey,
  });
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions(
      "get",
      FEES_API_PATHS.LIST_ASSIGNMENTS,
    ).queryKey,
  });
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions("get", FEES_API_PATHS.LIST_DUES)
      .queryKey,
  });
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions(
      "get",
      FEES_API_PATHS.COLLECTION_SUMMARY,
    ).queryKey,
  });
}

// ── Fee Structures ─────────────────────────────────────────────────────────

export function useFeeStructuresQuery(
  enabled: boolean,
  query: FeeStructuresListQuery = {},
) {
  return apiQueryClient.useQuery(
    "get",
    FEES_API_PATHS.LIST_STRUCTURES,
    { params: { query } },
    { enabled },
  );
}

export function useFeeStructureQuery(
  enabled: boolean,
  feeStructureId: string | undefined,
) {
  return apiQueryClient.useQuery(
    "get",
    FEES_API_PATHS.GET_STRUCTURE,
    { params: { path: { feeStructureId: feeStructureId ?? "" } } },
    { enabled: enabled && Boolean(feeStructureId) },
  );
}

export function useCreateFeeStructureMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("post", FEES_API_PATHS.CREATE_STRUCTURE, {
    onSuccess: () => {
      invalidateFeesLists(queryClient);
    },
  });
}

export function useUpdateFeeStructureMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("patch", FEES_API_PATHS.UPDATE_STRUCTURE, {
    onSuccess: (_, variables) => {
      invalidateFeesLists(queryClient);
      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions(
          "get",
          FEES_API_PATHS.GET_STRUCTURE,
          {
            params: {
              path: { feeStructureId: variables.params.path.feeStructureId },
            },
          },
        ).queryKey,
      });
    },
  });
}

export function useSetFeeStructureStatusMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation(
    "patch",
    FEES_API_PATHS.SET_STRUCTURE_STATUS,
    {
      onSuccess: (_, variables) => {
        invalidateFeesLists(queryClient);
        void queryClient.invalidateQueries({
          queryKey: apiQueryClient.queryOptions(
            "get",
            FEES_API_PATHS.GET_STRUCTURE,
            {
              params: {
                path: { feeStructureId: variables.params.path.feeStructureId },
              },
            },
          ).queryKey,
        });
      },
    },
  );
}

export function useDeleteFeeStructureMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("delete", FEES_API_PATHS.DELETE_STRUCTURE, {
    onSuccess: () => {
      invalidateFeesLists(queryClient);
    },
  });
}

export function useDuplicateFeeStructureMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation(
    "post",
    FEES_API_PATHS.DUPLICATE_STRUCTURE,
    {
      onSuccess: () => {
        invalidateFeesLists(queryClient);
      },
    },
  );
}

export function useCreateNextFeeStructureVersionMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation(
    "post",
    FEES_API_PATHS.CREATE_NEXT_STRUCTURE_VERSION,
    {
      onSuccess: () => {
        invalidateFeesLists(queryClient);
      },
    },
  );
}

// ── Fee Assignments ────────────────────────────────────────────────────────

export function useFeeAssignmentsQuery(
  enabled: boolean,
  query: FeeAssignmentsListQuery = {},
) {
  return apiQueryClient.useQuery(
    "get",
    FEES_API_PATHS.LIST_ASSIGNMENTS,
    { params: { query } },
    { enabled },
  );
}

export function useFeeAssignmentQuery(
  enabled: boolean,
  feeAssignmentId: string | undefined,
) {
  return apiQueryClient.useQuery(
    "get",
    FEES_API_PATHS.GET_ASSIGNMENT,
    { params: { path: { feeAssignmentId: feeAssignmentId ?? "" } } },
    { enabled: enabled && Boolean(feeAssignmentId) },
  );
}

export function useCreateFeeAssignmentMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("post", FEES_API_PATHS.CREATE_ASSIGNMENT, {
    onSuccess: () => {
      invalidateFeesLists(queryClient);
    },
  });
}

export function useBulkFeeAssignmentMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("post", FEES_API_PATHS.BULK_ASSIGN, {
    onSuccess: () => {
      invalidateFeesLists(queryClient);
    },
  });
}

export function useUpdateFeeAssignmentMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("patch", FEES_API_PATHS.UPDATE_ASSIGNMENT, {
    onSuccess: (_, variables) => {
      invalidateFeesLists(queryClient);
      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions(
          "get",
          FEES_API_PATHS.GET_ASSIGNMENT,
          {
            params: {
              path: {
                feeAssignmentId: variables.params.path.feeAssignmentId,
              },
            },
          },
        ).queryKey,
      });
    },
  });
}

export function useCreateFeeAdjustmentMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("post", FEES_API_PATHS.CREATE_ADJUSTMENT, {
    onSuccess: (_, variables) => {
      invalidateFeesLists(queryClient);
      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions(
          "get",
          FEES_API_PATHS.GET_ASSIGNMENT,
          {
            params: {
              path: {
                feeAssignmentId: variables.params.path.feeAssignmentId,
              },
            },
          },
        ).queryKey,
      });
    },
  });
}

export function useDeleteFeeAssignmentMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation(
    "delete",
    FEES_API_PATHS.DELETE_ASSIGNMENT,
    {
      onSuccess: () => {
        invalidateFeesLists(queryClient);
      },
    },
  );
}

// ── Fee Payments ───────────────────────────────────────────────────────────

export function useCreateFeePaymentMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("post", FEES_API_PATHS.CREATE_PAYMENT, {
    onSuccess: (_, variables) => {
      invalidateFeesLists(queryClient);
      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions(
          "get",
          FEES_API_PATHS.GET_ASSIGNMENT,
          {
            params: {
              path: {
                feeAssignmentId: variables.body.feeAssignmentId,
              },
            },
          },
        ).queryKey,
      });
    },
  });
}

export function useReverseFeePaymentMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("post", FEES_API_PATHS.REVERSE_PAYMENT, {
    onSuccess: () => {
      invalidateFeesLists(queryClient);
    },
  });
}

// ── Dues ───────────────────────────────────────────────────────────────────

export function useFeeDuesQuery(
  enabled: boolean,
  query: FeeDuesListQuery = {},
) {
  return apiQueryClient.useQuery(
    "get",
    FEES_API_PATHS.LIST_DUES,
    { params: { query } },
    { enabled },
  );
}

// ── Reports ────────────────────────────────────────────────────────────────

export function useCollectionSummaryQuery(
  enabled: boolean,
  query: CollectionSummaryQuery = {},
) {
  return apiQueryClient.useQuery(
    "get",
    FEES_API_PATHS.COLLECTION_SUMMARY,
    { params: { query } },
    { enabled },
  );
}
