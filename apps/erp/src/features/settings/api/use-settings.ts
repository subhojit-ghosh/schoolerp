import { useMutation } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

export type UpdateBrandingBody = {
  name: string;
  shortName: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  accentColor: string;
  sidebarColor: string;
  fontHeading?: string;
  fontBody?: string;
  fontMono?: string;
  borderRadius?: string;
  uiDensity?: string;
};

export type UpdateBrandingResponse = {
  name: string;
  shortName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  accentColor: string;
  sidebarColor: string;
  fontHeading: string | null;
  fontBody: string | null;
  fontMono: string | null;
  borderRadius: string | null;
  uiDensity: string | null;
};

export function useUpdateBrandingMutation(institutionId: string | undefined) {
  return useMutation({
    mutationFn: async (body: UpdateBrandingBody): Promise<UpdateBrandingResponse> => {
      if (!institutionId) {
        throw new Error("No active institution.");
      }

      const response = await fetch(
        `${API_BASE}/institutions/${institutionId}/branding`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update branding.");
      }

      return response.json() as Promise<UpdateBrandingResponse>;
    },
  });
}
