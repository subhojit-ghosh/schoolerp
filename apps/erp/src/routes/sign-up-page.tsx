import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuthErrorMessage, useSignUpMutation } from "@/features/auth/api/use-auth";
import {
  signUpFormSchema,
  type SignUpFormValues,
} from "@/features/auth/model/auth-form-schema";

export function SignUpPage() {
  const navigate = useNavigate();
  const signUpMutation = useSignUpMutation();
  const errorMessage = useAuthErrorMessage(
    signUpMutation.error,
    "Unable to create the account right now.",
  );
  const { control, handleSubmit } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      name: "",
      mobile: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: SignUpFormValues) {
    const session = await signUpMutation.mutateAsync({
      body: values,
    });

    if (session) {
      void navigate("/dashboard");
    }
  }

  return (
    <Card className="max-w-3xl">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Create Account</p>
        <h2 className="text-2xl font-semibold tracking-tight">Create a basic ERP user account backed by Nest auth.</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          This is a functionality-first setup: create a user, issue a secure HTTP-only cookie from Nest, and keep the
          API client and auth state outside the UI components.
        </p>
      </div>

      <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <Field className="md:col-span-2">
              <FieldLabel>Name</FieldLabel>
              <Input {...field} placeholder="Aparna Sen" />
              <FieldError>{fieldState.error?.message}</FieldError>
            </Field>
          )}
        />
        <Controller
          control={control}
          name="mobile"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Mobile number</FieldLabel>
              <Input {...field} placeholder="+91 98765 43210" />
              <FieldError>{fieldState.error?.message}</FieldError>
            </Field>
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input {...field} placeholder="admin@school.edu" type="email" />
              <FieldError>{fieldState.error?.message}</FieldError>
            </Field>
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <Field className="md:col-span-2">
              <FieldLabel>Password</FieldLabel>
              <Input {...field} placeholder="Create a password" type="password" />
              <FieldError>{fieldState.error?.message}</FieldError>
            </Field>
          )}
        />

        {signUpMutation.error ? (
          <div className="md:col-span-2">
            <FieldError>{errorMessage}</FieldError>
          </div>
        ) : null}

        <div className="flex gap-3 pt-2 md:col-span-2">
          <Button disabled={signUpMutation.isPending} type="submit">
            {signUpMutation.isPending ? "Creating account..." : "Create account"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
