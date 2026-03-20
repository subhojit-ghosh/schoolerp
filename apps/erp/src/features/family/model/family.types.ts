import type { components } from "@/lib/api/generated/schema";

export type FamilyOverview = components["schemas"]["FamilyOverviewDto"];
export type FamilyStudentSummary =
  components["schemas"]["StudentSummaryDto"];
export type FamilyLinkedStudent =
  components["schemas"]["AuthLinkedStudentDto"];
export type FamilyTimetable = components["schemas"]["TimetableViewDto"];
export type FamilyAnnouncement = components["schemas"]["AnnouncementDto"];
export type FamilyCalendarEvent = components["schemas"]["CalendarEventDto"];
