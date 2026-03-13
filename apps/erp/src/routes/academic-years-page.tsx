import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@repo/ui/components/ui/badge";
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
  useAcademicYearQuery,
  useAcademicYearsQuery,
  useCreateAcademicYearMutation,
  useUpdateAcademicYearMutation,
} from "@/features/academic-years/api/use-academic-years";
import {
  ACADEMIC_YEAR_FORM_DEFAULT_VALUES,
  type AcademicYearFormValues,
} from "@/features/academic-years/model/academic-year-form-schema";
import { AcademicYearForm } from "@/features/academic-years/ui/academic-year-form";

export function AcademicYearsPage() {
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<
    string | null
  >(null);
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const institutionId = session?.activeOrganization?.id;
  const canManageAcademicYears = isStaffContext(session);
  const managedInstitutionId = canManageAcademicYears ? institutionId : undefined;
  const academicYearsQuery = useAcademicYearsQuery(managedInstitutionId);
  const academicYearQuery = useAcademicYearQuery(
    managedInstitutionId,
    selectedAcademicYearId ?? undefined,
  );
  const createAcademicYearMutation =
    useCreateAcademicYearMutation(managedInstitutionId);
  const updateAcademicYearMutation =
    useUpdateAcademicYearMutation(managedInstitutionId);
  const createError = createAcademicYearMutation.error as Error | null | undefined;
  const updateError = updateAcademicYearMutation.error as Error | null | undefined;

  useEffect(() => {
    if (!selectedAcademicYearId) {
      return;
    }

    const hasSelectedYear = (academicYearsQuery.data ?? []).some(
      (academicYear) => academicYear.id === selectedAcademicYearId,
    );

    if (!hasSelectedYear) {
      setSelectedAcademicYearId(null);
    }
  }, [academicYearsQuery.data, selectedAcademicYearId]);

  async function handleCreateAcademicYear(values: AcademicYearFormValues) {
    if (!institutionId) {
      return;
    }

    const createdAcademicYear = await createAcademicYearMutation.mutateAsync({
      params: {
        path: {
          institutionId,
        },
      },
      body: values,
    });

    setSelectedAcademicYearId(createdAcademicYear.id);
    toast.success("Academic year created.");
  }

  async function handleUpdateAcademicYear(values: AcademicYearFormValues) {
    if (!institutionId || !selectedAcademicYearId) {
      return;
    }

    await updateAcademicYearMutation.mutateAsync({
      params: {
        path: {
          institutionId,
          academicYearId: selectedAcademicYearId,
        },
      },
      body: values,
    });

    toast.success("Academic year updated.");
  }

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Academic years</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session to manage academic years.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canManageAcademicYears) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Academic years</CardTitle>
          <CardDescription>
            Academic-year administration is available in Staff view. You are
            currently in {activeContext?.label ?? "another"} view.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const selectedAcademicYear = academicYearQuery.data;
  const isEditing = Boolean(selectedAcademicYearId);
  const formDefaultValues = selectedAcademicYear
    ? {
        name: selectedAcademicYear.name,
        startDate: selectedAcademicYear.startDate,
        endDate: selectedAcademicYear.endDate,
        isCurrent: selectedAcademicYear.isCurrent,
      }
    : ACADEMIC_YEAR_FORM_DEFAULT_VALUES;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Academic years</CardTitle>
              <CardDescription>
                List existing academic years and keep one current year configured
                from a single edit flow.
              </CardDescription>
            </div>
            <Button
              onClick={() => setSelectedAcademicYearId(null)}
              type="button"
              variant={isEditing ? "outline" : "default"}
            >
              New academic year
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {academicYearsQuery.isLoading ? (
            <div className="rounded-md border border-dashed px-4 py-8 text-sm text-muted-foreground">
              Loading academic years...
            </div>
          ) : academicYearsQuery.data?.length ? (
            academicYearsQuery.data.map((academicYear) => {
              const isSelected = academicYear.id === selectedAcademicYearId;

              return (
                <button
                  className="flex w-full items-center justify-between rounded-md border px-4 py-3 text-left"
                  key={academicYear.id}
                  onClick={() => setSelectedAcademicYearId(academicYear.id)}
                  type="button"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{academicYear.name}</span>
                      {academicYear.isCurrent ? <Badge>Current</Badge> : null}
                      <Badge variant="outline">{academicYear.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {academicYear.startDate} to {academicYear.endDate}
                    </p>
                  </div>
                  <Badge variant={isSelected ? "default" : "secondary"}>
                    {isSelected ? "Editing" : "Edit"}
                  </Badge>
                </button>
              );
            })
          ) : (
            <div className="rounded-md border border-dashed px-4 py-8 text-sm text-muted-foreground">
              No academic years yet. Create the first one to establish the
              institution timeline.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {isEditing ? "Edit academic year" : "Create academic year"}
          </CardTitle>
          <CardDescription>
            {isEditing
              ? "Update the selected academic year. The backend keeps the current-year rule authoritative."
              : "Create a new academic year for this institution."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing && academicYearQuery.isLoading ? (
            <div className="rounded-md border border-dashed px-4 py-8 text-sm text-muted-foreground">
              Loading academic year details...
            </div>
          ) : (
            <AcademicYearForm
              defaultValues={formDefaultValues}
              errorMessage={isEditing ? updateError?.message : createError?.message}
              isPending={
                isEditing
                  ? updateAcademicYearMutation.isPending
                  : createAcademicYearMutation.isPending
              }
              onCancel={
                isEditing ? () => setSelectedAcademicYearId(null) : undefined
              }
              onSubmit={
                isEditing ? handleUpdateAcademicYear : handleCreateAcademicYear
              }
              submitLabel={isEditing ? "Save changes" : "Create academic year"}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
