import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { extractApiError } from "@/lib/api-error";
import {
  IconBook2,
  IconCheck,
  IconLayoutDashboard,
  IconSchool,
} from "@tabler/icons-react";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  useCreateAcademicYearMutation,
} from "@/features/academic-years/api/use-academic-years";
import {
  ACADEMIC_YEAR_FORM_DEFAULT_VALUES,
  type AcademicYearFormValues,
} from "@/features/academic-years/model/academic-year-form-schema";
import { AcademicYearForm } from "@/features/academic-years/ui/academic-year-form";
import { useCreateClassMutation } from "@/features/classes/api/use-classes";
import type { ClassFormValues } from "@/features/classes/model/class-form-schema";
import { ClassForm } from "@/features/classes/ui/class-form";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { ERP_ROUTES } from "@/constants/routes";

const DEFAULT_CLASS_FORM_VALUES: ClassFormValues = {
  name: "",
  sections: [{ name: "A" }],
};

type WizardStep = "academic-year" | "first-class" | "done";

const STEPS: { key: WizardStep; label: string; icon: typeof IconBook2 }[] = [
  { key: "academic-year", label: "Academic Year", icon: IconBook2 },
  { key: "first-class", label: "First Class", icon: IconSchool },
];

function StepIndicator({ current }: { current: WizardStep }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  if (current === "done") {
    return null;
  }

  return (
    <div className="flex items-center gap-2 mb-6">
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;

        return (
          <div key={step.key} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={[
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all",
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                ].join(" ")}
              >
                {isCompleted ? <IconCheck className="size-3.5" /> : index + 1}
              </div>
              <span
                className={[
                  "text-sm",
                  isActive
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground",
                ].join(" ")}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 ? (
              <div
                className={[
                  "h-px w-8 flex-shrink-0",
                  isCompleted ? "bg-primary" : "bg-border",
                ].join(" ")}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function SetupWizardPage() {
  useDocumentTitle("Setup");
  const navigate = useNavigate();
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const orgName = session?.activeOrganization?.name ?? "your school";

  const [step, setStep] = useState<WizardStep>("academic-year");

  const createAcademicYearMutation =
    useCreateAcademicYearMutation(institutionId);
  const createClassMutation = useCreateClassMutation();

  async function handleAcademicYearSubmit(values: AcademicYearFormValues) {
    try {
      await createAcademicYearMutation.mutateAsync({ body: values });
      toast.success("Academic year created");
      setStep("first-class");
    } catch (error) {
      toast.error(extractApiError(error, "Could not create academic year. Please try again."));
    }
  }

  async function handleClassSubmit(values: ClassFormValues) {
    try {
      await createClassMutation.mutateAsync({ body: values });
      toast.success("Class created");
      setStep("done");
    } catch (error) {
      toast.error(extractApiError(error, "Could not create class. Please try again."));
    }
  }

  function goToDashboard() {
    void navigate(ERP_ROUTES.DASHBOARD);
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl text-primary-foreground text-xl font-bold"
            style={{ background: "var(--primary)" }}
          >
            {orgName.charAt(0).toUpperCase()}
          </div>
          <h1
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {step === "done" ? "You're all set!" : "Set up " + orgName}
          </h1>
          {step !== "done" ? (
            <p className="mt-1.5 text-sm text-muted-foreground">
              Let's get the basics in place before you start using the ERP.
            </p>
          ) : null}
        </div>

        <StepIndicator current={step} />

        {step === "academic-year" ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div
                  className="flex size-9 items-center justify-center rounded-lg"
                  style={{
                    background:
                      "color-mix(in srgb, var(--primary) 12%, transparent)",
                  }}
                >
                  <IconBook2
                    className="size-5"
                    style={{ color: "var(--primary)" }}
                  />
                </div>
                <div>
                  <CardTitle>Create an academic year</CardTitle>
                  <CardDescription>
                    The academic year is the foundation for classes, attendance,
                    fees, and exams.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AcademicYearForm
                defaultValues={{
                  ...ACADEMIC_YEAR_FORM_DEFAULT_VALUES,
                  isCurrent: true,
                }}
                errorMessage={
                  (
                    createAcademicYearMutation.error as
                      | Error
                      | null
                      | undefined
                  )?.message
                }
                isPending={createAcademicYearMutation.isPending}
                onSubmit={handleAcademicYearSubmit}
                submitLabel="Create academic year"
              />
              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => setStep("first-class")}
                  type="button"
                >
                  Skip for now
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {step === "first-class" ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div
                  className="flex size-9 items-center justify-center rounded-lg"
                  style={{
                    background:
                      "color-mix(in srgb, var(--primary) 12%, transparent)",
                  }}
                >
                  <IconSchool
                    className="size-5"
                    style={{ color: "var(--primary)" }}
                  />
                </div>
                <div>
                  <CardTitle>Create your first class</CardTitle>
                  <CardDescription>
                    Classes group students by grade or level. Sections let you
                    split a class into smaller groups.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ClassForm
                defaultValues={DEFAULT_CLASS_FORM_VALUES}
                errorMessage={
                  (createClassMutation.error as Error | null | undefined)
                    ?.message
                }
                isPending={createClassMutation.isPending}
                onSubmit={handleClassSubmit}
                submitLabel="Create class"
              />
              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => setStep("done")}
                  type="button"
                >
                  Skip for now
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {step === "done" ? (
          <Card>
            <CardContent className="py-10 flex flex-col items-center text-center gap-6">
              <div
                className="flex size-16 items-center justify-center rounded-full"
                style={{
                  background:
                    "color-mix(in srgb, var(--primary) 12%, transparent)",
                }}
              >
                <IconCheck
                  className="size-8"
                  style={{ color: "var(--primary)" }}
                />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">
                  Setup complete
                </h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                  You can now start adding students, recording attendance, setting
                  up fees, and running exams. Visit Settings anytime to configure
                  branding and delivery.
                </p>
              </div>
              <Button
                className="h-11 px-8 rounded-xl"
                onClick={goToDashboard}
                style={{ background: "var(--primary)" }}
              >
                <IconLayoutDashboard className="mr-2 size-4" />
                Go to dashboard
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {/* Skip entire wizard */}
        {step !== "done" ? (
          <div className="mt-6 text-center">
            <button
              className="text-xs text-muted-foreground/70 hover:text-muted-foreground underline-offset-2 hover:underline"
              onClick={goToDashboard}
              type="button"
            >
              Skip setup, go to dashboard
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
