import { useState, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const PRESIGN_URL = `${API_BASE}/uploads/presign`;

export type UploadFolder = "branding/logo" | "branding/favicon" | "avatar";

type UploadState = {
  isUploading: boolean;
  error: string | null;
};

type PresignResponse = {
  uploadUrl: string;
  publicUrl: string;
  key: string;
};

export function useUpload() {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    error: null,
  });

  const upload = useCallback(
    async (file: File, folder: UploadFolder): Promise<string | null> => {
      setState({ isUploading: true, error: null });

      try {
        const presignResponse = await fetch(PRESIGN_URL, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            folder,
            contentType: file.type,
            fileSize: file.size,
          }),
        });

        if (!presignResponse.ok) {
          const errorBody = await presignResponse.json().catch(() => null);
          throw new Error(
            errorBody?.message ?? "Failed to get upload URL",
          );
        }

        const { uploadUrl, publicUrl } =
          (await presignResponse.json()) as PresignResponse;

        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload file");
        }

        setState({ isUploading: false, error: null });
        return publicUrl;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Upload failed";
        setState({ isUploading: false, error: message });
        return null;
      }
    },
    [],
  );

  return { ...state, upload };
}
