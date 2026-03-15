import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { IconChevronLeft } from "@tabler/icons-react";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  getActiveContext,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useCreateStaffMutation,
} from "@/features/staff/api/use-staff";
import { type StaffFormValues } from "@/features/staff/model/staff-form-schema";
import { StaffForm } from "@/features/staff/ui/staff-form";
import { ERP_ROUTES } from "@/constants/routes";
import { appendSearch } from "@/lib/routes";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

const DEFAULT_VALUES: StaffFormValues = {
  name: "",
  mobile: "",
  email: "",
  campusId: "",
  status: "active",
};

export function StaffCreatePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const institutionId = session?.activeOrganization?.id;
  const canManageStaff = isStaffContext(session);
  const managedInstitutionId = canManageStaff ? institutionId : undefined;
  const campuses = session?.campuses ?? [];
  const createStaffMutation = useCreateStaffMutation(managedInstitutionId);
  const createError = createStaffMutation.error as Error | null | undefined;

  async function handleSubmit(values: StaffFormValues) {
    if (!institutionId) {
      return;
    }

    await createStaffMutation.mutateAsync({
      body: values,
    });
    toast.success(ERP_TOAST_MESSAGES.created(ERP_TOAST_SUBJECTS.STAFF_RECORD));
    void navigate(appendSearch(ERP_ROUTES.STAFF, location.search));
  }

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Staff</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session to manage staff records.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canManageStaff) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Staff</CardTitle>
          <CardDescription>
            Staff creation is available in Staff view. You are currently in{" "}
            {activeContext?.label ?? "another"} view.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <Button asChild className="-ml-3" size="sm" variant="ghost">
          <Link to={appendSearch(ERP_ROUTES.STAFF, location.search)}>
            <IconChevronLeft data-icon="inline-start" />
            Back to staff
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Create staff</h1>
        <p className="text-sm text-muted-foreground">
          Add a staff member and assign a primary campus.
        </p>
      </div>

      <Card className="max-w-4xl">
        <CardContent className="pt-6">
          <StaffForm
            campuses={campuses}
            defaultValues={{
              ...DEFAULT_VALUES,
              campusId: session?.activeCampus?.id ?? "",
            }}
            errorMessage={createError?.message}
            isPending={createStaffMutation.isPending}
            onCancel={() => {
              void navigate(appendSearch(ERP_ROUTES.STAFF, location.search));
            }}
            onSubmit={handleSubmit}
            submitLabel="Create staff"
          />
        </CardContent>
      </Card>
    </div>
  );
}
