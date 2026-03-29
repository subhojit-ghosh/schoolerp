import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { extractApiError } from "@/lib/api-error";
import { RouteEntitySheet } from "@/components/entities/route-entity-sheet";
import { ERP_ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useCreateAllocationMutation,
  useRoomsQuery,
} from "@/features/hostel/api/use-hostel";
import { useStudentOptionsQuery } from "@/features/students/api/use-students";
import {
  ALLOCATION_DEFAULT_VALUES,
  type AllocationFormValues,
} from "@/features/hostel/model/allocation-form-schema";
import { AllocationForm } from "@/features/hostel/ui/allocation-form";
import { appendSearch } from "@/lib/routes";

export function HostelAllocationSheetRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const isEnabled = Boolean(institutionId);

  const roomsQuery = useRoomsQuery(isEnabled, { limit: 200, status: "active" });
  const studentsQuery = useStudentOptionsQuery(institutionId);
  const createMutation = useCreateAllocationMutation();

  const closeTo = useMemo(
    () => appendSearch(ERP_ROUTES.HOSTEL_ALLOCATIONS, location.search),
    [location.search],
  );

  const roomsData = roomsQuery.data;
  const roomOptions = useMemo(() => roomsData?.rows ?? [], [roomsData?.rows]);

  const studentsData = studentsQuery.data;
  const studentOptions = useMemo(
    () => (studentsData ?? []).map((s) => ({ id: s.id, name: s.fullName })),
    [studentsData],
  );

  const isPending = createMutation.isPending;
  const errorMessage =
    (createMutation.error as Error | null | undefined)?.message ?? undefined;

  async function handleSubmit(values: AllocationFormValues) {
    try {
      await createMutation.mutateAsync({
        body: {
          roomId: values.roomId,
          studentId: values.studentId,
          bedNumber: values.bedNumber,
          startDate: values.startDate,
        },
      });
      toast.success("Bed allocation created.");
      void navigate(closeTo);
    } catch (error) {
      toast.error(
        extractApiError(
          error,
          "Could not create bed allocation. Please try again.",
        ),
      );
    }
  }

  return (
    <RouteEntitySheet
      closeTo={closeTo}
      description="Assign a student to a hostel bed."
      title="New Allocation"
    >
      <AllocationForm
        rooms={roomOptions}
        students={studentOptions}
        defaultValues={ALLOCATION_DEFAULT_VALUES}
        errorMessage={errorMessage}
        isPending={isPending}
        submitLabel="Create allocation"
        onCancel={() => void navigate(closeTo)}
        onSubmit={handleSubmit}
      />
    </RouteEntitySheet>
  );
}
