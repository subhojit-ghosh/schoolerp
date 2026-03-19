import { useQueryClient } from "@tanstack/react-query";
import type { DataExchangeEntityType } from "@repo/contracts";
import { DATA_EXCHANGE_API_PATHS } from "@/features/auth/api/auth.constants";
import { apiQueryClient } from "@/lib/api/client";
import { APP_FALLBACKS } from "@/constants/api";

function getApiBaseUrl() {
  return import.meta.env.VITE_API_URL ?? APP_FALLBACKS.API_URL;
}

export function useDataExchangeCapabilitiesQuery(enabled: boolean) {
  return apiQueryClient.useQuery(
    "get",
    DATA_EXCHANGE_API_PATHS.CAPABILITIES,
    undefined,
    { enabled },
  );
}

export function usePreviewDataExchangeImportMutation() {
  return apiQueryClient.useMutation(
    "post",
    DATA_EXCHANGE_API_PATHS.PREVIEW_IMPORT,
  );
}

export function useExecuteDataExchangeImportMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation(
    "post",
    DATA_EXCHANGE_API_PATHS.EXECUTE_IMPORT,
    {
      onSuccess: () => {
        void queryClient.invalidateQueries();
      },
    },
  );
}

async function downloadCsv(path: string, fallbackFileName: string) {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Download failed.");
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get("content-disposition");
  const fileName =
    contentDisposition?.match(/filename="(.+)"/)?.[1] ?? fallbackFileName;
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
}

export function downloadDataExchangeTemplate(
  entityType: DataExchangeEntityType,
) {
  return downloadCsv(
    DATA_EXCHANGE_API_PATHS.TEMPLATE.replace("{entityType}", entityType),
    `${entityType}-template.csv`,
  );
}

export function downloadDataExchangeExport(entityType: DataExchangeEntityType) {
  return downloadCsv(
    DATA_EXCHANGE_API_PATHS.EXPORT.replace("{entityType}", entityType),
    `${entityType}-export.csv`,
  );
}
