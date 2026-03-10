"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/page-shell";
import { CreateAcademicYearForm } from "@/components/org/create-academic-year-form";
import { AcademicYearActions } from "@/components/org/academic-year-actions";
import { STATUS } from "@/constants";
import type { AcademicYearRow } from "@/server/academic-years/queries";

type SettingsContentProps = {
  academicYears: AcademicYearRow[];
  canManage: boolean;
};

export function SettingsContent({ academicYears, canManage }: SettingsContentProps) {
  return (
    <PageShell title="Settings">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Academic Years</CardTitle>
            <CardDescription>
              Create academic years, choose the current year, and archive completed cycles.
            </CardDescription>
          </CardHeader>
          {canManage ? (
            <CardContent>
              <CreateAcademicYearForm />
            </CardContent>
          ) : null}
        </Card>

        <div className="grid gap-4">
          {academicYears.map((academicYear) => (
            <Card key={academicYear.id}>
              <CardHeader>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle>{academicYear.name}</CardTitle>
                      {academicYear.isCurrent ? <Badge>Current</Badge> : null}
                      <Badge
                        variant={
                          academicYear.status === STATUS.ACADEMIC_YEAR.ACTIVE
                            ? "outline"
                            : "secondary"
                        }
                      >
                        {academicYear.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      {academicYear.startDate} to {academicYear.endDate}
                    </CardDescription>
                  </div>
                  <AcademicYearActions
                    academicYearId={academicYear.id}
                    isCurrent={academicYear.isCurrent}
                    status={academicYear.status}
                    canManage={canManage}
                  />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
