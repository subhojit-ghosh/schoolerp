import { useRef, type ChangeEvent } from "react";
import { Button } from "@repo/ui/components/ui/button";
import { cn } from "@repo/ui/lib/utils";

const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon";

type ImageUploadProps = {
  /** Current saved URL (from DB) or local blob preview */
  value: string | undefined;
  /** Called with blob preview URL on file select, or empty string on remove */
  onChange: (url: string) => void;
  /** Called with the selected File, or null on remove */
  onFileSelect: (file: File | null) => void;
  label: string;
  disabled?: boolean;
  previewClassName?: string;
};

export function ImageUpload({
  value,
  onChange,
  onFileSelect,
  label,
  disabled,
  previewClassName,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const prevBlobRef = useRef<string | null>(null);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Revoke previous blob URL if any
    if (prevBlobRef.current) {
      URL.revokeObjectURL(prevBlobRef.current);
    }

    const blobUrl = URL.createObjectURL(file);
    prevBlobRef.current = blobUrl;

    onChange(blobUrl);
    onFileSelect(file);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleRemove() {
    if (prevBlobRef.current) {
      URL.revokeObjectURL(prevBlobRef.current);
      prevBlobRef.current = null;
    }

    onChange("");
    onFileSelect(null);
  }

  const hasValue = !!value;

  return (
    <div className="flex flex-col gap-2">
      {hasValue ? (
        <div
          className={cn(
            "flex items-center justify-center rounded-lg border border-border bg-muted/30 p-3",
            previewClassName,
          )}
        >
          <img
            alt={label}
            className="max-h-full max-w-full object-contain"
            src={value}
          />
        </div>
      ) : (
        <div
          className={cn(
            "flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground",
            previewClassName ?? "h-20",
          )}
        >
          No {label.toLowerCase()} uploaded
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          className="h-8 rounded-lg text-xs"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          type="button"
          variant="outline"
        >
          {hasValue ? "Replace" : "Upload"}
        </Button>

        {hasValue && !disabled && (
          <Button
            className="h-8 rounded-lg text-xs"
            onClick={handleRemove}
            type="button"
            variant="ghost"
          >
            Remove
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        accept={ACCEPT}
        className="hidden"
        disabled={disabled}
        onChange={handleFileChange}
        type="file"
      />
    </div>
  );
}
