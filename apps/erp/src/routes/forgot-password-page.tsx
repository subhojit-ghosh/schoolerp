import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  useAuthErrorMessage,
  useForgotPasswordMutation,
} from "@/features/auth/api/use-auth";
import {
  forgotPasswordFormSchema,
  type ForgotPasswordFormValues,
} from "@/features/auth/model/auth-form-schema";

export function ForgotPasswordPage() {
  const forgotPasswordMutation = useForgotPasswordMutation();
  const errorMessage = useAuthErrorMessage(
    forgotPasswordMutation.error,
    "Unable to start password recovery right now.",
  );
  const { control, handleSubmit, reset } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: {
      identifier: "",
    },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    await forgotPasswordMutation.mutateAsync({
      body: values,
    });
    reset();
  }

  const tokenPreview = forgotPasswordMutation.data?.resetTokenPreview;

  return (
    <Card className="max-w-2xl">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Password Recovery
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">
          Request a password reset link.
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Enter the mobile number or email tied to the account. The backend
          handles recovery without exposing whether the account exists.
        </p>
      </div>

      <form className="mt-6 grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <Controller
          control={control}
          name="identifier"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Mobile number or email</FieldLabel>
              <Input {...field} placeholder="+91 98765 43210" />
              <FieldError>{fieldState.error?.message}</FieldError>
            </Field>
          )}
        />

        {forgotPasswordMutation.error ? (
          <FieldError>{errorMessage}</FieldError>
        ) : null}

        {forgotPasswordMutation.isSuccess ? (
          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <p className="text-sm font-medium">
              If the account exists, a password reset can now be completed.
            </p>
            {tokenPreview ? (
              <div className="mt-3 space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Dev Preview Token
                </p>
                <code className="block overflow-x-auto rounded-lg bg-background px-3 py-2 text-xs">
                  {tokenPreview}
                </code>
                <Button asChild variant="outline">
                  <Link
                    to={`/reset-password?token=${encodeURIComponent(tokenPreview)}`}
                  >
                    Continue with preview token
                  </Link>
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button disabled={forgotPasswordMutation.isPending} type="submit">
            {forgotPasswordMutation.isPending
              ? "Requesting..."
              : "Request reset"}
          </Button>
          <Button asChild type="button" variant="ghost">
            <Link to="/sign-in">Back to sign in</Link>
          </Button>
        </div>
      </form>
    </Card>
  );
}
