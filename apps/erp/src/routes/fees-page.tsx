import { useMemo } from "react";
import { toast } from "sonner";
import {
  IconArrowUpRight,
  IconCalendarDue,
  IconCurrencyRupee,
  IconReceiptRupee,
  IconUsers,
} from "@tabler/icons-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import {
  getActiveContext,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useAcademicYearsQuery } from "@/features/academic-years/api/use-academic-years";
import {
  useCreateFeeAssignmentMutation,
  useCreateFeePaymentMutation,
  useCreateFeeStructureMutation,
  useFeeAssignmentsQuery,
  useFeeDuesQuery,
  useFeeStructuresQuery,
} from "@/features/fees/api/use-fees";
import {
  FeeAssignmentForm,
} from "@/features/fees/ui/fee-assignment-form";
import { FeePaymentForm } from "@/features/fees/ui/fee-payment-form";
import { FeeStructureForm } from "@/features/fees/ui/fee-structure-form";
import type {
  FeeAssignmentFormValues,
  FeePaymentFormValues,
  FeeStructureFormValues,
} from "@/features/fees/model/fee-form-schema";
import { useStudentsQuery } from "@/features/students/api/use-students";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

const EMPTY_VALUE = "";

function formatCurrency(amountInPaise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amountInPaise / 100);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function statusVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "paid") {
    return "default";
  }

  if (status === "partial") {
    return "secondary";
  }

  return "outline";
}

export function FeesPage() {
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const institutionId = session?.activeOrganization?.id;
  const canManageFees = isStaffContext(session);
  const managedInstitutionId = canManageFees ? institutionId : undefined;
  const campuses = session?.campuses ?? [];

  const academicYearsQuery = useAcademicYearsQuery(managedInstitutionId);
  const studentsQuery = useStudentsQuery(managedInstitutionId);
  const structuresQuery = useFeeStructuresQuery(managedInstitutionId);
  const assignmentsQuery = useFeeAssignmentsQuery(managedInstitutionId);
  const duesQuery = useFeeDuesQuery(managedInstitutionId);

  const createStructureMutation = useCreateFeeStructureMutation(managedInstitutionId);
  const createAssignmentMutation = useCreateFeeAssignmentMutation(managedInstitutionId);
  const createPaymentMutation = useCreateFeePaymentMutation(managedInstitutionId);
  const academicYears = academicYearsQuery.data?.rows ?? [];

  const academicYearOptions = academicYears.map((academicYear) => ({
    id: academicYear.id,
    name: academicYear.name,
  }));
  const campusOptions = campuses.map((campus) => ({
    id: campus.id,
    name: campus.name,
  }));
  const studentOptions = (studentsQuery.data ?? []).map((student) => ({
    id: student.id,
    label: `${student.admissionNumber} · ${student.fullName}`,
  }));
  const structureOptions = (structuresQuery.data ?? []).map((structure) => ({
    id: structure.id,
    label: `${structure.name} · ${formatCurrency(structure.amountInPaise)}`,
  }));
  const paymentAssignmentOptions = (duesQuery.data ?? []).map((assignment) => ({
    id: assignment.id,
    label: `${assignment.studentFullName} · ${assignment.feeStructureName} · ${formatCurrency(
      assignment.outstandingAmountInPaise,
    )}`,
  }));

  const totalOutstandingAmountInPaise = useMemo(
    () =>
      (duesQuery.data ?? []).reduce(
        (total, assignment) => total + assignment.outstandingAmountInPaise,
        0,
      ),
    [duesQuery.data],
  );

  const feeStructureDefaults: FeeStructureFormValues = {
    academicYearId: academicYearOptions[0]?.id ?? EMPTY_VALUE,
    campusId: session?.activeCampus?.id ?? EMPTY_VALUE,
    name: EMPTY_VALUE,
    description: EMPTY_VALUE,
    scope: "institution",
    amount: EMPTY_VALUE,
    dueDate: today(),
  };

  const feeAssignmentDefaults: FeeAssignmentFormValues = {
    feeStructureId: structureOptions[0]?.id ?? EMPTY_VALUE,
    studentId: studentOptions[0]?.id ?? EMPTY_VALUE,
    amount: EMPTY_VALUE,
    dueDate: today(),
    notes: EMPTY_VALUE,
  };

  const feePaymentDefaults: FeePaymentFormValues = {
    feeAssignmentId: paymentAssignmentOptions[0]?.id ?? EMPTY_VALUE,
    amount: EMPTY_VALUE,
    paymentDate: today(),
    paymentMethod: "cash",
    referenceNumber: EMPTY_VALUE,
    notes: EMPTY_VALUE,
  };

  async function handleCreateStructure(values: FeeStructureFormValues) {
    if (!institutionId) {
      return;
    }

    await createStructureMutation.mutateAsync({
      body: {
        ...values,
        amount: Number(values.amount),
      },
    });

    toast.success(ERP_TOAST_MESSAGES.created(ERP_TOAST_SUBJECTS.FEE_STRUCTURE));
  }

  async function handleCreateAssignment(values: FeeAssignmentFormValues) {
    if (!institutionId) {
      return;
    }

    await createAssignmentMutation.mutateAsync({
      body: {
        ...values,
        amount: Number(values.amount),
      },
    });

    toast.success(
      ERP_TOAST_MESSAGES.assignedTo(ERP_TOAST_SUBJECTS.FEE, "student"),
    );
  }

  async function handleCreatePayment(values: FeePaymentFormValues) {
    if (!institutionId) {
      return;
    }

    await createPaymentMutation.mutateAsync({
      body: {
        ...values,
        amount: Number(values.amount),
      },
    });

    toast.success(ERP_TOAST_MESSAGES.recorded(ERP_TOAST_SUBJECTS.PAYMENT));
  }

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fees</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session to manage fees.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canManageFees) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fees</CardTitle>
          <CardDescription>
            Fee administration is available in Staff view. You are currently in{" "}
            {activeContext?.label ?? "another"} view.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <IconReceiptRupee />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Structures
              </p>
              <p className="text-2xl font-semibold">{structuresQuery.data?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <IconUsers />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Assignments
              </p>
              <p className="text-2xl font-semibold">{assignmentsQuery.data?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <IconCalendarDue />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Open dues
              </p>
              <p className="text-2xl font-semibold">{duesQuery.data?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <IconCurrencyRupee />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Outstanding
              </p>
              <p className="text-2xl font-semibold">
                {formatCurrency(totalOutstandingAmountInPaise)}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Create fee structure</CardTitle>
            <CardDescription>
              Define a reusable structure for an academic year and optional campus.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FeeStructureForm
              academicYears={academicYearOptions}
              campuses={campusOptions}
              defaultValues={feeStructureDefaults}
              errorMessage={(createStructureMutation.error as Error | null)?.message}
              isPending={createStructureMutation.isPending}
              onSubmit={handleCreateStructure}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assign fee to student</CardTitle>
            <CardDescription>
              Create one student-level assignment against an existing structure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FeeAssignmentForm
              defaultValues={feeAssignmentDefaults}
              errorMessage={(createAssignmentMutation.error as Error | null)?.message}
              isPending={createAssignmentMutation.isPending}
              onSubmit={handleCreateAssignment}
              structures={structureOptions}
              students={studentOptions}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Record payment</CardTitle>
            <CardDescription>
              Apply a payment to any assignment that still has an outstanding balance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FeePaymentForm
              assignments={paymentAssignmentOptions}
              defaultValues={feePaymentDefaults}
              errorMessage={(createPaymentMutation.error as Error | null)?.message}
              isPending={createPaymentMutation.isPending}
              onSubmit={handleCreatePayment}
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Assignments</CardTitle>
            <CardDescription>
              Active student assignments with collected and outstanding amounts.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {assignmentsQuery.isLoading ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Loading assignments...
              </p>
            ) : assignmentsQuery.data?.length ? (
              assignmentsQuery.data.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex flex-wrap items-start justify-between gap-4 rounded-xl border p-4"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{assignment.studentFullName}</p>
                      <Badge variant={statusVariant(assignment.status)}>
                        {assignment.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {assignment.studentAdmissionNumber} · {assignment.feeStructureName}
                      {assignment.campusName ? ` · ${assignment.campusName}` : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Due {assignment.dueDate} · {assignment.paymentCount} payment
                      {assignment.paymentCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex min-w-[220px] flex-col items-start gap-1 text-sm sm:items-end">
                    <p>Assigned: {formatCurrency(assignment.assignedAmountInPaise)}</p>
                    <p>Paid: {formatCurrency(assignment.paidAmountInPaise)}</p>
                    <p className="font-medium text-foreground">
                      Outstanding: {formatCurrency(assignment.outstandingAmountInPaise)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
                No fee assignments yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Basic dues list</CardTitle>
            <CardDescription>
              Outstanding student balances ordered by upcoming due date.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {duesQuery.isLoading ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Loading dues...
              </p>
            ) : duesQuery.data?.length ? (
              duesQuery.data.map((assignment) => (
                <div
                  key={assignment.id}
                  className="rounded-xl border p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <p className="font-medium">{assignment.studentFullName}</p>
                      <p className="text-sm text-muted-foreground">
                        {assignment.feeStructureName}
                      </p>
                    </div>
                    <Badge variant="outline">{assignment.dueDate}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">Outstanding</span>
                    <span className="font-medium">
                      {formatCurrency(assignment.outstandingAmountInPaise)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-sm text-muted-foreground">
                    <span>{assignment.studentAdmissionNumber}</span>
                    <span className="inline-flex items-center gap-1">
                      <IconArrowUpRight className="size-4" />
                      {assignment.paymentCount} payment
                      {assignment.paymentCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
                No outstanding dues right now.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
