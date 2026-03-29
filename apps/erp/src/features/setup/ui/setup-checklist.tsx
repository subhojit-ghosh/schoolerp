import { Link } from "react-router";
import {
  IconBook2,
  IconBooks,
  IconCheck,
  IconCurrencyRupee,
  IconSchool,
  IconUsers,
  IconUsersGroup,
  type Icon,
} from "@tabler/icons-react";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { ERP_ROUTES } from "@/constants/routes";
import type { SetupStatus } from "../api/use-setup-status";

type ChecklistItem = {
  key: string;
  label: string;
  description: string;
  icon: Icon;
  href: string;
  actionLabel: string;
  isDone: (status: SetupStatus) => boolean;
};

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    key: "academic-year",
    label: "Create an academic year",
    description: "Foundation for classes, attendance, fees, and exams",
    icon: IconBook2,
    href: ERP_ROUTES.ACADEMIC_YEARS,
    actionLabel: "Academic Years",
    isDone: (s) => s.academicYears > 0,
  },
  {
    key: "classes",
    label: "Add classes and sections",
    description: "Define grade levels and section groups",
    icon: IconSchool,
    href: ERP_ROUTES.CLASSES,
    actionLabel: "Classes",
    isDone: (s) => s.classes > 0,
  },
  {
    key: "subjects",
    label: "Set up subjects",
    description: "Create the subjects taught at your school",
    icon: IconBooks,
    href: ERP_ROUTES.SUBJECTS,
    actionLabel: "Subjects",
    isDone: (s) => s.subjects > 0,
  },
  {
    key: "staff",
    label: "Add staff members",
    description: "Register teachers and administrative staff",
    icon: IconUsersGroup,
    href: ERP_ROUTES.STAFF,
    actionLabel: "Staff",
    isDone: (s) => s.staff > 1, // > 1 because the admin who signed up counts as 1
  },
  {
    key: "students",
    label: "Enrol students",
    description: "Add student records with class and section",
    icon: IconUsers,
    href: ERP_ROUTES.STUDENTS,
    actionLabel: "Students",
    isDone: (s) => s.students > 0,
  },
  {
    key: "fees",
    label: "Configure fee structures",
    description: "Set up tuition and other fee structures",
    icon: IconCurrencyRupee,
    href: ERP_ROUTES.FEE_STRUCTURES,
    actionLabel: "Fee Structures",
    isDone: (s) => s.feeStructures > 0,
  },
];

type SetupChecklistProps = {
  status: SetupStatus;
  onDismiss: () => void;
};

export function SetupChecklist({ status, onDismiss }: SetupChecklistProps) {
  const completedCount = CHECKLIST_ITEMS.filter((item) =>
    item.isDone(status),
  ).length;
  const totalCount = CHECKLIST_ITEMS.length;
  const allDone = completedCount === totalCount;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  if (allDone) {
    return null;
  }

  return (
    <Card className="relative overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: "var(--primary)" }}
      />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Setup checklist</CardTitle>
            <CardDescription className="mt-0.5">
              {completedCount} of {totalCount} steps complete
            </CardDescription>
          </div>
          <button
            className="text-xs text-muted-foreground/60 hover:text-muted-foreground underline-offset-2 hover:underline"
            onClick={onDismiss}
            type="button"
          >
            Dismiss
          </button>
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPercent}%`,
              background: "var(--primary)",
            }}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-1">
          {CHECKLIST_ITEMS.map((item) => {
            const done = item.isDone(status);
            const Icon = item.icon;

            return (
              <li key={item.key}>
                <div className="flex items-center gap-3 rounded-lg px-2 py-2">
                  <div
                    className="flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors"
                    style={
                      done
                        ? {
                            background: "var(--primary)",
                            borderColor: "var(--primary)",
                          }
                        : {
                            borderColor:
                              "color-mix(in srgb, var(--primary) 30%, transparent)",
                          }
                    }
                  >
                    {done ? (
                      <IconCheck className="size-3.5 text-primary-foreground" />
                    ) : (
                      <Icon
                        className="size-3.5"
                        style={{ color: "var(--primary)" }}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={[
                        "text-sm font-medium",
                        done
                          ? "text-muted-foreground line-through"
                          : "text-foreground",
                      ].join(" ")}
                    >
                      {item.label}
                    </p>
                    {!done ? (
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                  {!done ? (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-7 shrink-0 rounded-md text-xs"
                    >
                      <Link to={item.href}>{item.actionLabel}</Link>
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
