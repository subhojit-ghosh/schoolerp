import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  EntityFormPrimaryAction,
  EntityFormSecondaryAction,
} from "@/components/entities/entity-actions";
import {
  ANNOUNCEMENT_AUDIENCE_OPTIONS,
  announcementFormSchema,
  type AnnouncementFormValues,
} from "@/features/communications/model/announcement-form-schema";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/ui/field";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import { Input } from "@repo/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";

type AnnouncementFormProps = {
  campusName?: string;
  defaultValues: AnnouncementFormValues;
  errorMessage?: string;
  isPending?: boolean;
  onCancel?: () => void;
  onSubmit: (values: AnnouncementFormValues) => Promise<void> | void;
  submitLabel: string;
};

export function AnnouncementForm({
  campusName,
  defaultValues,
  errorMessage,
  isPending = false,
  onCancel,
  onSubmit,
  submitLabel,
}: AnnouncementFormProps) {
  const { control, handleSubmit, reset } = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup className="gap-6">
        <div className="grid gap-4">
          {campusName ? (
            <Field>
              <FieldLabel>Campus</FieldLabel>
              <FieldContent>
                <div className="flex h-10 items-center">
                  <Badge
                    className="rounded-md px-3 py-1 font-medium"
                    variant="secondary"
                  >
                    {campusName}
                  </Badge>
                </div>
              </FieldContent>
            </Field>
          ) : null}

          <Controller
            control={control}
            name="title"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="announcement-title" required>Title</FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="announcement-title"
                    placeholder="Announcement title"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />

          <Controller
            control={control}
            name="summary"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="announcement-summary">Summary</FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="announcement-summary"
                    placeholder="Optional short summary"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />

          <Controller
            control={control}
            name="audience"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel required>Audience</FieldLabel>
                <FieldContent>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Select audience" />
                    </SelectTrigger>
                    <SelectContent>
                      {ANNOUNCEMENT_AUDIENCE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />

          <Controller
            control={control}
            name="body"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="announcement-body" required>Message</FieldLabel>
                <FieldContent>
                  <textarea
                    {...field}
                    aria-invalid={fieldState.invalid}
                    className="min-h-32 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    id="announcement-body"
                    placeholder="Write the announcement that staff, guardians, or students will read."
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />

          <Controller
            control={control}
            name="publishNow"
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="announcement-publish-now">
                  Publish now
                </FieldLabel>
                <FieldContent>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={field.value}
                      id="announcement-publish-now"
                      onCheckedChange={(checked) =>
                        field.onChange(Boolean(checked))
                      }
                    />
                    <span className="text-sm text-muted-foreground">
                      Turn this on to publish immediately and create a
                      notification feed item.
                    </span>
                  </div>
                </FieldContent>
              </Field>
            )}
          />
        </div>

        {errorMessage ? (
          <p className="text-sm text-destructive">{errorMessage}</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <EntityFormPrimaryAction disabled={isPending} type="submit">
            {isPending ? "Saving..." : submitLabel}
          </EntityFormPrimaryAction>
          {onCancel ? (
            <EntityFormSecondaryAction
              disabled={isPending}
              onClick={onCancel}
              type="button"
            >
              Cancel
            </EntityFormSecondaryAction>
          ) : null}
        </div>
      </FieldGroup>
    </form>
  );
}
