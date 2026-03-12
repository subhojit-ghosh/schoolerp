import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
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
import { useAuthErrorMessage } from "@/features/auth/api/use-auth";
import { useCreateInstitutionMutation } from "@/features/onboarding/api/use-onboarding";
import {
  onboardingFormSchema,
  type OnboardingFormValues,
} from "@/features/onboarding/model/onboarding-form-schema";
import { buildTenantAppUrl } from "@/lib/tenant-context";

export function SignUpPage() {
  const navigate = useNavigate();
  const createInstitutionMutation = useCreateInstitutionMutation();
  const errorMessage = useAuthErrorMessage(
    createInstitutionMutation.error,
    "Unable to create the school right now.",
  );
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

  async function onSubmit(values: OnboardingFormValues) {
    const session = await createInstitutionMutation.mutateAsync({
      body: {
        institutionName: values.institutionName,
        institutionSlug: values.institutionSlug,
        campusName: values.campusName,
        adminName: values.adminName,
        mobile: values.mobile,
        email: values.email,
        password: values.password,
      },
    });

    const activeTenantSlug = session?.activeOrganization?.slug;

    if (activeTenantSlug) {
      window.location.assign(buildTenantAppUrl(activeTenantSlug, "/dashboard"));
      return;
    }

    if (session) {
      void navigate("/dashboard");
    }
  }

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>Create school</CardTitle>
        <CardDescription>
          Provision the institution, default campus, and first admin in one
          onboarding flow.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="md:grid md:grid-cols-2 md:gap-6">
            <Controller
              control={control}
              name="institutionName"
              render={({ field, fieldState }) => (
                <Field
                  className="md:col-span-2"
                  data-invalid={fieldState.invalid || undefined}
                >
                  <FieldLabel htmlFor="institution-name">School name</FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      id="institution-name"
                      placeholder="Springfield High School"
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </FieldContent>
                </Field>
              )}
            />
            <Controller
              control={control}
              name="institutionSlug"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="institution-slug">
                    Subdomain slug
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      id="institution-slug"
                      placeholder="springfield-high"
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </FieldContent>
                </Field>
              )}
            />
            <Controller
              control={control}
              name="campusName"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="campus-name">Default campus</FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      id="campus-name"
                      placeholder="Main Campus"
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </FieldContent>
                </Field>
              )}
            />
            <Controller
              control={control}
              name="adminName"
              render={({ field, fieldState }) => (
                <Field
                  className="md:col-span-2"
                  data-invalid={fieldState.invalid || undefined}
                >
                  <FieldLabel htmlFor="admin-name">Admin name</FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      id="admin-name"
                      placeholder="Aparna Sen"
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </FieldContent>
                </Field>
              )}
            />
            <Controller
              control={control}
              name="mobile"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="admin-mobile">Mobile number</FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      id="admin-mobile"
                      placeholder="+91 98765 43210"
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </FieldContent>
                </Field>
              )}
            />
            <Controller
              control={control}
              name="email"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="admin-email">Email</FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      id="admin-email"
                      placeholder="admin@school.edu"
                      type="email"
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
                <Field
                  className="md:col-span-2"
                  data-invalid={fieldState.invalid || undefined}
                >
                  <FieldLabel htmlFor="admin-password">Password</FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      id="admin-password"
                      placeholder="Create a password"
                      type="password"
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </FieldContent>
                </Field>
              )}
            />
            {createInstitutionMutation.error ? (
              <FieldError className="md:col-span-2">{errorMessage}</FieldError>
            ) : null}
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Button
          disabled={createInstitutionMutation.isPending}
          onClick={handleSubmit(onSubmit)}
          type="button"
        >
          {createInstitutionMutation.isPending
            ? "Creating school..."
            : "Create school"}
        </Button>
      </CardFooter>
    </Card>
  );
}
