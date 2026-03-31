import { useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  IconCheck,
  IconClock,
  IconEye,
  IconLoader2,
  IconShieldLock,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Field, FieldError, FieldLabel } from "@repo/ui/components/ui/field";
import { Input } from "@repo/ui/components/ui/input";
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import { Button } from "@repo/ui/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import {
  EntityPageHeader,
  EntityPageShell,
} from "@/components/entities/entity-page-shell";
import { useDocumentTitle } from "@/hooks/use-document-title";
import {
  useSessionConfigQuery,
  useUpdateSessionConfigMutation,
  useAccessLogsQuery,
} from "@/features/dpdpa/api/use-dpdpa";
import { formatDateTime } from "@/lib/format";

const MIN_SESSION_TIMEOUT = 5;
const MAX_SESSION_TIMEOUT = 1440;
const MIN_MAX_SESSIONS = 1;
const MAX_MAX_SESSIONS = 10;

const sessionConfigSchema = z.object({
  maxConcurrentSessions: z
    .number()
    .int()
    .min(MIN_MAX_SESSIONS)
    .max(MAX_MAX_SESSIONS),
  sessionTimeoutMinutes: z
    .number()
    .int()
    .min(MIN_SESSION_TIMEOUT)
    .max(MAX_SESSION_TIMEOUT),
  requireReauthForSensitiveOps: z.boolean(),
});

type SessionConfigValues = z.infer<typeof sessionConfigSchema>;

function SessionConfigCard() {
  const { data, isLoading } = useSessionConfigQuery(true);
  const updateMutation = useUpdateSessionConfigMutation();

  const { control, handleSubmit, reset, formState } =
    useForm<SessionConfigValues>({
      resolver: zodResolver(sessionConfigSchema) as never,
      mode: "onTouched",
      values: data
        ? {
            maxConcurrentSessions: data.maxConcurrentSessions ?? 3,
            sessionTimeoutMinutes: data.sessionTimeoutMinutes ?? 60,
            requireReauthForSensitiveOps:
              data.requireReauthForSensitiveOps ?? false,
          }
        : undefined,
    });

  const onSubmit = useCallback(
    (values: SessionConfigValues) => {
      updateMutation.mutate(
        { body: values },
        {
          onSuccess: () => {
            toast.success("Session configuration updated");
            reset(values);
          },
          onError: (error: unknown) => {
            toast.error(
              error instanceof Error
                ? error.message
                : "Failed to update session configuration",
            );
          },
        },
      );
    },
    [updateMutation, reset],
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <IconLoader2 className="mr-2 size-5 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">
            Loading session configuration...
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <IconShieldLock className="size-5 text-muted-foreground" />
          <div>
            <CardTitle>Session Controls</CardTitle>
            <CardDescription>
              Configure session limits and re-authentication requirements for
              DPDPA compliance
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-5"
          onSubmit={handleSubmit(onSubmit)}
        >
          <Controller
            control={control}
            name="maxConcurrentSessions"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel required>
                  Max concurrent sessions per user
                </FieldLabel>
                <Input
                  {...field}
                  type="number"
                  min={MIN_MAX_SESSIONS}
                  max={MAX_MAX_SESSIONS}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

          <Controller
            control={control}
            name="sessionTimeoutMinutes"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel required>
                  Session timeout (minutes)
                </FieldLabel>
                <Input
                  {...field}
                  type="number"
                  min={MIN_SESSION_TIMEOUT}
                  max={MAX_SESSION_TIMEOUT}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            )}
          />

          <Controller
            control={control}
            name="requireReauthForSensitiveOps"
            render={({ field }) => (
              <Field>
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                    className="mt-0.5"
                  />
                  <div>
                    <FieldLabel>
                      Require re-authentication for sensitive data
                    </FieldLabel>
                    <p className="text-xs text-muted-foreground">
                      When enabled, users must re-enter their password before
                      viewing Aadhaar, PAN, and other DPDPA-classified fields
                    </p>
                  </div>
                </div>
              </Field>
            )}
          />

          <div>
            <Button
              className="h-10 rounded-lg"
              disabled={
                updateMutation.isPending || !formState.isDirty
              }
              type="submit"
            >
              {updateMutation.isPending ? (
                <IconLoader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <IconCheck className="mr-2 size-4" />
              )}
              Save changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function AccessLogsCard() {
  const { data, isLoading } = useAccessLogsQuery(true);
  const logs = (data as unknown as { rows?: Array<Record<string, unknown>> })
    ?.rows ?? (Array.isArray(data) ? data : []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <IconEye className="size-5 text-muted-foreground" />
          <div>
            <CardTitle>Sensitive Data Access Log</CardTitle>
            <CardDescription>
              Recent access to DPDPA-classified personal data fields
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <IconLoader2 className="mr-2 size-5 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground">Loading access logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <IconClock className="mb-2 size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No sensitive data access recorded yet
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(
                  logs as Array<{
                    id?: string;
                    userName?: string;
                    resourceType?: string;
                    fieldAccessed?: string;
                    action?: string;
                    createdAt?: string;
                  }>
                ).map((log, index) => (
                  <TableRow key={log.id ?? index}>
                    <TableCell className="font-medium">
                      {log.userName ?? "Unknown"}
                    </TableCell>
                    <TableCell>{log.resourceType ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {log.fieldAccessed ?? "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.action ?? "view"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.createdAt ? formatDateTime(log.createdAt) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DpdpaSettingsPage() {
  useDocumentTitle("DPDPA Compliance");

  return (
    <EntityPageShell>
      <EntityPageHeader
        description="Manage Digital Personal Data Protection Act compliance settings including session controls, consent tracking, and sensitive data access auditing."
        title="DPDPA Compliance"
      />
      <div className="flex flex-col gap-6 p-6 pt-0">
        <SessionConfigCard />
        <AccessLogsCard />
      </div>
    </EntityPageShell>
  );
}
