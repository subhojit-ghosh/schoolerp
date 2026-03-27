import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const PAYMENT_SETTINGS_BASE = `${API_BASE}/settings/payment`;

export type PaymentConfig = {
  id: string;
  provider: string;
  displayLabel: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpsertPaymentConfigBody = {
  provider: string;
  credentials: Record<string, string>;
  displayLabel?: string | null;
};

const PAYMENT_CONFIG_QUERY_KEY = ["payment-config"];

export function usePaymentConfigQuery() {
  return useQuery({
    queryKey: PAYMENT_CONFIG_QUERY_KEY,
    queryFn: async (): Promise<PaymentConfig | null> => {
      const response = await fetch(PAYMENT_SETTINGS_BASE, {
        credentials: "include",
      });

      if (response.status === 404) return null;

      if (!response.ok) {
        throw new Error("Failed to load payment config");
      }

      return response.json();
    },
  });
}

export function useUpsertPaymentConfigMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: UpsertPaymentConfigBody) => {
      const response = await fetch(PAYMENT_SETTINGS_BASE, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          (errorData as { message?: string })?.message ??
            "Failed to save payment config",
        );
      }

      return response.json() as Promise<PaymentConfig>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_CONFIG_QUERY_KEY });
    },
  });
}

export function useDeactivatePaymentConfigMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(PAYMENT_SETTINGS_BASE, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to deactivate payment config");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_CONFIG_QUERY_KEY });
    },
  });
}
