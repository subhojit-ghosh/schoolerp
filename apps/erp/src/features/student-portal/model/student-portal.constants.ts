export const STUDENT_PORTAL_QUERY_PARAMS = {
  EXAM_TERM_ID: "examTermId",
} as const;

export const STUDENT_PORTAL_PAGE_COPY = {
  overview: {
    title: "Student Overview",
    description:
      "Track your attendance, timetable, results, announcements, and campus calendar from one student workspace.",
  },
  timetable: {
    title: "Timetable",
    description: "Review your current class timetable for the active campus.",
  },
  attendance: {
    title: "Attendance",
    description:
      "See your attendance summary, recent marked dates, and current absent streak.",
  },
  exams: {
    title: "Exams",
    description: "Review recent exam terms and overall performance trends.",
  },
  results: {
    title: "Results",
    description:
      "Open your latest subject-wise report card and grading breakdown.",
  },
  announcements: {
    title: "Announcements",
    description: "Read the latest published updates visible to students.",
  },
  calendar: {
    title: "Calendar",
    description:
      "See active campus events, exam dates, and upcoming school deadlines.",
  },
} as const;
