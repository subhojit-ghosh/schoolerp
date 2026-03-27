import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  IconCheck,
  IconCreditCard,
  IconLoader2,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";
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
import {
  usePaymentConfigQuery,
  useUpsertPaymentConfigMutation,
  useDeactivatePaymentConfigMutation,
} from "@/features/settings/api/use-payment-settings";

const PAYMENT_PROVIDERS = [
  { value: "razorpay", label: "Razorpay" },
  { value: "cashfree", label: "Cashfree" },
  { value: "payu", label: "PayU" },
  { value: "custom", label: "Custom / In-house" },
] as const;

const CREDENTIAL_FIELDS: Record<
  string,
  { key: string; label: string; type?: string }[]
> = {
  razorpay: [
    { key: "keyId", label: "Key ID" },
    { key: "keySecret", label: "Key Secret", type: "password" },
  ],
  cashfree: [
    { key: "appId", label: "App ID" },
    { key: "secretKey", label: "Secret Key", type: "password" },
    { key: "environment", label: "Environment (sandbox / production)" },
  ],
  payu: [
    { key: "merchantKey", label: "Merchant Key" },
    { key: "merchantSalt", label: "Merchant Salt", type: "password" },
    { key: "environment", label: "Environment (sandbox / production)" },
  ],
  custom: [
    { key: "webhookSecret", label: "Webhook Secret", type: "password" },
  ],
};

const configFormSchema = z.object({
  provider: z.string().min(1),
  credentials: z.record(z.string(), z.string().min(1)),
  displayLabel: z.string().optional(),
});

type ConfigFormValues = z.infer<typeof configFormSchema>;

function PaymentConfigCard() {
  const [showCreds, setShowCreds] = useState(false);
  const { data: config, isLoading } = usePaymentConfigQuery();
  const upsertMutation = useUpsertPaymentConfigMutation();
  const deactivateMutation = useDeactivatePaymentConfigMutation();

  const { control, handleSubmit, watch, reset } = useForm<ConfigFormValues>({
    resolver: zodResolver(configFormSchema),
    defaultValues: {
      provider: config?.provider ?? "razorpay",
      credentials: {},
      displayLabel: config?.displayLabel ?? "",
    },
  });

  const selectedProvider = watch("provider");
  const currentFields = CREDENTIAL_FIELDS[selectedProvider] ?? [];

  function onSubmit(values: ConfigFormValues) {
    upsertMutation.mutate(
      {
        provider: values.provider,
        credentials: values.credentials,
        displayLabel: values.displayLabel || null,
      },
      {
        onSuccess: () => {
          toast.success("Payment gateway saved");
          setShowCreds(false);
          reset({ ...values, credentials: {} });
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
        toast.success("Payment gateway deactivated");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  }

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex items-center justify-center py-12">
        <IconLoader2 className="mr-2 size-5 animate-spin" />
        Loading payment configuration...
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <IconCreditCard className="text-muted-foreground size-5" />
            <div>
              <CardTitle>Online Payment Gateway</CardTitle>
              <CardDescription>
                Configure how parents pay school fees online. Credentials are
                stored encrypted and never exposed in the frontend.
              </CardDescription>
            </div>
          </div>
          {config?.isActive ? (
            <Badge variant="default">
              Active — {PAYMENT_PROVIDERS.find((p) => p.value === config.provider)?.label ?? config.provider}
            </Badge>
          ) : (
            <Badge variant="secondary">Not configured</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {config?.isActive && !showCreds ? (
          <div className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
              Provider:{" "}
              <span className="text-foreground font-medium">
                {PAYMENT_PROVIDERS.find((p) => p.value === config.provider)
                  ?.label ?? config.provider}
              </span>
            </p>
            {config.displayLabel ? (
              <p className="text-muted-foreground text-sm">
                Display label:{" "}
                <span className="text-foreground font-medium">
                  {config.displayLabel}
                </span>
              </p>
            ) : null}
            <div className="flex gap-3">
              <Button
                className="h-10 rounded-lg"
                onClick={() => setShowCreds(true)}
                variant="outline"
              >
                Update credentials
              </Button>
              <Button
                className="h-10 rounded-lg"
                disabled={deactivateMutation.isPending}
                onClick={onDeactivate}
                variant="outline"
              >
                {deactivateMutation.isPending ? (
                  <IconLoader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <IconX className="mr-2 size-4" />
                )}
                Deactivate
              </Button>
            </div>
          </div>
        ) : (
          <form
            className="flex flex-col gap-5"
            onSubmit={handleSubmit(onSubmit)}
          >
            <Controller
              control={control}
              name="provider"
              render={({ field }) => (
                <Field>
                  <FieldLabel required>Payment Provider</FieldLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_PROVIDERS.map((p) => (
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
                      autoComplete="off"
                      type={credField.type ?? "text"}
                      value={(field.value as string) ?? ""}
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </Field>
                )}
              />
            ))}

            <Controller
              control={control}
              name="displayLabel"
              render={({ field }) => (
                <Field>
                  <FieldLabel>Display Label</FieldLabel>
                  <Input
                    {...field}
                    autoComplete="off"
                    placeholder="e.g. Pay via Razorpay"
                    value={field.value ?? ""}
                  />
                </Field>
              )}
            />

            <div className="flex items-center gap-3">
              <Button
                className="h-10 rounded-lg"
                disabled={upsertMutation.isPending}
                type="submit"
              >
                {upsertMutation.isPending ? (
                  <IconLoader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <IconCheck className="mr-2 size-4" />
                )}
                Save payment config
              </Button>
              {config?.isActive ? (
                <Button
                  className="h-10 rounded-lg"
                  onClick={() => setShowCreds(false)}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export function PaymentSettingsPage() {
  return (
    <EntityPageShell>
      <EntityPageHeader
        description="Configure a payment gateway so parents can pay school fees online. Supports Razorpay, Cashfree, PayU, and custom integrations."
        title="Payment Settings"
      />
      <div className="flex flex-col gap-6 p-6 pt-0">
        <PaymentConfigCard />
      </div>
    </EntityPageShell>
  );
}
