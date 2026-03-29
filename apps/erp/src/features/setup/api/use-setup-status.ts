import { useQuery } from "@tanstack/react-query";
import { ONBOARDING_API_PATHS } from "@/features/auth/api/auth.constants";
import { APP_FALLBACKS } from "@/constants/api";

export type SetupStatus = {
  academicYears: number;
  classes: number;
  students: number;
  staff: number;
  subjects: number;
  feeStructures: number;
};

const SETUP_STATUS_QUERY_KEY = ["setup-status"] as const;

function getApiBaseUrl() {
  return import.meta.env.VITE_API_URL ?? APP_FALLBACKS.API_URL;
}

async function fetchSetupStatus(): Promise<SetupStatus> {
  const response = await fetch(
    `${getApiBaseUrl()}${ONBOARDING_API_PATHS.SETUP_STATUS}`,
    { credentials: "include" },
  );
  if (!response.ok) {
    throw new Error("Failed to fetch setup status");
  }
  return response.json();
}

export function useSetupStatusQuery(enabled: boolean) {
  return useQuery({
    queryKey: SETUP_STATUS_QUERY_KEY,
    queryFn: fetchSetupStatus,
    enabled,
    staleTime: 30_000,
  });
}
