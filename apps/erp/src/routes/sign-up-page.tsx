import { Navigate, useNavigate } from "react-router-dom";
import { SignupForm } from "@/components/signup-form";
import { useAuthErrorMessage } from "@/features/auth/api/use-auth";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useCreateInstitutionMutation } from "@/features/onboarding/api/use-onboarding";
import type { OnboardingFormValues } from "@/features/onboarding/model/onboarding-form-schema";
import { buildTenantAppUrl } from "@/lib/tenant-context";

export function SignUpPage() {
  const navigate = useNavigate();
  const status = useAuthStore((store) => store.status);
  const createInstitutionMutation = useCreateInstitutionMutation();
  const errorMessage = useAuthErrorMessage(
    createInstitutionMutation.error,
    "Unable to create the school right now.",
  );

  if (status === "authenticated") {
    return <Navigate replace to="/dashboard" />;
  }

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
    <div className="flex min-h-svh items-center justify-center p-6 md:p-10">
      <SignupForm
        className="w-full max-w-3xl"
        errorMessage={createInstitutionMutation.error ? errorMessage : undefined}
        isPending={createInstitutionMutation.isPending}
        onSubmitForm={onSubmit}
      />
    </div>
  );
}
