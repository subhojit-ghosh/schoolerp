"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { APP_FALLBACKS } from "@repo/contracts";
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
import { buildTenantAppUrl } from "@/lib/app-host";

const SLUG_CHECK_DEBOUNCE_MS = 400;

type SlugStatus = "idle" | "checking" | "available" | "taken" | "error";

async function checkSlugAvailability(
  slug: string,
): Promise<{ available: boolean }> {
  const response = await fetch(
    `${APP_FALLBACKS.API_URL}/onboarding/check-slug?slug=${encodeURIComponent(slug)}`,
    { credentials: "include" },
  );

  if (!response.ok) {
    throw new Error("Failed to check slug");
  }

  return response.json();
}

function SlugPreview({
  slug,
  slugStatus,
}: {
  slug: string;
  slugStatus: SlugStatus;
}) {
  if (!slug) {
    return (
      <p className="text-xs text-muted-foreground">
        Your school will be accessible at{" "}
        <span className="font-medium">your-slug.erp.test</span>
      </p>
    );
  }

  return (
    <p className="text-xs">
      <span className="text-muted-foreground">Your school URL: </span>
      <span className="font-medium text-foreground">{slug}.erp.test</span>
      {slugStatus === "checking" ? (
        <span className="ml-2 text-muted-foreground">Checking...</span>
      ) : null}
      {slugStatus === "available" ? (
        <span className="ml-2 text-emerald-600">Available</span>
      ) : null}
      {slugStatus === "taken" ? (
        <span className="ml-2 text-destructive">Already taken</span>
      ) : null}
    </p>
  );
}

function PasswordStrengthBar({ password }: { password: string }) {
  const strength = getPasswordStrength(password);

  if (!password) {
    return null;
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full transition-colors ${
              level <= strength.level
                ? strength.level <= 1
                  ? "bg-destructive"
                  : strength.level <= 2
                    ? "bg-orange-400"
                    : strength.level <= 3
                      ? "bg-amber-400"
                      : "bg-emerald-500"
                : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{strength.label}</p>
    </div>
  );
}

function getPasswordStrength(password: string) {
  let level = 0;

  if (password.length >= 8) level++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) level++;
  if (/\d/.test(password)) level++;
  if (/[^a-zA-Z0-9]/.test(password)) level++;

  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong"];

  return { level, label: labels[level] };
}

export function SignupForm() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const slugCheckTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { control, handleSubmit, watch } = useForm<OnboardingFormValues>({
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

  const watchedSlug = watch("institutionSlug");
  const watchedPassword = watch("password");

  const checkSlug = useCallback((slug: string) => {
    if (slugCheckTimerRef.current) {
      clearTimeout(slugCheckTimerRef.current);
    }

    if (!slug || slug.length < 2) {
      setSlugStatus("idle");
      return;
    }

    setSlugStatus("checking");

    slugCheckTimerRef.current = setTimeout(async () => {
      try {
        const result = await checkSlugAvailability(slug);
        setSlugStatus(result.available ? "available" : "taken");
      } catch {
        setSlugStatus("error");
      }
    }, SLUG_CHECK_DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    checkSlug(watchedSlug);
  }, [watchedSlug, checkSlug]);

  useEffect(() => {
    return () => {
      if (slugCheckTimerRef.current) {
        clearTimeout(slugCheckTimerRef.current);
      }
    };
  }, []);

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
          Set up your institution, default campus, and admin account in one step.
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
                  <Label htmlFor="institution-name">
                    School name <span className="text-destructive">*</span>
                  </Label>
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
                  <Label htmlFor="institution-slug">
                    Subdomain slug <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid || slugStatus === "taken"}
                    id="institution-slug"
                  />
                  <SlugPreview slug={watchedSlug} slugStatus={slugStatus} />
                  <FieldError>
                    {fieldState.error?.message ??
                      (slugStatus === "taken"
                        ? "This subdomain is already in use. Choose a different one."
                        : undefined)}
                  </FieldError>
                </div>
              )}
            />
            <Controller
              control={control}
              name="campusName"
              render={({ field, fieldState }) => (
                <div className="grid gap-2">
                  <Label htmlFor="campus-name">
                    Default campus <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="campus-name"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your primary campus or branch name.
                  </p>
                  <FieldError>{fieldState.error?.message}</FieldError>
                </div>
              )}
            />
            <Controller
              control={control}
              name="adminName"
              render={({ field, fieldState }) => (
                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="admin-name">
                    Admin name <span className="text-destructive">*</span>
                  </Label>
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
                  <Label htmlFor="admin-mobile">
                    Mobile number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="admin-mobile"
                    inputMode="tel"
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
                  <Label htmlFor="admin-password">
                    Password <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="admin-password"
                    type="password"
                  />
                  <PasswordStrengthBar password={watchedPassword} />
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
