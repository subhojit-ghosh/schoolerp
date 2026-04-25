import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconCircleCheckFilled,
  IconLink,
  IconSparkles,
  IconUserPlus,
} from "@tabler/icons-react";
import { Button } from "@repo/ui/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/ui/field";
import { Input } from "@repo/ui/components/ui/input";
import { PasswordInput } from "@repo/ui/components/ui/password-input";
import { cn } from "@repo/ui/lib/utils";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Link } from "react-router";
import { ERP_ROUTES } from "@/constants/routes";
import { useInstitutionSlugAvailabilityQuery } from "@/features/auth/api/use-auth";
import {
  institutionSignUpFormSchema,
  type InstitutionSignUpFormValues,
} from "@/features/auth/model/auth-form-schema";
import { PasswordStrengthBar } from "@/components/feedback/password-strength-bar";
import { buildTenantAppUrl } from "@/lib/app-host";

const SLUG_CHECK_MIN_LENGTH = 3;
type SlugAvailabilityResponse = {
  available?: boolean;
};

function slugifySchoolName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getSchoolUrlPreview(slug: string) {
  if (!slug) {
    return "Your school URL will be generated automatically.";
  }

  return buildTenantAppUrl(slug, "");
}

type SignUpFormProps = React.ComponentProps<"div"> & {
  errorMessage?: string;
  isPending?: boolean;
  onSubmitForm: (values: InstitutionSignUpFormValues) => Promise<void> | void;
};

export function SignUpForm({
  className,
  errorMessage,
  isPending = false,
  onSubmitForm,
  ...props
}: SignUpFormProps) {
  const { control, handleSubmit, setValue } =
    useForm<InstitutionSignUpFormValues>({
      resolver: zodResolver(institutionSignUpFormSchema),
      mode: "onTouched",
      defaultValues: {
        institutionName: "",
        adminName: "",
        mobile: "",
        email: "",
        institutionSlug: "",
        password: "",
      },
    });
  const [slugEditedManually, setSlugEditedManually] = useState(false);
  const institutionName = useWatch({
    control,
    name: "institutionName",
  });
  const institutionSlug = useWatch({
    control,
    name: "institutionSlug",
  });
  const password = useWatch({
    control,
    name: "password",
  });
  const deferredSlug = useDeferredValue((institutionSlug ?? "").trim());
  const shouldCheckSlug = deferredSlug.length >= SLUG_CHECK_MIN_LENGTH;
  const slugAvailabilityQuery = useInstitutionSlugAvailabilityQuery(
    shouldCheckSlug,
    deferredSlug,
  );
  const slugAvailability = slugAvailabilityQuery.data as
    | SlugAvailabilityResponse
    | undefined;

  useEffect(() => {
    if (slugEditedManually) {
      return;
    }

    setValue("institutionSlug", slugifySchoolName(institutionName ?? ""), {
      shouldDirty: Boolean((institutionName ?? "").trim()),
      shouldValidate: true,
    });
  }, [institutionName, setValue, slugEditedManually]);

  const slugFeedback = useMemo(() => {
    if (!deferredSlug) {
      return {
        tone: "neutral" as const,
        text: "Choose a school name to generate your URL.",
      };
    }

    if (deferredSlug.length < SLUG_CHECK_MIN_LENGTH) {
      return {
        tone: "neutral" as const,
        text: "Use at least 3 characters for the school URL.",
      };
    }

    if (slugAvailabilityQuery.isFetching) {
      return {
        tone: "neutral" as const,
        text: "Checking URL availability...",
      };
    }

    if (slugAvailability?.available) {
      return {
        tone: "success" as const,
        text: "This school URL is available.",
      };
    }

    return {
      tone: "error" as const,
      text: "This school URL is already taken. Try another one.",
    };
  }, [
    deferredSlug,
    slugAvailability?.available,
    slugAvailabilityQuery.isFetching,
  ]);

  return (
    <div className={cn("flex w-full flex-col", className)} {...props}>
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
          <IconUserPlus className="size-3.5" />
          Create your school workspace
        </div>
        <h2
          className="mb-1.5 text-2xl text-foreground"
          style={{ fontFamily: "'Lora', serif", fontWeight: 500 }}
        >
          Get started
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Set up your school admin account and reserve your school URL.
        </p>
      </div>

      <form
        className="flex flex-col gap-5"
        onSubmit={handleSubmit(onSubmitForm)}
      >
        <FieldGroup className="gap-4">
          <Controller
            control={control}
            name="institutionName"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="sign-up-school-name" required>
                  School name
                </FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    className="h-11 border-border/80 bg-white text-sm focus-visible:ring-1"
                    id="sign-up-school-name"
                    placeholder="Your school name"
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
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="sign-up-admin-name" required>
                  Name
                </FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    className="h-11 border-border/80 bg-white text-sm focus-visible:ring-1"
                    id="sign-up-admin-name"
                    placeholder="Your full name"
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
                <FieldLabel htmlFor="sign-up-mobile" required>
                  Mobile number
                </FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    className="h-11 border-border/80 bg-white text-sm focus-visible:ring-1"
                    id="sign-up-mobile"
                    inputMode="tel"
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
                <FieldLabel htmlFor="sign-up-email" required>
                  Email address
                </FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    className="h-11 border-border/80 bg-white text-sm focus-visible:ring-1"
                    id="sign-up-email"
                    type="email"
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
                <FieldLabel htmlFor="sign-up-school-url" required>
                  School URL
                </FieldLabel>
                <FieldContent>
                  <div className="relative">
                    <IconLink className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      className="h-11 border-border/80 bg-white pl-9 text-sm focus-visible:ring-1"
                      id="sign-up-school-url"
                      onChange={(event) => {
                        setSlugEditedManually(true);
                        field.onChange(slugifySchoolName(event.target.value));
                      }}
                    />
                  </div>
                  <FieldDescription>
                    {getSchoolUrlPreview(institutionSlug ?? "")}
                  </FieldDescription>
                  <div
                    className={cn(
                      "flex items-center gap-2 text-xs",
                      slugFeedback.tone === "success" && "text-emerald-600",
                      slugFeedback.tone === "error" && "text-destructive",
                      slugFeedback.tone === "neutral" &&
                        "text-muted-foreground",
                    )}
                  >
                    {slugFeedback.tone === "success" ? (
                      <IconCircleCheckFilled className="size-3.5" />
                    ) : slugFeedback.tone === "neutral" ? (
                      <IconSparkles className="size-3.5" />
                    ) : null}
                    <span>{slugFeedback.text}</span>
                  </div>
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
                <FieldLabel htmlFor="sign-up-password" required>
                  Password
                </FieldLabel>
                <FieldContent>
                  <PasswordInput
                    {...field}
                    aria-invalid={fieldState.invalid}
                    autoComplete="new-password"
                    className="h-11 border-border/80 bg-white text-sm focus-visible:ring-1"
                    id="sign-up-password"
                  />
                  <FieldDescription>
                    Use at least 8 characters.
                  </FieldDescription>
                  <PasswordStrengthBar password={password ?? ""} />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />
        </FieldGroup>

        {errorMessage ? <FieldError>{errorMessage}</FieldError> : null}

        <Button
          className="mt-1 h-11 w-full text-sm font-medium tracking-wide"
          disabled={isPending || slugFeedback.tone === "error"}
          type="submit"
        >
          {isPending ? "Creating workspace..." : "Create school workspace"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            className="font-medium text-foreground transition-colors hover:text-primary"
            to={ERP_ROUTES.SIGN_IN}
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
