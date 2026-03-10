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
    formState: { errors, isSubmitting },
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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel className="text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
              Email
            </FieldLabel>
            <Input
              type="email"
              placeholder="super@admin.com"
              className="h-12 rounded-2xl border-border/60 bg-background/80 px-4 shadow-none"
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
            <FieldLabel className="text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
              Password
            </FieldLabel>
            <Input
              type="password"
              placeholder="Enter your password"
              className="h-12 rounded-2xl border-border/60 bg-background/80 px-4 shadow-none"
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
        className="h-12 rounded-2xl text-sm font-medium tracking-[0.04em]"
      >
        {isSubmitting ? "Signing in..." : "Sign in to platform"}
      </Button>
    </form>
  );
}
