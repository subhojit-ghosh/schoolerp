import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuthErrorMessage, useSignInMutation } from "@/features/auth/api/use-auth";
import {
  signInFormSchema,
  type SignInFormValues,
} from "@/features/auth/model/auth-form-schema";

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
    const session = await signInMutation.mutateAsync({
      body: values,
    });

    if (session) {
      void navigate("/dashboard");
    }
  }

  return (
    <Card className="max-w-2xl">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Sign In</p>
        <h2 className="text-2xl font-semibold tracking-tight">Mobile-first sign in, email as fallback.</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          This screen is intentionally simple for the foundation pass. Auth will be backed by Passport in Nest, not by
          client-managed tokens.
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
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Password</FieldLabel>
              <Input {...field} placeholder="Enter your password" type="password" />
              <FieldError>{fieldState.error?.message}</FieldError>
            </Field>
          )}
        />

        {signInMutation.error ? <FieldError>{errorMessage}</FieldError> : null}

        <div className="flex flex-wrap gap-3 pt-2">
          <Button disabled={signInMutation.isPending} type="submit">
            {signInMutation.isPending ? "Signing in..." : "Continue"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
