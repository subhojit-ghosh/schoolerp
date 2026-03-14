import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router";
import { Button } from "@repo/ui/components/ui/button";
import { FieldError } from "@repo/ui/components/ui/field";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  useAuthErrorMessage,
  useForgotPasswordMutation,
} from "@/features/auth/api/use-auth";
import {
  forgotPasswordFormSchema,
  type ForgotPasswordFormValues,
} from "@/features/auth/model/auth-form-schema";
import { ERP_ROUTES } from "@/constants/routes";
import { AuthLayout } from "@/components/auth-layout";

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
    <AuthLayout>
      <div className="w-full max-w-[360px]">
        {/* Back link */}
        <Link
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-8"
          to={ERP_ROUTES.SIGN_IN}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to sign in
        </Link>

        {/* Heading */}
        <div className="mb-8">
          <h2
            className="text-2xl text-foreground mb-1.5"
            style={{ fontFamily: "'Lora', serif", fontWeight: 500 }}
          >
            Recover access
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Enter the mobile number or email linked to your account and we'll send a reset link.
          </p>
        </div>

        {forgotPasswordMutation.isSuccess ? (
          /* Success state */
          <div className="flex flex-col gap-5">
            <div
              className="rounded-xl p-5 border"
              style={{ background: "#f0faf4", borderColor: "#b8e6cc" }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "#22c55e1a" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Recovery requested</p>
                  <p className="text-[13px] text-muted-foreground mt-0.5 leading-relaxed">
                    If an account exists for that identifier, recovery instructions will arrive via the backend delivery channel.
                  </p>
                </div>
              </div>
            </div>

            {tokenPreview ? (
              <div className="flex flex-col gap-3">
                <p className="text-[12px] text-muted-foreground uppercase tracking-wider font-medium">Dev preview token</p>
                <code className="block rounded-lg border bg-muted px-3 py-2.5 text-xs font-mono break-all leading-relaxed">
                  {tokenPreview}
                </code>
                <Button asChild className="w-full h-11" variant="outline">
                  <Link to={`${ERP_ROUTES.RESET_PASSWORD}?token=${encodeURIComponent(tokenPreview)}`}>
                    Continue with preview token
                  </Link>
                </Button>
              </div>
            ) : null}

            <Link
              className="text-center text-[13px] text-muted-foreground hover:text-foreground transition-colors"
              to={ERP_ROUTES.SIGN_IN}
            >
              Return to sign in
            </Link>
          </div>
        ) : (
          /* Form state */
          <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
            <Controller
              control={control}
              name="identifier"
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-1.5">
                  <Label
                    className="text-[13px] font-medium text-foreground/80"
                    htmlFor="forgot-identifier"
                  >
                    Mobile number or email
                  </Label>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    className="h-11 bg-white border-border/80 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-1"
                    id="forgot-identifier"
                    placeholder="+91 98765 43210"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </div>
              )}
            />

            {forgotPasswordMutation.error ? (
              <FieldError>{errorMessage}</FieldError>
            ) : null}

            <Button
              className="w-full h-11 mt-1 text-sm font-medium tracking-wide"
              disabled={forgotPasswordMutation.isPending}
              type="submit"
            >
              {forgotPasswordMutation.isPending ? "Sending…" : "Request reset"}
            </Button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
