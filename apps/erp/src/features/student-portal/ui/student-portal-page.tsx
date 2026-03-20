import { useEffect } from "react";
import { AUTH_CONTEXT_KEYS } from "@repo/contracts";
import { Link, useLocation, useSearchParams } from "react-router";
import {
  IconBook2,
  IconCalendarEvent,
  IconCalendarStats,
  IconClockHour4,
  IconChartBar,
  IconSpeakerphone,
  IconTimeline,
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
  isStudentContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useStudentPortalOverviewQuery } from "@/features/student-portal/api/use-student-portal";
import {
  STUDENT_PORTAL_PAGE_COPY,
  STUDENT_PORTAL_QUERY_PARAMS,
} from "@/features/student-portal/model/student-portal.constants";
import type {
  StudentPortalAnnouncement,
  StudentPortalCalendarEvent,
  StudentPortalReportCard,
  StudentPortalStudentSummary,
  StudentPortalTimetable,
} from "@/features/student-portal/model/student-portal.types";
import { appendSearch } from "@/lib/routes";

const STUDENT_WORKING_LINKS = [
  {
    href: ERP_ROUTES.STUDENT_TIMETABLE,
    icon: IconTimeline,
    label: "Timetable",
  },
  {
    href: ERP_ROUTES.STUDENT_ATTENDANCE,
    icon: IconCalendarStats,
    label: "Attendance",
  },
  {
    href: ERP_ROUTES.STUDENT_EXAMS,
    icon: IconBook2,
    label: "Exams",
  },
  {
    href: ERP_ROUTES.STUDENT_RESULTS,
    icon: IconChartBar,
    label: "Results",
  },
  {
    href: ERP_ROUTES.STUDENT_ANNOUNCEMENTS,
    icon: IconSpeakerphone,
    label: "Announcements",
  },
  {
    href: ERP_ROUTES.STUDENT_CALENDAR,
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

type StudentPortalView = keyof typeof STUDENT_PORTAL_PAGE_COPY;

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

function QuickLinkRow({ locationSearch }: { locationSearch: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {STUDENT_WORKING_LINKS.map((item) => (
        <Button key={item.href} asChild className="h-9 rounded-lg" variant="outline">
          <Link to={appendSearch(item.href, locationSearch)}>
            <item.icon className="size-4" />
            {item.label}
          </Link>
        </Button>
      ))}
    </div>
  );
}

function groupTimetableEntries(timetable: StudentPortalTimetable | null) {
  if (!timetable) {
    return [];
  }

  const groups = new Map<string, StudentPortalTimetable["entries"]>();

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

function AttendancePanel({ summary }: { summary: StudentPortalStudentSummary }) {
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
                  <p className="text-sm font-medium">{formatDate(record.date)}</p>
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

function TimetablePanel({ timetable }: { timetable: StudentPortalTimetable | null }) {
  if (!timetable || timetable.entries.length === 0) {
    return (
      <Card className="border-dashed bg-muted/25">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No timetable entries are available for your current class yet.
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
                    {entry.room ? <p className="mt-1">Room {entry.room}</p> : null}
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

function ExamsPanel({ summary }: { summary: StudentPortalStudentSummary }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryStat
          label="Latest Grade"
          value={summary.exams.latestTerm?.overallGrade ?? "NA"}
          description={summary.exams.latestTerm?.examTermName ?? "No term published yet"}
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
            Latest published performance summaries for {summary.student.fullName}.
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

function ResultsPanel({
  reportCard,
  selectedTermId,
  summary,
}: {
  reportCard: StudentPortalReportCard | null;
  selectedTermId: string | null;
  summary: StudentPortalStudentSummary;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {summary.exams.recentTerms.map((term) => {
          const isActive = term.examTermId === selectedTermId;
          const nextSearch = new URLSearchParams();
          nextSearch.set(STUDENT_PORTAL_QUERY_PARAMS.EXAM_TERM_ID, term.examTermId);

          return (
            <Button
              key={term.examTermId}
              asChild
              className="h-9 rounded-lg"
              variant={isActive ? "default" : "outline"}
            >
              <Link to={`?${nextSearch.toString()}`}>{term.examTermName}</Link>
            </Button>
          );
        })}
      </div>

      {!reportCard ? (
        <Card className="border-dashed bg-muted/25">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No report card is available for the selected exam term yet.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryStat
              label="Overall Grade"
              value={reportCard.summary.overallGrade}
              description={reportCard.examTermName}
            />
            <SummaryStat
              label="Overall Percent"
              value={`${reportCard.summary.overallPercent}%`}
            />
            <SummaryStat
              label="Total Marks"
              value={`${reportCard.summary.totalObtainedMarks}/${reportCard.summary.totalMaxMarks}`}
            />
            <SummaryStat
              label="Subjects"
              value={String(reportCard.subjects.length)}
              description={reportCard.academicYearName}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle>Subject-wise marks</CardTitle>
                <CardDescription>
                  {reportCard.studentFullName} • {reportCard.examTermName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {reportCard.subjects.map((subject) => (
                  <div
                    key={`${reportCard.examTermId}-${subject.subjectName}`}
                    className="rounded-lg border border-border/60 px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{subject.subjectName}</p>
                        <p className="text-xs text-muted-foreground">
                          {subject.obtainedMarks}/{subject.maxMarks} marks
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">{subject.grade}</Badge>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {subject.percent}%
                        </p>
                      </div>
                    </div>
                    {subject.remarks ? (
                      <p className="mt-3 text-sm text-muted-foreground">
                        {subject.remarks}
                      </p>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle>Grading scheme</CardTitle>
                <CardDescription>
                  Grade bands used for the published result.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {reportCard.gradingScheme.map((grade) => (
                  <div
                    key={grade.grade}
                    className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{grade.grade}</p>
                      <p className="text-xs text-muted-foreground">{grade.label}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {grade.minPercent}% and above
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function AnnouncementsPanel({
  announcements,
}: {
  announcements: StudentPortalAnnouncement[];
}) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>Announcements</CardTitle>
        <CardDescription>
          Latest published student-visible announcements for the active campus.
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
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  {announcement.body}
                </p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function CalendarPanel({ events }: { events: StudentPortalCalendarEvent[] }) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>Calendar</CardTitle>
        <CardDescription>
          Upcoming active events for your selected campus and institution.
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

function OverviewPanels({
  announcements,
  events,
  locationSearch,
  reportCard,
  summary,
}: {
  announcements: StudentPortalAnnouncement[];
  events: StudentPortalCalendarEvent[];
  locationSearch: string;
  reportCard: StudentPortalReportCard | null;
  summary: StudentPortalStudentSummary;
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
          label="Latest Grade"
          value={summary.exams.latestTerm?.overallGrade ?? "NA"}
          description={summary.exams.latestTerm?.examTermName ?? "No exam summary yet"}
        />
        <SummaryStat
          label="Current Class"
          value={`${summary.student.className} • ${summary.student.sectionName}`}
          description={summary.student.campusName}
        />
        <SummaryStat
          label="Result Snapshot"
          value={reportCard?.summary.overallGrade ?? "NA"}
          description={
            reportCard
              ? `${reportCard.summary.totalObtainedMarks}/${reportCard.summary.totalMaxMarks} marks`
              : "No published report card"
          }
        />
      </div>
      <QuickLinkRow locationSearch={locationSearch} />
      <div className="grid gap-4 xl:grid-cols-2">
        <AnnouncementsPanel announcements={announcements.slice(0, 4)} />
        <CalendarPanel events={events.slice(0, 4)} />
      </div>
    </>
  );
}

export function StudentPortalPage({ view }: { view: StudentPortalView }) {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const selectedExamTermId =
    searchParams.get(STUDENT_PORTAL_QUERY_PARAMS.EXAM_TERM_ID) ?? undefined;
  const overviewQuery = useStudentPortalOverviewQuery(
    isStudentContext(session),
    selectedExamTermId,
  );
  const overview = overviewQuery.data;
  const pageCopy = STUDENT_PORTAL_PAGE_COPY[view];

  useEffect(() => {
    if (
      !overview?.selectedReportCardTermId ||
      searchParams.get(STUDENT_PORTAL_QUERY_PARAMS.EXAM_TERM_ID) ===
        overview.selectedReportCardTermId
    ) {
      return;
    }

    const nextSearch = new URLSearchParams(searchParams);
    nextSearch.set(
      STUDENT_PORTAL_QUERY_PARAMS.EXAM_TERM_ID,
      overview.selectedReportCardTermId,
    );
    setSearchParams(nextSearch, { replace: true });
  }, [overview?.selectedReportCardTermId, searchParams, setSearchParams]);

  if (activeContext?.key !== AUTH_CONTEXT_KEYS.STUDENT) {
    return (
      <EntityPageShell width="full">
        <Card>
          <CardHeader>
            <CardTitle>Student context required</CardTitle>
            <CardDescription>
              Switch to the student context to view your student portal.
            </CardDescription>
          </CardHeader>
        </Card>
      </EntityPageShell>
    );
  }

  if (overviewQuery.isLoading) {
    return (
      <EntityPageShell width="full">
        <Card>
          <CardContent className="py-12 text-sm text-muted-foreground">
            Loading student information...
          </CardContent>
        </Card>
      </EntityPageShell>
    );
  }

  if (overviewQuery.isError || !overview) {
    return (
      <EntityPageShell width="full">
        <Card>
          <CardHeader>
            <CardTitle>Student information could not be loaded</CardTitle>
            <CardDescription>
              Refresh the page or switch context again to retry the student portal.
            </CardDescription>
          </CardHeader>
        </Card>
      </EntityPageShell>
    );
  }

  return (
    <EntityPageShell width="full">
      <EntityPageHeader
        actions={<QuickLinkRow locationSearch={location.search} />}
        description={pageCopy.description}
        title={pageCopy.title}
      />

      {view === "overview" ? (
        <OverviewPanels
          announcements={overview.announcements}
          events={overview.calendarEvents}
          locationSearch={location.search}
          reportCard={overview.selectedReportCard ?? null}
          summary={overview.studentSummary}
        />
      ) : null}

      {view === "attendance" ? (
        <AttendancePanel summary={overview.studentSummary} />
      ) : null}

      {view === "timetable" ? (
        <TimetablePanel timetable={overview.timetable ?? null} />
      ) : null}

      {view === "exams" ? (
        <ExamsPanel summary={overview.studentSummary} />
      ) : null}

      {view === "results" ? (
        <ResultsPanel
          reportCard={overview.selectedReportCard ?? null}
          selectedTermId={overview.selectedReportCardTermId ?? null}
          summary={overview.studentSummary}
        />
      ) : null}

      {view === "announcements" ? (
        <AnnouncementsPanel announcements={overview.announcements} />
      ) : null}

      {view === "calendar" ? (
        <CalendarPanel events={overview.calendarEvents} />
      ) : null}
    </EntityPageShell>
  );
}
