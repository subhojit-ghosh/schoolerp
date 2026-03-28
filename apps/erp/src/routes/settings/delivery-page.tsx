import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  IconCheck,
  IconLoader2,
  IconMail,
  IconMessageCircle,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { UnsavedChangesDialog } from "@/components/feedback/unsaved-changes-dialog";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Field, FieldError, FieldLabel } from "@repo/ui/components/ui/field";
import { Input } from "@repo/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  EntityPageHeader,
  EntityPageShell,
} from "@/components/entities/entity-page-shell";
import { useDocumentTitle } from "@/hooks/use-document-title";
import {
  useDeliveryConfigsQuery,
  useUpsertDeliveryConfigMutation,
  useDeactivateDeliveryConfigMutation,
  useTestDeliveryMutation,
  type DeliveryConfig,
} from "@/features/settings/api/use-delivery-settings";

const SMS_PROVIDERS = [
  { value: "msg91", label: "MSG91" },
  { value: "twilio", label: "Twilio" },
] as const;

const EMAIL_PROVIDERS = [
  { value: "resend", label: "Resend" },
  { value: "sendgrid", label: "SendGrid" },
] as const;

const SMS_CREDENTIAL_FIELDS: Record<
  string,
  { key: string; label: string; type?: string }[]
> = {
  msg91: [
    { key: "authKey", label: "Auth Key" },
    { key: "senderId", label: "Sender ID" },
    { key: "templateId", label: "Template ID" },
  ],
  twilio: [
    { key: "accountSid", label: "Account SID" },
    { key: "authToken", label: "Auth Token", type: "password" },
    { key: "fromNumber", label: "From Number" },
  ],
};

const EMAIL_CREDENTIAL_FIELDS: Record<
  string,
  { key: string; label: string; type?: string }[]
> = {
  resend: [{ key: "apiKey", label: "API Key", type: "password" }],
  sendgrid: [{ key: "apiKey", label: "API Key", type: "password" }],
};

const configFormSchema = z.object({
  provider: z.string().min(1),
  credentials: z.record(z.string(), z.string().min(1)),
  senderIdentity: z.string().optional(),
});

type ConfigFormValues = z.infer<typeof configFormSchema>;

function ChannelConfigCard({
  channel,
  channelLabel,
  icon: ChannelIcon,
  providers,
  credentialFields,
  config,
}: {
  channel: "sms" | "email";
  channelLabel: string;
  icon: typeof IconMessageCircle;
  providers: ReadonlyArray<{ value: string; label: string }>;
  credentialFields: Record<string, { key: string; label: string; type?: string }[]>;
  config: DeliveryConfig | null;
}) {
  const [testRecipient, setTestRecipient] = useState("");
  const upsertMutation = useUpsertDeliveryConfigMutation(channel);
  const deactivateMutation = useDeactivateDeliveryConfigMutation(channel);
  const testMutation = useTestDeliveryMutation();

  const { control, handleSubmit, watch, reset, formState } =
    useForm<ConfigFormValues>({
      resolver: zodResolver(configFormSchema),
      mode: "onTouched",
      defaultValues: {
        provider: config?.provider ?? providers[0].value,
        credentials: {},
        senderIdentity: config?.senderIdentity ?? "",
      },
    });

  const blocker = useUnsavedChangesGuard(formState.isDirty);
  const selectedProvider = watch("provider");
  const currentFields = credentialFields[selectedProvider] ?? [];

  function onSubmit(values: ConfigFormValues) {
    upsertMutation.mutate(
      {
        provider: values.provider,
        credentials: values.credentials,
        senderIdentity: values.senderIdentity || undefined,
      },
      {
        onSuccess: () => {
          toast.success(`${channelLabel} provider saved`);
          reset(values);
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  }

  function onDeactivate() {
    deactivateMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success(`${channelLabel} provider deactivated`);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  }

  function onTest() {
    if (!testRecipient.trim()) {
      toast.error("Enter a test recipient");
      return;
    }

    testMutation.mutate(
      { channel, recipient: testRecipient.trim() },
      {
        onSuccess: (result) => {
          if (result.accepted) {
            toast.success(
              `Test ${channelLabel.toLowerCase()} sent via ${result.provider}`,
            );
          } else {
            toast.error(
              `Test ${channelLabel.toLowerCase()} was not accepted by ${result.provider}`,
            );
          }
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChannelIcon className="text-muted-foreground size-5" />
            <div>
              <CardTitle>{channelLabel} Provider</CardTitle>
              <CardDescription>
                Configure {channelLabel.toLowerCase()} delivery for this
                institution
              </CardDescription>
            </div>
          </div>
          {config?.isActive ? (
            <Badge variant="default">Active</Badge>
          ) : (
            <Badge variant="secondary">Not configured</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-5"
          onSubmit={handleSubmit(onSubmit)}
        >
          <Controller
            control={control}
            name="provider"
            render={({ field }) => (
              <Field>
                <FieldLabel required>Provider</FieldLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          {currentFields.map((credField) => (
            <Controller
              key={credField.key}
              control={control}
              name={`credentials.${credField.key}`}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel required>{credField.label}</FieldLabel>
                  <Input
                    {...field}
                    type={credField.type ?? "text"}
                    value={(field.value as string) ?? ""}
                    autoComplete="off"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />
          ))}

          <Controller
            control={control}
            name="senderIdentity"
            render={({ field }) => (
              <Field>
                <FieldLabel>
                  Sender Identity
                </FieldLabel>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  autoComplete="off"
                />
              </Field>
            )}
          />

          <div className="flex items-center gap-3">
            <Button
              disabled={upsertMutation.isPending}
              type="submit"
              className="h-10 rounded-lg"
            >
              {upsertMutation.isPending ? (
                <IconLoader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <IconCheck className="mr-2 size-4" />
              )}
              Save {channelLabel.toLowerCase()} config
            </Button>
            {config?.isActive ? (
              <Button
                disabled={deactivateMutation.isPending}
                onClick={onDeactivate}
                type="button"
                variant="outline"
                className="h-10 rounded-lg"
              >
                <IconX className="mr-2 size-4" />
                Deactivate
              </Button>
            ) : null}
          </div>
        </form>

        {config?.isActive ? (
          <div className="border-border mt-6 flex items-end gap-3 border-t pt-5">
            <Field className="flex-1">
              <FieldLabel>
                Test recipient ({channel === "sms" ? "mobile number" : "email"})
              </FieldLabel>
              <Input
                onChange={(e) => setTestRecipient(e.target.value)}
                value={testRecipient}
              />
            </Field>
            <Button
              className="h-10 shrink-0 rounded-lg"
              disabled={testMutation.isPending || !testRecipient.trim()}
              onClick={onTest}
              type="button"
              variant="secondary"
            >
              {testMutation.isPending ? (
                <IconLoader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Send test
            </Button>
          </div>
        ) : null}
      </CardContent>

      <UnsavedChangesDialog blocker={blocker} />
    </Card>
  );
}

export function DeliverySettingsPage() {
  useDocumentTitle("Delivery Settings");
  const { data, isLoading } = useDeliveryConfigsQuery();

  const smsConfig =
    data?.configs?.find((c) => c.channel === "sms") ?? null;
  const emailConfig =
    data?.configs?.find((c) => c.channel === "email") ?? null;

  return (
    <EntityPageShell>
      <EntityPageHeader
        description="Configure SMS and email providers so the institution can send password resets, notifications, and school communications."
        title="Delivery Settings"
      />
      <div className="flex flex-col gap-6 p-6 pt-0">
        {isLoading ? (
          <div className="text-muted-foreground flex items-center justify-center py-12">
            <IconLoader2 className="mr-2 size-5 animate-spin" />
            Loading delivery configuration...
          </div>
        ) : (
          <>
            <ChannelConfigCard
              channel="sms"
              channelLabel="SMS"
              config={smsConfig}
              credentialFields={SMS_CREDENTIAL_FIELDS}
              icon={IconMessageCircle}
              providers={SMS_PROVIDERS}
            />
            <ChannelConfigCard
              channel="email"
              channelLabel="Email"
              config={emailConfig}
              credentialFields={EMAIL_CREDENTIAL_FIELDS}
              icon={IconMail}
              providers={EMAIL_PROVIDERS}
            />
          </>
        )}
      </div>
    </EntityPageShell>
  );
}
