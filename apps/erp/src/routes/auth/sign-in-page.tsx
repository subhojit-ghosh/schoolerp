import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ERP_ROUTES } from "@/constants/routes";
import {
  useAuthErrorMessage,
  useSignInMutation,
} from "@/features/auth/api/use-auth";
import type { SignInFormValues } from "@/features/auth/model/auth-form-schema";
import { AuthLayout } from "@/features/auth/ui/auth-layout";
import { LoginForm } from "@/features/auth/ui/login-form";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { extractApiError } from "@/lib/api-error";
import { buildTenantAppUrl } from "@/lib/app-host";

export function SignInPage() {
  useDocumentTitle("Sign In");
  const navigate = useNavigate();
  const signInMutation = useSignInMutation();
  const errorMessage = useAuthErrorMessage(
    signInMutation.error,
    "Unable to sign in with those credentials.",
  );

  async function onSubmit(values: SignInFormValues) {
    try {
      const session = await signInMutation.mutateAsync({
        body: values,
      });

      const maybeSetup = session as unknown as {
        mustChangePassword?: boolean;
        setupToken?: string;
      };
      if (maybeSetup.mustChangePassword && maybeSetup.setupToken) {
        void navigate(
          `${ERP_ROUTES.RESET_PASSWORD}?token=${encodeURIComponent(maybeSetup.setupToken)}&setup=1`,
        );
        return;
      }

      const activeTenantSlug = session?.activeOrganization?.slug;

      if (activeTenantSlug) {
        const dashboardUrl = buildTenantAppUrl(
          activeTenantSlug,
          ERP_ROUTES.DASHBOARD,
        );

        if (
          dashboardUrl !== `${window.location.origin}${ERP_ROUTES.DASHBOARD}`
        ) {
          window.location.assign(dashboardUrl);
          return;
        }
      }

      if (session) {
        void navigate(ERP_ROUTES.DASHBOARD);
      }
    } catch (error) {
      toast.error(
        extractApiError(
          error,
          "Unable to sign in. Please check your credentials and try again.",
        ),
      );
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
