import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@academic-platform/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@academic-platform/ui/components/ui/card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@academic-platform/ui/components/ui/field";
import { Input } from "@academic-platform/ui/components/ui/input";
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
  const { control, handleSubmit, setValue } = useForm<ResetPasswordFormValues>({
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
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>
          Complete recovery with the reset token from the backend delivery
          channel or local preview.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              control={control}
              name="token"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="reset-token">Reset token</FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      id="reset-token"
                      placeholder="Paste reset token"
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </FieldContent>
                </Field>
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="reset-password">New password</FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      id="reset-password"
                      placeholder="Enter a new password"
                      type="password"
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </FieldContent>
                </Field>
              )}
            />
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="confirm-password">
                    Confirm password
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      id="confirm-password"
                      placeholder="Confirm the new password"
                      type="password"
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </FieldContent>
                </Field>
              )}
            />
            {resetPasswordMutation.error ? (
              <FieldError>{errorMessage}</FieldError>
            ) : null}
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex flex-wrap justify-between gap-2">
        <Button
          disabled={resetPasswordMutation.isPending}
          onClick={handleSubmit(onSubmit)}
          type="button"
        >
          {resetPasswordMutation.isPending ? "Resetting..." : "Reset password"}
        </Button>
        <Button asChild variant="ghost">
          <Link to="/forgot-password">Back to recovery</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
