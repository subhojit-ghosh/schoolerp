"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { ROUTES } from "@/constants";

const schema = z.object({
  code: z
    .string()
    .length(6, "Code must be exactly 6 digits")
    .regex(/^\d+$/, "Code must be digits only"),
});

type FormValues = z.infer<typeof schema>;

export default function TwoFactorPage() {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: "" },
  });

  async function onSubmit(values: FormValues) {
    const { error } = await authClient.twoFactor.verifyTotp({
      code: values.code,
    });

    if (error) {
      setError("root", { message: "Invalid code. Try again." });
      return;
    }

    router.push(ROUTES.DASHBOARD);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Two-factor authentication</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Controller
          control={control}
          name="code"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Authentication code</FieldLabel>
              <Input
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                {...field}
              />
              <FieldError>{fieldState.error?.message}</FieldError>
            </Field>
          )}
        />

        {errors.root && (
          <p className="text-destructive text-sm">{errors.root.message}</p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Verifying…" : "Verify"}
        </Button>
      </form>
    </div>
  );
}
