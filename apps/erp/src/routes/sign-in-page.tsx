import { Navigate, useNavigate } from "react-router-dom";
import { LoginForm } from "@/components/login-form";
import { ERP_ROUTES } from "@/constants/routes";
import {
  useAuthErrorMessage,
  useSignInMutation,
} from "@/features/auth/api/use-auth";
import type { SignInFormValues } from "@/features/auth/model/auth-form-schema";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { getTenantSlug } from "@/lib/api/client";
import { buildTenantAppUrl } from "@/lib/tenant-context";

export function SignInPage() {
  const navigate = useNavigate();
  const status = useAuthStore((store) => store.status);
  const signInMutation = useSignInMutation();
  const errorMessage = useAuthErrorMessage(
    signInMutation.error,
    "Unable to sign in with those credentials.",
  );

  if (status === "authenticated") {
    return <Navigate replace to={ERP_ROUTES.DASHBOARD} />;
  }

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
      const dashboardUrl = buildTenantAppUrl(activeTenantSlug, ERP_ROUTES.DASHBOARD);

      if (dashboardUrl !== `${window.location.origin}${ERP_ROUTES.DASHBOARD}`) {
        window.location.assign(dashboardUrl);
        return;
      }
    }

    if (session) {
      void navigate(ERP_ROUTES.DASHBOARD);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6 md:p-10">
      <LoginForm
        className="w-full max-w-md"
        errorMessage={signInMutation.error ? errorMessage : undefined}
        isPending={signInMutation.isPending}
        onSubmitForm={onSubmit}
      />
    </div>
  );
}
