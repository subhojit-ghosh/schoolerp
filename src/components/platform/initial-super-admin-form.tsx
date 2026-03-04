"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  initialSuperAdminSchema,
  type InitialSuperAdminValues,
} from "@/lib/platform/setup";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function InitialSuperAdminForm() {
  const router = useRouter();
  const [isComplete, setIsComplete] = useState(false);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<InitialSuperAdminValues>({
    resolver: zodResolver(initialSuperAdminSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: InitialSuperAdminValues) {
    const response = await fetch("/api/setup/super-admin", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      setError("root", {
        message: payload?.error ?? "Failed to complete platform setup",
      });
      return;
    }

    setIsComplete(true);
    router.refresh();
  }

  if (isComplete) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold">Setup complete</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Your first platform super admin is ready. Sign in from an
            institution subdomain to continue.
          </p>
        </div>
        <Button type="button" onClick={() => router.push("/")}>
          Go to home
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Controller
        control={control}
        name="name"
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel>Full name</FieldLabel>
            <Input placeholder="Platform Owner" {...field} />
            <FieldError>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel>Email</FieldLabel>
            <Input type="email" placeholder="admin@example.com" {...field} />
            <FieldDescription>
              This account will become the permanent platform super admin.
            </FieldDescription>
            <FieldError>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel>Password</FieldLabel>
            <Input type="password" placeholder="Choose a strong password" {...field} />
            <FieldError>{fieldState.error?.message}</FieldError>
          </Field>
        )}
      />

      {errors.root ? (
        <FieldError>{errors.root.message}</FieldError>
      ) : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating account..." : "Complete setup"}
      </Button>
    </form>
  );
}
