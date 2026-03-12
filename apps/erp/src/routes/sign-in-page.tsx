import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
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
  useSignInMutation,
} from "@/features/auth/api/use-auth";
import {
  signInFormSchema,
  type SignInFormValues,
} from "@/features/auth/model/auth-form-schema";
import { getTenantSlug } from "@/lib/api/client";
import { buildTenantAppUrl } from "@/lib/tenant-context";

export function SignInPage() {
  const navigate = useNavigate();
  const signInMutation = useSignInMutation();
  const errorMessage = useAuthErrorMessage(
    signInMutation.error,
    "Unable to sign in with those credentials.",
  );
  const { control, handleSubmit } = useForm<SignInFormValues>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  async function onSubmit(values: SignInFormValues) {
    const tenantSlug = getTenantSlug() ?? undefined;
    const session = await signInMutation.mutateAsync({
      body: {
        ...values,
        tenantSlug,
      },
    });

    const activeTenantSlug = session?.activeOrganization?.slug;

    if (activeTenantSlug) {
      const dashboardUrl = buildTenantAppUrl(activeTenantSlug, "/dashboard");

      if (dashboardUrl !== `${window.location.origin}/dashboard`) {
        window.location.assign(dashboardUrl);
        return;
      }
    }

    if (session) {
      void navigate("/dashboard");
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Use your mobile number by default. Email remains a fallback
          identifier.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              control={control}
              name="identifier"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="identifier">
                    Mobile number or email
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      id="identifier"
                      placeholder="+91 98765 43210"
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
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      id="password"
                      placeholder="Enter your password"
                      type="password"
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </FieldContent>
                </Field>
              )}
            />
            {signInMutation.error ? <FieldError>{errorMessage}</FieldError> : null}
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex flex-wrap justify-between gap-2">
        <Button
          disabled={signInMutation.isPending}
          onClick={handleSubmit(onSubmit)}
          type="button"
        >
          {signInMutation.isPending ? "Signing in..." : "Continue"}
        </Button>
        <Button asChild variant="ghost">
          <Link to="/forgot-password">Forgot password?</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
