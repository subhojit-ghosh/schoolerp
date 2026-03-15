import { Navigate, useNavigate } from "react-router";
import { buildTenantAppUrl } from "@repo/contracts";
import { ERP_ROUTES } from "@/constants/routes";
import {
  useAuthErrorMessage,
  useSignInMutation,
} from "@/features/auth/api/use-auth";
import type { SignInFormValues } from "@/features/auth/model/auth-form-schema";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { AuthLayout } from "@/features/auth/ui/auth-layout";
import { LoginForm } from "@/features/auth/ui/login-form";

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
    const session = await signInMutation.mutateAsync({
      body: values,
    });

    const activeTenantSlug = session?.activeOrganization?.slug;

    if (activeTenantSlug) {
      const dashboardUrl = buildTenantAppUrl(
        activeTenantSlug,
        ERP_ROUTES.DASHBOARD,
      );

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
    <AuthLayout>
      <LoginForm
        className="w-full max-w-[360px]"
        errorMessage={signInMutation.error ? errorMessage : undefined}
        isPending={signInMutation.isPending}
        onSubmitForm={onSubmit}
      />
    </AuthLayout>
  );
}
