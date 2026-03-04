"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function SignUpPage() {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    const { error } = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
    });

    if (error) {
      setError("root", { message: error.message ?? "Sign up failed" });
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Enter your details to get started
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Full name</FieldLabel>
              <Input placeholder="Jane Smith" {...field} />
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
              <Input type="email" placeholder="you@school.edu" {...field} />
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
              <Input type="password" placeholder="••••••••" {...field} />
              <FieldError>{fieldState.error?.message}</FieldError>
            </Field>
          )}
        />

        {errors.root && (
          <p className="text-destructive text-sm">{errors.root.message}</p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{" "}
        <a href="/auth/sign-in" className="text-foreground underline underline-offset-4">
          Sign in
        </a>
      </p>
    </div>
  );
}
