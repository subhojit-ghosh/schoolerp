import { useEffect, useMemo } from "react";
import { Link, useLocation, useSearchParams } from "react-router";
import {
  IconBook2,
  IconCalendarEvent,
  IconCalendarStats,
  IconClockHour4,
  IconCurrencyRupee,
  IconSpeakerphone,
  IconTimeline,
  IconUsers,
} from "@tabler/icons-react";
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
  EntityPageHeader,
  EntityPageShell,
} from "@/components/entities/entity-page-shell";
import { ERP_ROUTES } from "@/constants/routes";
import {
  getActiveContext,
  isParentContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useFamilyOverviewQuery } from "@/features/family/api/use-family-portal";
import {
  FAMILY_PAGE_COPY,
  FAMILY_QUERY_PARAMS,
} from "@/features/family/model/family.constants";
import type {
  FamilyAnnouncement,
  FamilyCalendarEvent,
  FamilyStudentSummary,
  FamilyTimetable,
} from "@/features/family/model/family.types";
import {
  formatFeeDate,
  formatRupees,
} from "@/features/fees/model/fee-formatters";
import { appendSearch } from "@/lib/routes";
import { cn } from "@repo/ui/lib/utils";

const FAMILY_WORKING_LINKS = [
  {
    href: ERP_ROUTES.FAMILY_CHILDREN,
    icon: IconUsers,
    label: "Children",
  },
  {
    href: ERP_ROUTES.FAMILY_ATTENDANCE,
    icon: IconCalendarStats,
    label: "Attendance",
  },
  {
    href: ERP_ROUTES.FAMILY_TIMETABLE,
    icon: IconTimeline,
    label: "Timetable",
  },
  {
    href: ERP_ROUTES.FAMILY_EXAMS,
    icon: IconBook2,
    label: "Exams",
  },
  {
    href: ERP_ROUTES.FAMILY_FEES,
    icon: IconCurrencyRupee,
    label: "Fees",
  },
  {
    href: ERP_ROUTES.FAMILY_ANNOUNCEMENTS,
    icon: IconSpeakerphone,
    label: "Announcements",
  },
  {
    href: ERP_ROUTES.FAMILY_CALENDAR,
    icon: IconCalendarEvent,
    label: "Calendar",
  },
] as const;

const TIMETABLE_DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

type FamilyPortalView = keyof typeof FAMILY_PAGE_COPY;

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function formatDateTime(dateTime: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateTime));
}

function formatAttendanceStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDayLabel(dayOfWeek: string) {
  return dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
}

function getAttendanceVariant(status: string) {
  switch (status) {
    case "absent":
      return "destructive";
    case "late":
      return "secondary";
    case "excused":
      return "outline";
    default:
      return "default";
  }
}

function buildStudentSearch(studentId: string) {
  const nextSearch = new URLSearchParams();
  nextSearch.set(FAMILY_QUERY_PARAMS.STUDENT_ID, studentId);

  return `?${nextSearch.toString()}`;
}

function groupTimetableEntries(timetable: FamilyTimetable | null) {
  if (!timetable) {
    return [];
  }

  const groups = new Map<string, FamilyTimetable["entries"]>();

  for (const entry of timetable.entries) {
    const rows = groups.get(entry.dayOfWeek) ?? [];
    rows.push(entry);
    groups.set(entry.dayOfWeek, rows);
  }

  return TIMETABLE_DAY_ORDER.flatMap((day) => {
    const rows = groups.get(day);

    if (!rows || rows.length === 0) {
      return [];
    }

    return [{ day, rows }] as const;
  });
}

function SummaryStat({
  description,
  label,
  value,
}: {
  description?: string;
  label: string;
  value: string;
}) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="space-y-1 pb-3">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      {description ? (
        <CardContent className="pt-0 text-sm text-muted-foreground">
          {description}
        </CardContent>
      ) : null}
    </Card>
  );
}

function QuickLinkRow({
  locationSearch,
  selectedStudentId,
}: {
  locationSearch: string;
  selectedStudentId: string | null;
}) {
  if (!selectedStudentId) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {FAMILY_WORKING_LINKS.map((item) => (
        <Button
          key={item.href}
          asChild
          className="h-9 rounded-lg"
          variant="outline"
        >
          <Link to={appendSearch(item.href, locationSearch)}>
            <item.icon className="size-4" />
            {item.label}
          </Link>
        </Button>
      ))}
    </div>
  );
}

function StudentSwitcher({
  currentStudentId,
  students,
}: {
  currentStudentId: string | null;
  students: FamilyStudentSummary[];
}) {
  if (students.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {students.map((summary) => {
        const isActive = summary.student.id === currentStudentId;

        return (
          <Button
            key={summary.student.id}
            asChild
            className={cn(
              "h-9 rounded-lg",
              !isActive && "text-muted-foreground",
            )}
            variant={isActive ? "default" : "outline"}
          >
            <Link to={buildStudentSearch(summary.student.id)}>
              {summary.student.fullName}
            </Link>
          </Button>
        );
      })}
    </div>
  );
}

function ChildrenGrid({ students }: { students: FamilyStudentSummary[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {students.map((summary) => (
        <Card key={summary.student.id} className="border-border/70 shadow-sm">
          <CardHeader className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg">
                  {summary.student.fullName}
                </CardTitle>
                <CardDescription>
                  {summary.student.className} • {summary.student.sectionName}
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono">
                {summary.student.admissionNumber}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2 text-muted-foreground">
              <span>{summary.student.campusName}</span>
              <span>•</span>
              <span>{summary.student.guardians.length} guardian links</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Attendance
                </p>
                <p className="mt-1 font-medium">
                  {summary.attendance.attendancePercent}%
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Outstanding
                </p>
                <p className="mt-1 font-medium">
                  {formatRupees(summary.fees.totalOutstandingInPaise)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Latest Grade
                </p>
                <p className="mt-1 font-medium">
                  {summary.exams.latestTerm?.overallGrade ?? "Not published"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AttendancePanel({ summary }: { summary: FamilyStudentSummary }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryStat
          label="Attendance"
          value={`${summary.attendance.attendancePercent}%`}
          description={`${summary.attendance.present} present of ${summary.attendance.totalMarkedDays} marked days`}
        />
        <SummaryStat label="Absent" value={String(summary.attendance.absent)} />
        <SummaryStat label="Late" value={String(summary.attendance.late)} />
        <SummaryStat
          label="Excused"
          value={String(summary.attendance.excused)}
          description={`Absent streak ${summary.attendance.absentStreak} day(s)`}
        />
      </div>
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Recent attendance</CardTitle>
          <CardDescription>
            Latest marked dates for {summary.student.fullName}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {summary.attendance.recentRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No recent attendance records are available yet.
            </p>
          ) : (
            summary.attendance.recentRecords.map((record) => (
              <div
                key={`${summary.student.id}-${record.date}`}
                className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">
                    {formatDate(record.date)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {summary.student.className} • {summary.student.sectionName}
                  </p>
                </div>
                <Badge variant={getAttendanceVariant(record.status)}>
                  {formatAttendanceStatus(record.status)}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TimetablePanel({ timetable }: { timetable: FamilyTimetable | null }) {
  if (!timetable || timetable.entries.length === 0) {
    return (
      <Card className="border-dashed bg-muted/25">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No timetable entries are available for the selected child yet.
        </CardContent>
      </Card>
    );
  }

  const groupedEntries = groupTimetableEntries(timetable);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {groupedEntries.map((group) => (
        <Card key={group.day} className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>{formatDayLabel(group.day)}</CardTitle>
            <CardDescription>
              {timetable.className} • {timetable.sectionName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {group.rows.map((entry) => (
              <div
                key={entry.id}
                className="rounded-lg border border-border/60 px-3 py-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{entry.subjectName}</p>
                    <p className="text-xs text-muted-foreground">
                      Period {entry.periodIndex}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div className="flex items-center justify-end gap-1">
                      <IconClockHour4 className="size-3.5" />
                      <span>
                        {entry.startTime} - {entry.endTime}
                      </span>
                    </div>
                    {entry.room ? (
                      <p className="mt-1">Room {entry.room}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ExamsPanel({ summary }: { summary: FamilyStudentSummary }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryStat
          label="Latest Grade"
          value={summary.exams.latestTerm?.overallGrade ?? "NA"}
          description={
            summary.exams.latestTerm?.examTermName ?? "No term published yet"
          }
        />
        <SummaryStat
          label="Overall Percent"
          value={
            summary.exams.latestTerm
              ? `${summary.exams.latestTerm.overallPercent}%`
              : "NA"
          }
        />
        <SummaryStat
          label="Subjects"
          value={String(summary.exams.latestTerm?.subjectCount ?? 0)}
          description={
            summary.exams.latestTerm
              ? `${summary.exams.latestTerm.totalObtainedMarks}/${summary.exams.latestTerm.totalMaxMarks} marks`
              : "No marks published"
          }
        />
      </div>
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Recent exam terms</CardTitle>
          <CardDescription>
            Latest published performance summaries for{" "}
            {summary.student.fullName}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {summary.exams.recentTerms.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No exam terms are available yet.
            </p>
          ) : (
            summary.exams.recentTerms.map((term) => (
              <div
                key={term.examTermId}
                className="rounded-lg border border-border/60 px-3 py-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{term.examTermName}</p>
                    <p className="text-xs text-muted-foreground">
                      {term.academicYearName} • Ends {formatDate(term.endDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">{term.overallGrade}</Badge>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {term.overallPercent}% overall
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FeesPanel({ summary }: { summary: FamilyStudentSummary }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryStat
          label="Outstanding"
          value={formatRupees(summary.fees.totalOutstandingInPaise)}
          description={
            summary.fees.nextDueDate
              ? `Next due ${formatFeeDate(summary.fees.nextDueDate)}`
              : "No upcoming due date"
          }
        />
        <SummaryStat
          label="Paid"
          value={formatRupees(summary.fees.totalPaidInPaise)}
          description={`${summary.fees.paymentCount} payment(s) recorded`}
        />
        <SummaryStat
          label="Assignments"
          value={String(summary.fees.assignmentCount)}
          description={`${summary.fees.overdueCount} overdue`}
        />
        <SummaryStat
          label="Adjusted"
          value={formatRupees(summary.fees.totalAdjustedInPaise)}
        />
      </div>
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Recent fee items</CardTitle>
          <CardDescription>
            Latest assignment dues for {summary.student.fullName}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {summary.fees.recentAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No fee assignments are available yet.
            </p>
          ) : (
            summary.fees.recentAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="rounded-lg border border-border/60 px-3 py-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      {assignment.feeStructureName}
                      {assignment.installmentLabel
                        ? ` • ${assignment.installmentLabel}`
                        : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Due {formatFeeDate(assignment.dueDate)}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">
                      {formatRupees(assignment.outstandingAmountInPaise)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Paid {formatRupees(assignment.paidAmountInPaise)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AnnouncementsPanel({
  announcements,
}: {
  announcements: FamilyAnnouncement[];
}) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>Announcements</CardTitle>
        <CardDescription>
          Latest published guardian-visible announcements for the active campus.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {announcements.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No announcements are available yet.
          </p>
        ) : (
          announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="rounded-lg border border-border/60 px-3 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{announcement.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {announcement.campusName ?? "All campuses"} •{" "}
                    {announcement.publishedAt
                      ? formatDateTime(announcement.publishedAt)
                      : formatDateTime(announcement.createdAt)}
                  </p>
                </div>
                <Badge variant="outline">{announcement.audience}</Badge>
              </div>
              {announcement.summary ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  {announcement.summary}
                </p>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function CalendarPanel({ events }: { events: FamilyCalendarEvent[] }) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>Calendar</CardTitle>
        <CardDescription>
          Upcoming active events for the selected campus and institution.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No calendar events are available yet.
          </p>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="rounded-lg border border-border/60 px-3 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(event.eventDate)}
                    {event.startTime && !event.isAllDay
                      ? ` • ${event.startTime}${event.endTime ? ` - ${event.endTime}` : ""}`
                      : ""}
                  </p>
                </div>
                <Badge variant="outline">{event.eventType}</Badge>
              </div>
              {event.description ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  {event.description}
                </p>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function EmptyFamilyState() {
  return (
    <Card className="border-dashed bg-muted/25">
      <CardContent className="py-12 text-center text-sm text-muted-foreground">
        No linked children are visible in this tenant for the current parent
        session yet.
      </CardContent>
    </Card>
  );
}

function OverviewPanels({
  announcements,
  events,
  locationSearch,
  selectedStudentId,
  summary,
}: {
  announcements: FamilyAnnouncement[];
  events: FamilyCalendarEvent[];
  locationSearch: string;
  selectedStudentId: string | null;
  summary: FamilyStudentSummary;
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryStat
          label="Attendance"
          value={`${summary.attendance.attendancePercent}%`}
          description={`${summary.attendance.present} present of ${summary.attendance.totalMarkedDays} marked days`}
        />
        <SummaryStat
          label="Outstanding"
          value={formatRupees(summary.fees.totalOutstandingInPaise)}
          description={
            summary.fees.nextDueDate
              ? `Next due ${formatFeeDate(summary.fees.nextDueDate)}`
              : "No dues scheduled"
          }
        />
        <SummaryStat
          label="Latest Grade"
          value={summary.exams.latestTerm?.overallGrade ?? "NA"}
          description={
            summary.exams.latestTerm?.examTermName ?? "No exam summary yet"
          }
        />
        <SummaryStat
          label="Updates"
          value={String(announcements.length + events.length)}
          description={`${announcements.length} announcements and ${events.length} events`}
        />
      </div>
      <QuickLinkRow
        locationSearch={locationSearch}
        selectedStudentId={selectedStudentId}
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <AnnouncementsPanel announcements={announcements.slice(0, 4)} />
        <CalendarPanel events={events.slice(0, 4)} />
      </div>
    </>
  );
}

export function FamilyPortalPage({ view }: { view: FamilyPortalView }) {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const selectedStudentIdFromSearch =
    searchParams.get(FAMILY_QUERY_PARAMS.STUDENT_ID) ?? undefined;
  const familyOverviewQuery = useFamilyOverviewQuery(
    isParentContext(session),
    selectedStudentIdFromSearch,
  );
  const overview = familyOverviewQuery.data;
  const studentSummaries = useMemo(
    () => overview?.studentSummaries ?? [],
    [overview?.studentSummaries],
  );
  const selectedStudentSummary = useMemo(() => {
    if (!overview?.selectedStudentId) {
      return studentSummaries[0] ?? null;
    }

    return (
      studentSummaries.find(
        (summary) => summary.student.id === overview.selectedStudentId,
      ) ??
      studentSummaries[0] ??
      null
    );
  }, [overview?.selectedStudentId, studentSummaries]);

  useEffect(() => {
    if (
      !overview?.selectedStudentId ||
      searchParams.get(FAMILY_QUERY_PARAMS.STUDENT_ID) ===
        overview.selectedStudentId
    ) {
      return;
    }

    const nextSearch = new URLSearchParams(searchParams);
    nextSearch.set(FAMILY_QUERY_PARAMS.STUDENT_ID, overview.selectedStudentId);
    setSearchParams(nextSearch, { replace: true });
  }, [overview?.selectedStudentId, searchParams, setSearchParams]);

  const pageCopy = FAMILY_PAGE_COPY[view];

  if (activeContext?.key !== "parent") {
    return (
      <EntityPageShell width="full">
        <Card>
          <CardHeader>
            <CardTitle>Parent context required</CardTitle>
            <CardDescription>
              Switch to the parent context to view family information.
            </CardDescription>
          </CardHeader>
        </Card>
      </EntityPageShell>
    );
  }

  if (familyOverviewQuery.isLoading) {
    return (
      <EntityPageShell width="full">
        <Card>
          <CardContent className="py-12 text-sm text-muted-foreground">
            Loading family information...
          </CardContent>
        </Card>
      </EntityPageShell>
    );
  }

  if (familyOverviewQuery.isError) {
    return (
      <EntityPageShell width="full">
        <Card>
          <CardHeader>
            <CardTitle>Family information could not be loaded</CardTitle>
            <CardDescription>
              Refresh the page or switch context again to retry the parent
              portal.
            </CardDescription>
          </CardHeader>
        </Card>
      </EntityPageShell>
    );
  }

  return (
    <EntityPageShell width="full">
      <EntityPageHeader
        actions={
          <StudentSwitcher
            currentStudentId={overview?.selectedStudentId ?? null}
            students={studentSummaries}
          />
        }
        description={pageCopy.description}
        title={pageCopy.title}
      />

      {studentSummaries.length === 0 || !selectedStudentSummary ? (
        <EmptyFamilyState />
      ) : (
        <>
          {(view === "overview" || view === "children") && (
            <>
              <ChildrenGrid students={studentSummaries} />
              <OverviewPanels
                announcements={overview?.announcements ?? []}
                events={overview?.calendarEvents ?? []}
                locationSearch={location.search}
                selectedStudentId={overview?.selectedStudentId ?? null}
                summary={selectedStudentSummary}
              />
            </>
          )}

          {view === "attendance" ? (
            <AttendancePanel summary={selectedStudentSummary} />
          ) : null}

          {view === "timetable" ? (
            <TimetablePanel timetable={overview?.selectedTimetable ?? null} />
          ) : null}

          {view === "exams" ? (
            <ExamsPanel summary={selectedStudentSummary} />
          ) : null}

          {view === "fees" ? (
            <FeesPanel summary={selectedStudentSummary} />
          ) : null}

          {view === "announcements" ? (
            <AnnouncementsPanel announcements={overview?.announcements ?? []} />
          ) : null}

          {view === "calendar" ? (
            <CalendarPanel events={overview?.calendarEvents ?? []} />
          ) : null}
        </>
      )}
    </EntityPageShell>
  );
}
