"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { platformAuthClient } from "@/lib/auth-client";
import { V } from "@/constants";

const schema = z.object({
  email: V.email,
  password: V.password,
});

type FormValues = z.infer<typeof schema>;

export function PlatformSignInForm() {
  const router = useRouter();
  const [rootError, setRootError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setRootError(null);
    try {
      const { error } = await platformAuthClient.signIn.email({
        email: values.email,
        password: values.password,
      });

      if (error) {
        setRootError(error.message ?? "Invalid email or password");
        return;
      }

      router.push("/");
    } catch {
      setRootError("Invalid email or password");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel className="font-cap text-xs font-medium uppercase tracking-[0.15em] text-secondary-foreground">
              Email
            </FieldLabel>
            <Input
              type="email"
              placeholder="super@admin.com"
              className="h-14 rounded-2xl border-transparent bg-input px-5 shadow-none placeholder:text-muted-foreground"
              {...field}
            />
            <FieldError>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel className="font-cap text-xs font-medium uppercase tracking-[0.15em] text-secondary-foreground">
              Password
            </FieldLabel>
            <Input
              type="password"
              placeholder="Enter your password"
              className="h-14 rounded-2xl border-transparent bg-input px-5 shadow-none placeholder:text-muted-foreground"
              {...field}
            />
            <FieldError>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />

      {rootError ? (
        <div className="rounded-2xl border border-[#e4cfba] bg-[#f7efe4] px-4 py-3">
          <FieldError>{rootError}</FieldError>
        </div>
      ) : null}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-16 rounded-2xl font-cap text-lg font-medium uppercase tracking-[0.05em]"
      >
        {isSubmitting ? "Signing in..." : "Sign in to platform"}
      </Button>

      {/* Two-factor footer */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-sm font-medium text-secondary-foreground">
          2F
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-medium text-secondary-foreground">
            Two-factor checkpoint
          </p>
          <p className="text-sm text-muted-foreground">
            Role-gated and session-audited
          </p>
        </div>
        <div className="flex h-[50px] shrink-0 items-center rounded-2xl bg-input px-4 font-cap text-xs font-medium uppercase tracking-[0.15em] text-secondary-foreground">
          Trusted device
        </div>
      </div>
    </form>
  );
}
