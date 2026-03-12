import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { FieldDescription, FieldError } from "@repo/ui/components/ui/field";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  onboardingFormSchema,
  type OnboardingFormValues,
} from "@/features/onboarding/model/onboarding-form-schema";

type SignupFormProps = React.ComponentProps<typeof Card> & {
  errorMessage?: string;
  isPending?: boolean;
  onSubmitForm: (values: OnboardingFormValues) => Promise<void> | void;
};

export function SignupForm({
  errorMessage,
  isPending = false,
  onSubmitForm,
  ...props
}: SignupFormProps) {
  const { control, handleSubmit } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingFormSchema),
    defaultValues: {
      institutionName: "",
      institutionSlug: "",
      campusName: "",
      adminName: "",
      mobile: "",
      email: "",
      password: "",
    },
  });

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create school</CardTitle>
        <CardDescription>
          Provision the institution, default campus, and first admin in one
          onboarding flow.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmitForm)}>
          <div className="grid gap-6 md:grid-cols-2">
            <Controller
              control={control}
              name="institutionName"
              render={({ field, fieldState }) => (
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="institution-name">School name</Label>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="institution-name"
                    placeholder="Springfield High School"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </div>
              )}
            />
            <Controller
              control={control}
              name="institutionSlug"
              render={({ field, fieldState }) => (
                <div className="grid gap-2">
                  <Label htmlFor="institution-slug">Subdomain slug</Label>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="institution-slug"
                    placeholder="springfield-high"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </div>
              )}
            />
            <Controller
              control={control}
              name="campusName"
              render={({ field, fieldState }) => (
                <div className="grid gap-2">
                  <Label htmlFor="campus-name">Default campus</Label>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="campus-name"
                    placeholder="Main Campus"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </div>
              )}
            />
            <Controller
              control={control}
              name="adminName"
              render={({ field, fieldState }) => (
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="admin-name">Admin name</Label>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="admin-name"
                    placeholder="Aparna Sen"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </div>
              )}
            />
            <Controller
              control={control}
              name="mobile"
              render={({ field, fieldState }) => (
                <div className="grid gap-2">
                  <Label htmlFor="admin-mobile">Mobile number</Label>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="admin-mobile"
                    placeholder="+91 98765 43210"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </div>
              )}
            />
            <Controller
              control={control}
              name="email"
              render={({ field, fieldState }) => (
                <div className="grid gap-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="admin-email"
                    placeholder="admin@school.edu"
                    type="email"
                  />
                  <FieldDescription>
                    Optional for now. Mobile remains the primary identifier.
                  </FieldDescription>
                  <FieldError>{fieldState.error?.message}</FieldError>
                </div>
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field, fieldState }) => (
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="admin-password"
                    placeholder="Create a password"
                    type="password"
                  />
                  <FieldDescription>
                    Must be at least 8 characters long.
                  </FieldDescription>
                  <FieldError>{fieldState.error?.message}</FieldError>
                </div>
              )}
            />
          </div>
          {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
          <Button className="w-full" disabled={isPending} type="submit">
            {isPending ? "Creating school..." : "Create school"}
          </Button>
          <div className="text-center text-sm">
            Already have access?{" "}
            <Link className="underline underline-offset-4" to="/sign-in">
              Sign in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
