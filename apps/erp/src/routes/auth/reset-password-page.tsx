import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { Button } from "@repo/ui/components/ui/button";
import { FieldError } from "@repo/ui/components/ui/field";
import { Input } from "@repo/ui/components/ui/input";
import { PasswordInput } from "@repo/ui/components/ui/password-input";
import { Label } from "@repo/ui/components/ui/label";
import {
  useAuthErrorMessage,
  useResetPasswordMutation,
} from "@/features/auth/api/use-auth";
import {
  resetPasswordFormSchema,
  type ResetPasswordFormValues,
} from "@/features/auth/model/auth-form-schema";
import { ERP_ROUTES } from "@/constants/routes";
import { AuthLayout } from "@/features/auth/ui/auth-layout";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { PasswordStrengthBar } from "@/components/feedback/password-strength-bar";
import { extractApiError } from "@/lib/api-error";

export function ResetPasswordPage() {
  useDocumentTitle("Reset Password");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const resetPasswordMutation = useResetPasswordMutation();
  const errorMessage = useAuthErrorMessage(
    resetPasswordMutation.error,
    "Unable to reset the password right now.",
  );
  const initialToken = searchParams.get("token") ?? "";
  const isSetupFlow = searchParams.get("setup") === "1";
  const { control, handleSubmit, setValue, watch } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    mode: "onTouched",
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
    try {
      await resetPasswordMutation.mutateAsync({
        body: {
          token: values.token,
          password: values.password,
        },
      });
      void navigate(ERP_ROUTES.SIGN_IN);
    } catch (error) {
      toast.error(extractApiError(error, "Unable to reset the password. Please try again."));
    }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-[360px]">
        {/* Back link — only shown in the normal forgot-password flow */}
        {!isSetupFlow && (
          <Link
            className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-8"
            to={ERP_ROUTES.FORGOT_PASSWORD}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to recovery
          </Link>
        )}

        {/* Heading */}
        <div className="mb-8">
          {isSetupFlow && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
              <svg
                className="shrink-0 text-amber-600"
                fill="none"
                height="16"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="16"
              >
                <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              </svg>
              <p className="text-[13px] text-amber-800 leading-snug">
                You're using a temporary password. Please set a permanent one to
                continue.
              </p>
            </div>
          )}
          <h2
            className="text-2xl text-foreground mb-1.5"
            style={{ fontFamily: "'Lora', serif", fontWeight: 500 }}
          >
            {isSetupFlow ? "Create your password" : "Set new password"}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isSetupFlow
              ? "Choose a strong password to secure your account."
              : "Paste the reset token from your delivery channel and choose a strong new password."}
          </p>
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
          {/* Token field — hidden in setup flow since it's pre-filled from the URL */}
          {!isSetupFlow && (
            <Controller
              control={control}
              name="token"
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-1.5">
                  <Label
                    className="text-[13px] font-medium text-foreground/80"
                    htmlFor="reset-token"
                  >
                    Reset token
                  </Label>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    className="h-11 bg-white border-border/80 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-1 font-mono"
                    id="reset-token"
                    placeholder="Paste reset token"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </div>
              )}
            />
          )}

          {/* Divider — only between token and password fields in normal flow */}
          {!isSetupFlow && <div className="h-px bg-border/50" />}

          <Controller
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1.5">
                <Label
                  className="text-[13px] font-medium text-foreground/80"
                  htmlFor="reset-password"
                >
                  New password
                </Label>
                <PasswordInput
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="new-password"
                  className="h-11 bg-white border-border/80 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-1"
                  id="reset-password"
                  placeholder="Enter a new password"
                />
                <FieldError>{fieldState.error?.message}</FieldError>
                <PasswordStrengthBar password={watch("password")} />
              </div>
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1.5">
                <Label
                  className="text-[13px] font-medium text-foreground/80"
                  htmlFor="confirm-password"
                >
                  Confirm password
                </Label>
                <PasswordInput
                  {...field}
                  aria-invalid={fieldState.invalid}
                  autoComplete="new-password"
                  className="h-11 bg-white border-border/80 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-1"
                  id="confirm-password"
                  placeholder="Confirm the new password"
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </div>
            )}
          />

          {resetPasswordMutation.error ? (
            <FieldError>{errorMessage}</FieldError>
          ) : null}

          <Button
            className="w-full h-11 mt-1 text-sm font-medium tracking-wide"
            disabled={resetPasswordMutation.isPending}
            type="submit"
          >
            {resetPasswordMutation.isPending
              ? "Saving…"
              : isSetupFlow
                ? "Set password"
                : "Reset password"}
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}
