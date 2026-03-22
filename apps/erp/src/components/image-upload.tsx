import { useRef, useState, type ChangeEvent } from "react";
import { Button } from "@repo/ui/components/ui/button";
import { cn } from "@repo/ui/lib/utils";
import { useUpload, type UploadFolder } from "@/hooks/use-upload";

const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon";

type ImageUploadProps = {
  value: string | undefined;
  onChange: (url: string) => void;
  folder: UploadFolder;
  label: string;
  previewClassName?: string;
};

export function ImageUpload({
  value,
  onChange,
  folder,
  label,
  previewClassName,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { isUploading, error, upload } = useUpload();
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);

    const publicUrl = await upload(file, folder);

    if (publicUrl) {
      onChange(publicUrl);
    }

    setLocalPreview(null);
    URL.revokeObjectURL(objectUrl);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  const displayUrl = localPreview ?? value;

  return (
    <div className="flex flex-col gap-2">
      {displayUrl ? (
        <div
          className={cn(
            "flex items-center justify-center rounded-lg border border-border bg-muted/30 p-3",
            previewClassName,
          )}
        >
          <img
            alt={label}
            className="max-h-full max-w-full object-contain"
            src={displayUrl}
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
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          type="button"
          variant="outline"
        >
          {isUploading ? "Uploading..." : value ? "Replace" : "Upload"}
        </Button>

        {value && !isUploading && (
          <Button
            className="h-8 rounded-lg text-xs"
            onClick={() => onChange("")}
            type="button"
            variant="ghost"
          >
            Remove
          </Button>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <input
        ref={inputRef}
        accept={ACCEPT}
        className="hidden"
        onChange={handleFileChange}
        type="file"
      />
    </div>
  );
}
