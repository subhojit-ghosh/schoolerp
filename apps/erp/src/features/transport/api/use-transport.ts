import { useQueryClient } from "@tanstack/react-query";
import { TRANSPORT_API_PATHS } from "@/features/auth/api/auth.constants";
import { apiQueryClient } from "@/lib/api/client";

export type TransportRoutesQuery = {
  q?: string;
  campusId?: string;
  status?: "active" | "inactive";
  page?: number;
  limit?: number;
  sort?: "name" | "createdAt";
  order?: "asc" | "desc";
};

export type TransportVehiclesQuery = {
  q?: string;
  routeId?: string;
  status?: "active" | "inactive";
  page?: number;
  limit?: number;
  sort?: "registrationNumber" | "type" | "createdAt";
  order?: "asc" | "desc";
};

export type TransportAssignmentsQuery = {
  q?: string;
  routeId?: string;
  stopId?: string;
  studentId?: string;
  status?: "active" | "inactive";
  page?: number;
  limit?: number;
  sort?: "startDate" | "createdAt";
  order?: "asc" | "desc";
};

function invalidateRouteQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions(
      "get",
      TRANSPORT_API_PATHS.LIST_ROUTES,
      { params: { query: {} } },
    ).queryKey,
  });
}

function invalidateRouteDetailQuery(
  queryClient: ReturnType<typeof useQueryClient>,
  routeId: string,
) {
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions(
      "get",
      TRANSPORT_API_PATHS.GET_ROUTE,
      {
        params: { path: { routeId } },
      },
    ).queryKey,
  });
}

function invalidateVehicleQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions(
      "get",
      TRANSPORT_API_PATHS.LIST_VEHICLES,
      { params: { query: {} } },
    ).queryKey,
  });
}

function invalidateAssignmentQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions(
      "get",
      TRANSPORT_API_PATHS.LIST_ASSIGNMENTS,
      { params: { query: {} } },
    ).queryKey,
  });
}

// ── Routes ──────────────────────────────────────────────────────────────────

export function useTransportRoutesQuery(
  enabled: boolean,
  query: TransportRoutesQuery = {},
) {
  return apiQueryClient.useQuery(
    "get",
    TRANSPORT_API_PATHS.LIST_ROUTES,
    { params: { query } },
    { enabled },
  );
}

export function useTransportRouteQuery(routeId: string, enabled: boolean) {
  return apiQueryClient.useQuery(
    "get",
    TRANSPORT_API_PATHS.GET_ROUTE,
    { params: { path: { routeId } } },
    { enabled },
  );
}

export function useCreateRouteMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("post", TRANSPORT_API_PATHS.CREATE_ROUTE, {
    onSuccess: () => {
      invalidateRouteQueries(queryClient);
    },
  });
}

export function useUpdateRouteMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("put", TRANSPORT_API_PATHS.UPDATE_ROUTE, {
    onSuccess: () => {
      invalidateRouteQueries(queryClient);
    },
  });
}

export function useCreateStopMutation(routeId: string) {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("post", TRANSPORT_API_PATHS.CREATE_STOP, {
    onSuccess: () => {
      invalidateRouteQueries(queryClient);
      invalidateRouteDetailQuery(queryClient, routeId);
    },
  });
}

export function useUpdateStopMutation(routeId: string) {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("put", TRANSPORT_API_PATHS.UPDATE_STOP, {
    onSuccess: () => {
      invalidateRouteQueries(queryClient);
      invalidateRouteDetailQuery(queryClient, routeId);
    },
  });
}

// ── Vehicles ────────────────────────────────────────────────────────────────

export function useTransportVehiclesQuery(
  enabled: boolean,
  query: TransportVehiclesQuery = {},
) {
  return apiQueryClient.useQuery(
    "get",
    TRANSPORT_API_PATHS.LIST_VEHICLES,
    { params: { query } },
    { enabled },
  );
}

export function useCreateVehicleMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "post",
    TRANSPORT_API_PATHS.CREATE_VEHICLE,
    {
      onSuccess: () => {
        invalidateVehicleQueries(queryClient);
      },
    },
  );
}

export function useUpdateVehicleMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("put", TRANSPORT_API_PATHS.UPDATE_VEHICLE, {
    onSuccess: () => {
      invalidateVehicleQueries(queryClient);
    },
  });
}

// ── Assignments ─────────────────────────────────────────────────────────────

export function useTransportAssignmentsQuery(
  enabled: boolean,
  query: TransportAssignmentsQuery = {},
) {
  return apiQueryClient.useQuery(
    "get",
    TRANSPORT_API_PATHS.LIST_ASSIGNMENTS,
    { params: { query } },
    { enabled },
  );
}

export function useCreateAssignmentMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "post",
    TRANSPORT_API_PATHS.CREATE_ASSIGNMENT,
    {
      onSuccess: () => {
        invalidateAssignmentQueries(queryClient);
      },
    },
  );
}

export function useUpdateAssignmentMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "put",
    TRANSPORT_API_PATHS.UPDATE_ASSIGNMENT,
    {
      onSuccess: () => {
        invalidateAssignmentQueries(queryClient);
      },
    },
  );
}
