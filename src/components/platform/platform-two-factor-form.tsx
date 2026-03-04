"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { platformAuthClient } from "@/lib/auth-client";

const schema = z.object({
  code: z
    .string()
    .length(6, "Code must be exactly 6 digits")
    .regex(/^\d+$/, "Code must be digits only"),
});

type FormValues = z.infer<typeof schema>;

export function PlatformTwoFactorForm() {
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
    const { error } = await platformAuthClient.twoFactor.verifyTotp({
      code: values.code,
    });

    if (error) {
      setError("root", { message: "Invalid code. Try again." });
      return;
    }

    router.push("/");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Controller
        control={control}
        name="code"
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel>Authentication code</FieldLabel>
            <Input inputMode="numeric" maxLength={6} placeholder="000000" {...field} />
            <FieldError>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />

      {errors.root ? <FieldError>{errors.root.message}</FieldError> : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Verifying..." : "Verify and continue"}
      </Button>
    </form>
  );
}
