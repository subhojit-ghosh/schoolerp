"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { ERP_ROUTES } from "@/constants/routes";
import { createInstitution } from "@/features/onboarding/api/create-institution";
import {
  onboardingFormSchema,
  type OnboardingFormValues,
} from "@/features/onboarding/model/onboarding-form-schema";
import { buildTenantAppUrl } from "@/lib/tenant-context";

export function SignupForm() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
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

  function onSubmit(values: OnboardingFormValues) {
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const session = await createInstitution(values);
        const activeTenantSlug = session.activeOrganization?.slug;

        if (!activeTenantSlug) {
          throw new Error(
            "The tenant was created, but no active tenant slug was returned.",
          );
        }

        window.location.assign(
          buildTenantAppUrl(activeTenantSlug, ERP_ROUTES.DASHBOARD),
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to create the school right now.",
        );
      }
    });
  }

  return (
    <Card className="border-white/70 bg-white/78 shadow-xl shadow-primary/10 backdrop-blur">
      <CardHeader>
        <CardTitle>Create school</CardTitle>
        <CardDescription>
          Provision the institution, default campus, and initial admin account
          in one step.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
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
                    type="email"
                  />
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
                    type="password"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </div>
              )}
            />
          </div>
          {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}
          <Button className="w-full" disabled={isPending} type="submit">
            {isPending ? "Creating school..." : "Create school"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
