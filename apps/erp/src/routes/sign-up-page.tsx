import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuthErrorMessage } from "@/features/auth/api/use-auth";
import { useCreateInstitutionMutation } from "@/features/onboarding/api/use-onboarding";
import { buildTenantAppUrl } from "@/lib/tenant-context";
import {
  onboardingFormSchema,
  type OnboardingFormValues,
} from "@/features/onboarding/model/onboarding-form-schema";

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
    <Card className="max-w-3xl">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Free School Signup
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">
          Create the institution, default campus, and first admin.
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          This provisions the tenant base first so later ERP features sit on a
          clean institution, campus, membership, and session model.
        </p>
      </div>

      <form
        className="mt-6 grid gap-4 md:grid-cols-2"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Controller
          control={control}
          name="institutionName"
          render={({ field, fieldState }) => (
            <Field className="md:col-span-2">
              <FieldLabel>School name</FieldLabel>
              <Input {...field} placeholder="Springfield High School" />
              <FieldError>{fieldState.error?.message}</FieldError>
            </Field>
          )}
        />
        <Controller
          control={control}
          name="institutionSlug"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Subdomain slug</FieldLabel>
              <Input {...field} placeholder="springfield-high" />
              <FieldError>{fieldState.error?.message}</FieldError>
            </Field>
          )}
        />
        <Controller
          control={control}
          name="campusName"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Default campus</FieldLabel>
              <Input {...field} placeholder="Main Campus" />
              <FieldError>{fieldState.error?.message}</FieldError>
            </Field>
          )}
        />
        <Controller
          control={control}
          name="adminName"
          render={({ field, fieldState }) => (
            <Field className="md:col-span-2">
              <FieldLabel>Admin name</FieldLabel>
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
              <Input
                {...field}
                placeholder="Create a password"
                type="password"
              />
              <FieldError>{fieldState.error?.message}</FieldError>
            </Field>
          )}
        />

        {createInstitutionMutation.error ? (
          <div className="md:col-span-2">
            <FieldError>{errorMessage}</FieldError>
          </div>
        ) : null}

        <div className="flex gap-3 pt-2 md:col-span-2">
          <Button disabled={createInstitutionMutation.isPending} type="submit">
            {createInstitutionMutation.isPending
              ? "Creating school..."
              : "Create school"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
