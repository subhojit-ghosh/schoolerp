import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { cn } from "@repo/ui/lib/utils";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
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
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Sign in to your account</CardTitle>
          <CardDescription>
            Use your mobile number by default. Email remains a fallback
            identifier.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmitForm)}>
            <div className="grid gap-3">
              <Controller
                control={control}
                name="identifier"
                render={({ field, fieldState }) => (
                  <div className="grid gap-2">
                    <Label htmlFor="identifier">Mobile number or email</Label>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
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
                  <div className="grid gap-2">
                    <div className="flex items-center">
                      <Label htmlFor="password">Password</Label>
                      <Link
                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                        to={ERP_ROUTES.FORGOT_PASSWORD}
                      >
                        Forgot your password?
                      </Link>
                    </div>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      id="password"
                      placeholder="Enter your password"
                      type="password"
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </div>
                )}
              />
            </div>
            {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
            <Button className="w-full" disabled={isPending} type="submit">
              {isPending ? "Signing in..." : "Continue"}
            </Button>
            <div className="text-center text-sm">
              Don&apos;t have a school yet?{" "}
              <a
                className="underline underline-offset-4"
                href={buildRootAppUrl(WEB_ROUTES.SIGN_UP)}
              >
                Create one
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
