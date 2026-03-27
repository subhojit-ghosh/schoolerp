import { useQueryClient } from "@tanstack/react-query";
import { TRANSPORT_API_PATHS } from "@/features/auth/api/auth.constants";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { apiQueryClient } from "@/lib/api/client";

// Transport paths are not yet in the OpenAPI spec — cast to any to bypass type constraints until openapi is regenerated
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const api = apiQueryClient as any;

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

function invalidateRouteQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryKey: api.queryOptions("get", TRANSPORT_API_PATHS.LIST_ROUTES, { params: { query: {} as any } })
      .queryKey,
  });
}

function invalidateRouteDetailQuery(
  queryClient: ReturnType<typeof useQueryClient>,
  routeId: string,
) {
  void queryClient.invalidateQueries({
    queryKey: api.queryOptions("get", TRANSPORT_API_PATHS.GET_ROUTE, {
      params: { path: { routeId } },
    }).queryKey,
  });
}

function invalidateVehicleQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryKey: api.queryOptions("get", TRANSPORT_API_PATHS.LIST_VEHICLES, { params: { query: {} as any } })
      .queryKey,
  });
}

function invalidateAssignmentQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryKey: api.queryOptions("get", TRANSPORT_API_PATHS.LIST_ASSIGNMENTS, { params: { query: {} as any } })
      .queryKey,
  });
}

// ── Routes ──────────────────────────────────────────────────────────────────

export function useTransportRoutesQuery(enabled: boolean, query: TransportRoutesQuery = {}) {
  return api.useQuery(
    "get",
    TRANSPORT_API_PATHS.LIST_ROUTES,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { params: { query: query as any } },
    { enabled },
  );
}

export function useTransportRouteQuery(routeId: string, enabled: boolean) {
  return api.useQuery(
    "get",
    TRANSPORT_API_PATHS.GET_ROUTE,
    { params: { path: { routeId } } },
    { enabled },
  );
}

export function useCreateRouteMutation() {
  const queryClient = useQueryClient();
  return api.useMutation("post", TRANSPORT_API_PATHS.CREATE_ROUTE, {
    onSuccess: () => {
      invalidateRouteQueries(queryClient);
    },
  });
}

export function useUpdateRouteMutation() {
  const queryClient = useQueryClient();
  return api.useMutation("put", TRANSPORT_API_PATHS.UPDATE_ROUTE, {
    onSuccess: () => {
      invalidateRouteQueries(queryClient);
    },
  });
}

export function useCreateStopMutation(routeId: string) {
  const queryClient = useQueryClient();
  return api.useMutation("post", TRANSPORT_API_PATHS.CREATE_STOP, {
    onSuccess: () => {
      invalidateRouteQueries(queryClient);
      invalidateRouteDetailQuery(queryClient, routeId);
    },
  });
}

export function useUpdateStopMutation(routeId: string) {
  const queryClient = useQueryClient();
  return api.useMutation("put", TRANSPORT_API_PATHS.UPDATE_STOP, {
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
  return api.useQuery(
    "get",
    TRANSPORT_API_PATHS.LIST_VEHICLES,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { params: { query: query as any } },
    { enabled },
  );
}

export function useCreateVehicleMutation() {
  const queryClient = useQueryClient();
  return api.useMutation("post", TRANSPORT_API_PATHS.CREATE_VEHICLE, {
    onSuccess: () => {
      invalidateVehicleQueries(queryClient);
    },
  });
}

export function useUpdateVehicleMutation() {
  const queryClient = useQueryClient();
  return api.useMutation("put", TRANSPORT_API_PATHS.UPDATE_VEHICLE, {
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
  return api.useQuery(
    "get",
    TRANSPORT_API_PATHS.LIST_ASSIGNMENTS,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { params: { query: query as any } },
    { enabled },
  );
}

export function useCreateAssignmentMutation() {
  const queryClient = useQueryClient();
  return api.useMutation("post", TRANSPORT_API_PATHS.CREATE_ASSIGNMENT, {
    onSuccess: () => {
      invalidateAssignmentQueries(queryClient);
    },
  });
}

export function useUpdateAssignmentMutation() {
  const queryClient = useQueryClient();
  return api.useMutation("put", TRANSPORT_API_PATHS.UPDATE_ASSIGNMENT, {
    onSuccess: () => {
      invalidateAssignmentQueries(queryClient);
    },
  });
}
