import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const DELIVERY_SETTINGS_BASE = `${API_BASE}/settings/delivery`;

export type DeliveryConfig = {
  id: string;
  channel: string;
  provider: string;
  senderIdentity: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ListDeliveryConfigsResponse = {
  configs: DeliveryConfig[];
};

export type UpsertDeliveryConfigBody = {
  provider: string;
  credentials: Record<string, string>;
  senderIdentity?: string;
};

export type TestDeliveryBody = {
  channel: string;
  recipient: string;
};

export type TestDeliveryResponse = {
  accepted: boolean;
  provider: string;
  externalId?: string | null;
};

const DELIVERY_CONFIGS_QUERY_KEY = ["delivery-configs"];

export function useDeliveryConfigsQuery() {
  return useQuery({
    queryKey: DELIVERY_CONFIGS_QUERY_KEY,
    queryFn: async (): Promise<ListDeliveryConfigsResponse> => {
      const response = await fetch(DELIVERY_SETTINGS_BASE, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load delivery configs");
      }

      return response.json();
    },
  });
}

export function useUpsertDeliveryConfigMutation(channel: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: UpsertDeliveryConfigBody) => {
      const response = await fetch(`${DELIVERY_SETTINGS_BASE}/${channel}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          (errorData as { message?: string })?.message ??
            "Failed to save delivery config",
        );
      }

      return response.json() as Promise<DeliveryConfig>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DELIVERY_CONFIGS_QUERY_KEY });
    },
  });
}

export function useDeactivateDeliveryConfigMutation(channel: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`${DELIVERY_SETTINGS_BASE}/${channel}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to deactivate delivery config");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DELIVERY_CONFIGS_QUERY_KEY });
    },
  });
}

export function useTestDeliveryMutation() {
  return useMutation({
    mutationFn: async (body: TestDeliveryBody) => {
      const response = await fetch(`${DELIVERY_SETTINGS_BASE}/test`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          (errorData as { message?: string })?.message ??
            "Test delivery failed",
        );
      }

      return response.json() as Promise<TestDeliveryResponse>;
    },
  });
}
