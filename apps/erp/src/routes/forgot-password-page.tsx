import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/ui/field";
import { Input } from "@repo/ui/components/ui/input";
import {
  useAuthErrorMessage,
  useForgotPasswordMutation,
} from "@/features/auth/api/use-auth";
import {
  forgotPasswordFormSchema,
  type ForgotPasswordFormValues,
} from "@/features/auth/model/auth-form-schema";
import { ERP_ROUTES } from "@/constants/routes";

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
      <CardHeader>
        <CardTitle>Password recovery</CardTitle>
        <CardDescription>
          Request a reset with the mobile number or email linked to the account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              control={control}
              name="identifier"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="forgot-identifier">
                    Mobile number or email
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      id="forgot-identifier"
                      placeholder="+91 98765 43210"
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </FieldContent>
                </Field>
              )}
            />
            {forgotPasswordMutation.error ? (
              <FieldError>{errorMessage}</FieldError>
            ) : null}
          </FieldGroup>
        </form>
        {forgotPasswordMutation.isSuccess ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recovery requested</CardTitle>
              <CardDescription>
                If the account exists, recovery can continue through the backend
                delivery channel.
              </CardDescription>
            </CardHeader>
            {tokenPreview ? (
              <CardContent className="space-y-3">
                <code className="block rounded-md border bg-muted px-3 py-2 text-sm">
                  {tokenPreview}
                </code>
                <Button asChild variant="outline">
                  <Link
                    to={`${ERP_ROUTES.RESET_PASSWORD}?token=${encodeURIComponent(tokenPreview)}`}
                  >
                    Continue with preview token
                  </Link>
                </Button>
              </CardContent>
            ) : null}
          </Card>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-wrap justify-between gap-2">
        <Button
          disabled={forgotPasswordMutation.isPending}
          onClick={handleSubmit(onSubmit)}
          type="button"
        >
          {forgotPasswordMutation.isPending ? "Requesting..." : "Request reset"}
        </Button>
        <Button asChild variant="ghost">
          <Link to={ERP_ROUTES.SIGN_IN}>Back to sign in</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
