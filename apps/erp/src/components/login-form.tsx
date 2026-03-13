import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { cn } from "@repo/ui/lib/utils";
import { Button } from "@repo/ui/components/ui/button";
import { FieldError } from "@repo/ui/components/ui/field";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { ERP_ROUTES, WEB_ROUTES } from "@/constants/routes";
import { buildRootAppUrl } from "@/lib/tenant-context";
import {
  signInFormSchema,
  type SignInFormValues,
} from "@/features/auth/model/auth-form-schema";

type LoginFormProps = React.ComponentProps<"div"> & {
  errorMessage?: string;
  isPending?: boolean;
  onSubmitForm: (values: SignInFormValues) => Promise<void> | void;
};

export function LoginForm({
  className,
  errorMessage,
  isPending = false,
  onSubmitForm,
  ...props
}: LoginFormProps) {
  const { control, handleSubmit } = useForm<SignInFormValues>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  return (
    <div className={cn("flex flex-col", className)} {...props}>
      {/* Heading */}
      <div className="mb-8">
        <h2
          className="text-2xl text-foreground mb-1.5"
          style={{ fontFamily: "'Lora', serif", fontWeight: 500 }}
        >
          Welcome back
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Sign in to your school's portal to continue.
        </p>
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmitForm)}>
        <Controller
          control={control}
          name="identifier"
          render={({ field, fieldState }) => (
            <div className="flex flex-col gap-1.5">
              <Label
                className="text-[13px] font-medium text-foreground/80"
                htmlFor="identifier"
              >
                Mobile number or email
              </Label>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                autoComplete="username"
                className="h-11 bg-white border-border/80 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-1"
                id="identifier"
                placeholder="+91 98765 43210"
              />
              <FieldError>{fieldState.error?.message}</FieldError>
            </div>
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label
                  className="text-[13px] font-medium text-foreground/80"
                  htmlFor="password"
                >
                  Password
                </Label>
                <Link
                  className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                  to={ERP_ROUTES.FORGOT_PASSWORD}
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                autoComplete="current-password"
                className="h-11 bg-white border-border/80 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-1"
                id="password"
                placeholder="Enter your password"
                type="password"
              />
              <FieldError>{fieldState.error?.message}</FieldError>
            </div>
          )}
        />

        {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}

        <Button
          className="w-full h-11 mt-1 text-sm font-medium tracking-wide"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Signing in…" : "Continue"}
        </Button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="h-px flex-1 bg-border/60" />
        <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">or</span>
        <div className="h-px flex-1 bg-border/60" />
      </div>

      <p className="text-center text-[13px] text-muted-foreground">
        New school?{" "}
        <a
          className="text-foreground font-medium hover:underline underline-offset-4 transition-colors"
          href={buildRootAppUrl(WEB_ROUTES.SIGN_UP)}
        >
          Set it up here
        </a>
      </p>
    </div>
  );
}
