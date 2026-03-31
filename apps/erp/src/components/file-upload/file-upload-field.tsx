import { useCallback, useRef, useState } from "react";
import {
  IconCloudUpload,
  IconFile,
  IconLoader2,
  IconTrash,
  IconDownload,
} from "@tabler/icons-react";
import { Button } from "@repo/ui/components/ui/button";
import { cn } from "@repo/ui/lib/utils";
import {
  uploadFile,
  buildDownloadUrl,
} from "@/features/file-uploads/api/use-file-uploads";

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type UploadedFile = {
  id: string;
  filename: string;
  url?: string;
};

type FileUploadFieldProps = {
  /** Accepted MIME types, e.g. "image/*,.pdf" */
  accept?: string;
  /** Currently uploaded file (controlled) */
  value?: UploadedFile | null;
  /** Called when a file is uploaded or deleted */
  onChange?: (file: UploadedFile | null) => void;
  /** Called when an error occurs */
  onError?: (message: string) => void;
  /** Disable the field */
  disabled?: boolean;
  /** Custom max size in bytes (default 10 MB) */
  maxSizeBytes?: number;
  /** Helper text shown below the drop zone */
  helperText?: string;
};

type UploadState = "idle" | "uploading" | "done" | "error";

export function FileUploadField({
  accept,
  value,
  onChange,
  onError,
  disabled = false,
  maxSizeBytes = MAX_FILE_SIZE_BYTES,
  helperText,
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>(
    value ? "done" : "idle",
  );
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > maxSizeBytes) {
        const maxMB = Math.round(maxSizeBytes / (1024 * 1024));
        const message = `File exceeds maximum size of ${maxMB} MB`;
        onError?.(message);
        return;
      }

      setUploadState("uploading");
      setProgress(0);

      try {
        const result = await uploadFile(file, (percent) => {
          setProgress(percent);
        });

        const uploaded: UploadedFile = {
          id: result.id,
          filename: result.filename,
          url: result.url,
        };

        setUploadState("done");
        onChange?.(uploaded);
      } catch (error) {
        setUploadState("error");
        const message =
          error instanceof Error ? error.message : "Upload failed";
        onError?.(message);
      }
    },
    [maxSizeBytes, onChange, onError],
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        void handleFile(file);
      }
      // Reset input so re-selecting the same file triggers change
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [handleFile],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setDragOver(false);

      if (disabled) return;

      const file = event.dataTransfer.files[0];
      if (file) {
        void handleFile(file);
      }
    },
    [disabled, handleFile],
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (!disabled) setDragOver(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setDragOver(false);
    },
    [],
  );

  const handleDelete = useCallback(() => {
    setUploadState("idle");
    setProgress(0);
    onChange?.(null);
  }, [onChange]);

  const handleClick = useCallback(() => {
    if (!disabled && uploadState !== "uploading") {
      inputRef.current?.click();
    }
  }, [disabled, uploadState]);

  // Show uploaded file
  if (value && (uploadState === "done" || uploadState === "idle")) {
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
          <IconFile className="size-5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{value.filename}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            asChild
            className="h-8 w-8 rounded-md"
            size="icon"
            type="button"
            variant="ghost"
          >
            <a
              download
              href={buildDownloadUrl(value.id)}
              rel="noopener noreferrer"
              target="_blank"
            >
              <IconDownload className="size-4" />
            </a>
          </Button>
          <Button
            className="h-8 w-8 rounded-md"
            disabled={disabled}
            onClick={handleDelete}
            size="icon"
            type="button"
            variant="ghost"
          >
            <IconTrash className="size-4 text-destructive" />
          </Button>
        </div>
      </div>
    );
  }

  // Show upload zone
  return (
    <div>
      <div
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
          dragOver
            ? "border-primary/60 bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/40",
          disabled && "pointer-events-none opacity-50",
          uploadState === "error" && "border-destructive/50",
        )}
        onClick={handleClick}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <input
          accept={accept}
          className="hidden"
          disabled={disabled}
          onChange={handleInputChange}
          ref={inputRef}
          type="file"
        />

        {uploadState === "uploading" ? (
          <div className="flex flex-col items-center gap-2">
            <IconLoader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">
              Uploading... {progress}%
            </p>
            <div className="h-1.5 w-48 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  background: "var(--primary)",
                }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <IconCloudUpload className="size-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Drop a file here or click to browse
              </p>
              {helperText ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {helperText}
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Max {Math.round(maxSizeBytes / (1024 * 1024))} MB
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {uploadState === "error" ? (
        <p className="mt-1.5 text-xs text-destructive">
          Upload failed. Please try again.
        </p>
      ) : null}
    </div>
  );
}
