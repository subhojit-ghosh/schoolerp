import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Button } from "@repo/ui/components/ui/button";
import { FieldError } from "@repo/ui/components/ui/field";
import { Input } from "@repo/ui/components/ui/input";
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
import { AuthLayout } from "@/components/auth-layout";

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

    void navigate(ERP_ROUTES.SIGN_IN);
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-[360px]">
        {/* Back link */}
        <Link
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-8"
          to={ERP_ROUTES.FORGOT_PASSWORD}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to recovery
        </Link>

        {/* Heading */}
        <div className="mb-8">
          <h2
            className="text-2xl text-foreground mb-1.5"
            style={{ fontFamily: "'Lora', serif", fontWeight: 500 }}
          >
            Set new password
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Paste the reset token from your delivery channel and choose a strong new password.
          </p>
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
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

          {/* Divider */}
          <div className="h-px bg-border/50" />

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
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  className="h-11 bg-white border-border/80 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-1"
                  id="reset-password"
                  placeholder="Enter a new password"
                  type="password"
                />
                <FieldError>{fieldState.error?.message}</FieldError>
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
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  className="h-11 bg-white border-border/80 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-1"
                  id="confirm-password"
                  placeholder="Confirm the new password"
                  type="password"
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
            {resetPasswordMutation.isPending ? "Resetting…" : "Reset password"}
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}
