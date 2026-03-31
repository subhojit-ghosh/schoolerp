import { useQueryClient } from "@tanstack/react-query";
import { FILE_UPLOADS_API_PATHS } from "@/features/auth/api/auth.constants";
import { apiQueryClient } from "@/lib/api/client";
import { APP_FALLBACKS } from "@/constants/api";

// ── List ────────────────────────────────────────────────────────────────────

export function useFileUploadsQuery(
  enabled: boolean,
  query: {
    entityType: string;
    entityId?: string;
    page?: number;
    limit?: number;
  },
) {
  return apiQueryClient.useQuery(
    "get",
    FILE_UPLOADS_API_PATHS.LIST,
    { params: { query } },
    { enabled },
  );
}

// ── Detail ──────────────────────────────────────────────────────────────────

export function useFileUploadQuery(enabled: boolean, fileId?: string) {
  return apiQueryClient.useQuery(
    "get",
    FILE_UPLOADS_API_PATHS.GET,
    { params: { path: { fileId: fileId! } } },
    { enabled: enabled && Boolean(fileId) },
  );
}

// ── Delete ──────────────────────────────────────────────────────────────────

export function useDeleteFileUploadMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("delete", FILE_UPLOADS_API_PATHS.DELETE, {
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["get", FILE_UPLOADS_API_PATHS.LIST],
      });
    },
  });
}

// ── Upload (multipart) ─────────────────────────────────────────────────────

type UploadProgressCallback = (percent: number) => void;

type UploadResult = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
};

/**
 * Upload a file via multipart POST. Uses XMLHttpRequest for progress tracking.
 * Returns the created file record from the server.
 */
export function uploadFile(
  file: File,
  onProgress?: UploadProgressCallback,
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as UploadResult;
          resolve(data);
        } catch {
          reject(new Error("Invalid response from upload"));
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Upload failed due to a network error"));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload aborted"));
    });

    // Build the full URL using the same base as the fetch client
    const baseUrl = import.meta.env.VITE_API_URL ?? APP_FALLBACKS.API_URL;
    xhr.open("POST", `${baseUrl}${FILE_UPLOADS_API_PATHS.UPLOAD}`);
    xhr.withCredentials = true;
    xhr.send(formData);
  });
}

/**
 * Build a download URL for a given file ID.
 */
export function buildDownloadUrl(fileId: string): string {
  const baseUrl = import.meta.env.VITE_API_URL ?? "/api";
  return `${baseUrl}${FILE_UPLOADS_API_PATHS.DOWNLOAD.replace("{fileId}", fileId)}`;
}
