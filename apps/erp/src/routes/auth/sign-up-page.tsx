import { toast } from "sonner";
import { AuthLayout } from "@/features/auth/ui/auth-layout";
import { SignUpForm } from "@/features/auth/ui/sign-up-form";
import { useCreateInstitutionMutation } from "@/features/auth/api/use-auth";
import type { InstitutionSignUpFormValues } from "@/features/auth/model/auth-form-schema";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { buildTenantAppUrl } from "@/lib/app-host";
import { ERP_ROUTES } from "@/constants/routes";
import { extractApiError } from "@/lib/api-error";

const DEFAULT_CAMPUS_NAME = "Main Campus";

export function SignUpPage() {
  useDocumentTitle("Sign Up");
  const createInstitutionMutation = useCreateInstitutionMutation();

  async function onSubmit(values: InstitutionSignUpFormValues) {
    try {
      await createInstitutionMutation.mutateAsync({
        body: {
          institutionName: values.institutionName,
          institutionSlug: values.institutionSlug,
          campusName: DEFAULT_CAMPUS_NAME,
          adminName: values.adminName,
          mobile: values.mobile,
          email: values.email,
          password: values.password,
        },
      });

      toast.success("School workspace created. Redirecting to your sign-in page...");
      window.location.assign(
        buildTenantAppUrl(values.institutionSlug, ERP_ROUTES.SIGN_IN),
      );
    } catch (error) {
      toast.error(
        extractApiError(
          error,
          "Unable to create your school workspace. Please try again.",
        ),
      );
    }
  }

  return (
    <AuthLayout>
      <SignUpForm
        className="w-full max-w-[420px]"
        errorMessage={
          createInstitutionMutation.error
            ? "Please review the details and try again."
            : undefined
        }
        isPending={createInstitutionMutation.isPending}
        onSubmitForm={onSubmit}
      />
    </AuthLayout>
  );
}
