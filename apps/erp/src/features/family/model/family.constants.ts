export const FAMILY_QUERY_PARAMS = {
  STUDENT_ID: "studentId",
} as const;

export const FAMILY_PAGE_COPY = {
  overview: {
    title: "Family Overview",
    description:
      "Review each linked child’s attendance, report card, dues, announcements, and calendar items from one place.",
  },
  children: {
    title: "Children",
    description:
      "See linked children, current class placement, and the latest school-facing summary for each child.",
  },
  attendance: {
    title: "Attendance",
    description:
      "See the selected child’s recent attendance history and summary.",
  },
  timetable: {
    title: "Timetable",
    description:
      "Review the selected child’s current class timetable for the active campus.",
  },
  exams: {
    title: "Exams",
    description:
      "Check the selected child’s latest report card and recent exam terms.",
  },
  fees: {
    title: "Fees",
    description:
      "Review the selected child’s fee dues, recent assignments, and payment history.",
  },
  announcements: {
    title: "Announcements",
    description:
      "Read the latest campus announcements visible to guardians.",
  },
  calendar: {
    title: "Calendar",
    description:
      "See active campus events and upcoming dates for the selected child.",
  },
} as const;
