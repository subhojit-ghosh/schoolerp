import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  useAuthErrorMessage,
  useResetPasswordMutation,
} from "@/features/auth/api/use-auth";
import {
  resetPasswordFormSchema,
  type ResetPasswordFormValues,
} from "@/features/auth/model/auth-form-schema";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const resetPasswordMutation = useResetPasswordMutation();
  const errorMessage = useAuthErrorMessage(
    resetPasswordMutation.error,
    "Unable to reset the password right now.",
  );
  const initialToken = searchParams.get("token") ?? "";
  const {
    control,
    handleSubmit,
    setValue,
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      token: initialToken,
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    setValue("token", initialToken);
  }, [initialToken, setValue]);

  async function onSubmit(values: ResetPasswordFormValues) {
    await resetPasswordMutation.mutateAsync({
      body: {
        token: values.token,
        password: values.password,
      },
    });

    void navigate("/sign-in");
  }

  return (
    <Card className="max-w-2xl">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Reset Password
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">
          Set a new password.
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Use the recovery token from the backend delivery channel or local dev
          preview to complete the reset.
        </p>
      </div>

      <form className="mt-6 grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <Controller
          control={control}
          name="token"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Reset token</FieldLabel>
              <Input {...field} placeholder="Paste reset token" />
              <FieldError>{fieldState.error?.message}</FieldError>
            </Field>
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>New password</FieldLabel>
              <Input {...field} placeholder="Enter a new password" type="password" />
              <FieldError>{fieldState.error?.message}</FieldError>
            </Field>
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Confirm password</FieldLabel>
              <Input {...field} placeholder="Confirm the new password" type="password" />
              <FieldError>{fieldState.error?.message}</FieldError>
            </Field>
          )}
        />

        {resetPasswordMutation.error ? <FieldError>{errorMessage}</FieldError> : null}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button disabled={resetPasswordMutation.isPending} type="submit">
            {resetPasswordMutation.isPending ? "Resetting..." : "Reset password"}
          </Button>
          <Button asChild type="button" variant="ghost">
            <Link to="/forgot-password">Back to recovery</Link>
          </Button>
        </div>
      </form>
    </Card>
  );
}
