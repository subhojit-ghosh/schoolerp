import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { IconPlus } from "@tabler/icons-react";
import { z } from "zod";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/ui/field";
import { Input } from "@repo/ui/components/ui/input";
import {
  EntityPageHeader,
  EntityPageShell,
} from "@/components/entities/entity-page-shell";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { DOCUMENTS_API_PATHS } from "@/features/auth/api/auth.constants";
import { apiQueryClient } from "@/lib/api/client";
import { extractApiError } from "@/lib/api-error";

// ── Hooks ───────────────────────────────────────────────────────────────────

function useSignatoriesQuery(enabled: boolean) {
  return apiQueryClient.useQuery(
    "get",
    DOCUMENTS_API_PATHS.LIST_SIGNATORIES,
    undefined,
    { enabled },
  );
}

function useCreateSignatoryMutation() {
  return apiQueryClient.useMutation("post", DOCUMENTS_API_PATHS.CREATE_SIGNATORY);
}

function useUpdateSignatoryMutation() {
  return apiQueryClient.useMutation(
    "patch",
    DOCUMENTS_API_PATHS.UPDATE_SIGNATORY,
  );
}

function useDocumentConfigQuery(enabled: boolean) {
  return apiQueryClient.useQuery(
    "get",
    DOCUMENTS_API_PATHS.GET_CONFIG,
    undefined,
    { enabled },
  );
}

function useUpdateDocumentConfigMutation() {
  return apiQueryClient.useMutation(
    "patch",
    DOCUMENTS_API_PATHS.UPDATE_CONFIG,
  );
}

// ── Schemas ─────────────────────────────────────────────────────────────────

const signatoryFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  designation: z.string().trim().min(1, "Designation is required"),
  sortOrder: z.number().int().min(0),
});

type SignatoryFormValues = z.infer<typeof signatoryFormSchema>;

// ── Page ────────────────────────────────────────────────────────────────────

export function DocumentsSettingsPage() {
  useDocumentTitle("Document Settings");
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;

  const signatoriesQuery = useSignatoriesQuery(Boolean(institutionId));
  const configQuery = useDocumentConfigQuery(Boolean(institutionId));
  const createSignatory = useCreateSignatoryMutation();
  const updateSignatory = useUpdateSignatoryMutation();
  const updateConfig = useUpdateDocumentConfigMutation();

  const [isAddingSignatory, setIsAddingSignatory] = useState(false);

  // Signatory form
  const signatoryForm = useForm<SignatoryFormValues>({
    resolver: zodResolver(signatoryFormSchema),
    mode: "onTouched",
    defaultValues: { name: "", designation: "", sortOrder: 0 },
  });

  async function handleCreateSignatory(values: SignatoryFormValues) {
    try {
      await createSignatory.mutateAsync({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body: values as any,
      });
      signatoryForm.reset();
      setIsAddingSignatory(false);
      void signatoriesQuery.refetch();
      toast.success("Signatory added.");
    } catch (error) {
      toast.error(extractApiError(error, "Could not add signatory."));
    }
  }

  async function handleToggleSignatory(signatoryId: string, isActive: boolean) {
    try {
      await updateSignatory.mutateAsync({
        params: { path: { signatoryId } },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body: { isActive: !isActive } as any,
      });
      void signatoriesQuery.refetch();
    } catch (error) {
      toast.error(extractApiError(error, "Could not update signatory."));
    }
  }

  // Receipt config
  async function handleUpdateReceiptConfig(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await updateConfig.mutateAsync({
        body: {
          receiptPrefix: formData.get("receiptPrefix") as string,
          receiptNextNumber: Number(formData.get("receiptNextNumber")),
          receiptPadLength: Number(formData.get("receiptPadLength")),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      });
      void configQuery.refetch();
      toast.success("Receipt numbering updated.");
    } catch (error) {
      toast.error(extractApiError(error, "Could not update receipt config."));
    }
  }

  // Report card toggles
  async function handleToggleReportCard(key: string, value: boolean) {
    const currentConfig =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (configQuery.data as any)?.reportCardConfig ?? {};
    try {
      await updateConfig.mutateAsync({
        body: {
          reportCardConfig: { ...currentConfig, [key]: value },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      });
      void configQuery.refetch();
    } catch (error) {
      toast.error(extractApiError(error, "Could not update config."));
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config = configQuery.data as any;
  const reportCardConfig = config?.reportCardConfig ?? {
    showRank: true,
    showRemarks: true,
    showAttendanceSummary: false,
    showGradingScale: true,
    showResult: true,
  };

  return (
    <EntityPageShell width="full">
      <EntityPageHeader
        title="Document Settings"
        description="Configure signatories, receipt numbering, and report card options."
      />

      {/* Signatories */}
      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="border-b px-6 py-4">
          <h2 className="text-base font-semibold">Signatories</h2>
          <p className="text-sm text-muted-foreground">
            Define authorized signatories used across certificates and documents.
          </p>
        </div>
        <div className="p-6 space-y-4">
          {(signatoriesQuery.data ?? []).map((sig) => (
            <div
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              key={(sig as any).id}
              className="flex items-center justify-between gap-4 rounded-lg border p-4"
            >
              <div>
                <p className="font-medium">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(sig as any).name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(sig as any).designation}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(sig as any).isActive ? (
                  <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handleToggleSignatory(
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (sig as any).id,
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (sig as any).isActive,
                    )
                  }
                >
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(sig as any).isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </div>
          ))}

          {isAddingSignatory ? (
            <form onSubmit={signatoryForm.handleSubmit(handleCreateSignatory)}>
              <FieldGroup className="gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Controller
                    control={signatoryForm.control}
                    name="name"
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel required>Name</FieldLabel>
                        <Input {...field} aria-invalid={fieldState.invalid} />
                        <FieldError>{fieldState.error?.message}</FieldError>
                      </Field>
                    )}
                  />
                  <Controller
                    control={signatoryForm.control}
                    name="designation"
                    render={({ field, fieldState }) => (
                      <Field>
                        <FieldLabel required>Designation</FieldLabel>
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          placeholder="e.g. Principal"
                        />
                        <FieldError>{fieldState.error?.message}</FieldError>
                      </Field>
                    )}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={createSignatory.isPending}>
                    {createSignatory.isPending ? "Adding..." : "Add signatory"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAddingSignatory(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </FieldGroup>
            </form>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAddingSignatory(true)}
            >
              <IconPlus className="size-4 mr-1" />
              Add signatory
            </Button>
          )}
        </div>
      </section>

      {/* Receipt numbering */}
      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="border-b px-6 py-4">
          <h2 className="text-base font-semibold">Receipt Numbering</h2>
          <p className="text-sm text-muted-foreground">
            Configure the format for auto-generated fee receipt numbers.
          </p>
        </div>
        <div className="p-6">
          <form onSubmit={handleUpdateReceiptConfig}>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field>
                <FieldLabel required>Prefix</FieldLabel>
                <Input
                  name="receiptPrefix"
                  defaultValue={config?.receiptPrefix ?? "RCT"}
                />
              </Field>
              <Field>
                <FieldLabel required>Next number</FieldLabel>
                <Input
                  name="receiptNextNumber"
                  type="number"
                  defaultValue={config?.receiptNextNumber ?? 1}
                  min={1}
                />
              </Field>
              <Field>
                <FieldLabel required>Pad length</FieldLabel>
                <Input
                  name="receiptPadLength"
                  type="number"
                  defaultValue={config?.receiptPadLength ?? 6}
                  min={1}
                  max={10}
                />
              </Field>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Preview: {config?.receiptPrefix ?? "RCT"}-
              {String(config?.receiptNextNumber ?? 1).padStart(
                config?.receiptPadLength ?? 6,
                "0",
              )}
            </p>
            <Button type="submit" size="sm" className="mt-4" disabled={updateConfig.isPending}>
              {updateConfig.isPending ? "Saving..." : "Save changes"}
            </Button>
          </form>
        </div>
      </section>

      {/* Report card toggles */}
      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="border-b px-6 py-4">
          <h2 className="text-base font-semibold">Report Card</h2>
          <p className="text-sm text-muted-foreground">
            Control which sections appear on printed report cards.
          </p>
        </div>
        <div className="p-6 space-y-4">
          {[
            { key: "showRank", label: "Show rank" },
            { key: "showRemarks", label: "Show remarks" },
            { key: "showAttendanceSummary", label: "Show attendance summary" },
            { key: "showGradingScale", label: "Show grading scale" },
            { key: "showResult", label: "Show pass/fail result" },
          ].map((toggle) => (
            <div
              key={toggle.key}
              className="flex items-center justify-between rounded-lg border px-4 py-3"
            >
              <span className="text-sm font-medium">{toggle.label}</span>
              <Button
                size="sm"
                variant={reportCardConfig[toggle.key] ? "default" : "outline"}
                onClick={() =>
                  handleToggleReportCard(
                    toggle.key,
                    !reportCardConfig[toggle.key],
                  )
                }
              >
                {reportCardConfig[toggle.key] ? "On" : "Off"}
              </Button>
            </div>
          ))}
        </div>
      </section>
    </EntityPageShell>
  );
}
