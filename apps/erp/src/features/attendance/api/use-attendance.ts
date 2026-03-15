import { useQueryClient } from "@tanstack/react-query";
import { apiQueryClient } from "@/lib/api/client";
import { ATTENDANCE_API_PATHS } from "@/features/auth/api/auth.constants";
import type { AttendanceSelectionValues } from "../model/attendance-form-schema";

export type AttendanceOverviewFilters = {
  date: string;
};

export type AttendanceClassReportFilters = {
  campusId: string;
  classId: string;
  sectionId: string;
  startDate: string;
  endDate: string;
};

export type AttendanceStudentReportFilters = {
  studentId: string;
  startDate: string;
  endDate: string;
};

export function useAttendanceClassSectionsQuery(
  institutionId: string | undefined,
  campusId: string | undefined,
) {
  return apiQueryClient.useQuery(
    "get",
    ATTENDANCE_API_PATHS.CLASS_SECTIONS,
    {
      params: {
        query: {
          campusId: campusId ?? "",
        },
      },
    },
    {
      enabled: Boolean(institutionId && campusId),
    },
  );
}

export function useAttendanceDayQuery(
  institutionId: string | undefined,
  filters: AttendanceSelectionValues | null,
) {
  return apiQueryClient.useQuery(
    "get",
    ATTENDANCE_API_PATHS.DAY,
    {
      params: {
        query: {
          attendanceDate: filters?.attendanceDate ?? "",
          campusId: filters?.campusId ?? "",
          classId: filters?.classId ?? "",
          sectionId: filters?.sectionId ?? "",
        },
      },
    },
    {
      enabled: Boolean(
        institutionId &&
        filters?.attendanceDate &&
        filters?.campusId &&
        filters?.classId &&
        filters?.sectionId,
      ),
    },
  );
}

export function useAttendanceOverviewQuery(
  institutionId: string | undefined,
  filters: AttendanceOverviewFilters,
) {
  return apiQueryClient.useQuery(
    "get",
    ATTENDANCE_API_PATHS.OVERVIEW,
    {
      params: {
        query: {
          date: filters.date,
        },
      },
    },
    {
      enabled: Boolean(institutionId && filters.date),
    },
  );
}

export function useAttendanceClassReportQuery(
  institutionId: string | undefined,
  filters: AttendanceClassReportFilters | null,
) {
  return apiQueryClient.useQuery(
    "get",
    ATTENDANCE_API_PATHS.CLASS_REPORT,
    {
      params: {
        query: {
          campusId: filters?.campusId ?? "",
          classId: filters?.classId ?? "",
          sectionId: filters?.sectionId ?? "",
          startDate: filters?.startDate ?? "",
          endDate: filters?.endDate ?? "",
        },
      },
    },
    {
      enabled: Boolean(
        institutionId &&
          filters?.campusId &&
          filters?.classId &&
          filters?.sectionId &&
          filters?.startDate &&
          filters?.endDate,
      ),
    },
  );
}

export function useAttendanceStudentReportQuery(
  institutionId: string | undefined,
  filters: AttendanceStudentReportFilters | null,
) {
  return apiQueryClient.useQuery(
    "get",
    ATTENDANCE_API_PATHS.STUDENT_REPORT,
    {
      params: {
        query: {
          studentId: filters?.studentId ?? "",
          startDate: filters?.startDate ?? "",
          endDate: filters?.endDate ?? "",
        },
      },
    },
    {
      enabled: Boolean(
        institutionId &&
          filters?.studentId &&
          filters?.startDate &&
          filters?.endDate,
      ),
    },
  );
}

export function useUpsertAttendanceDayMutation(
  institutionId: string | undefined,
  activeFilters: AttendanceSelectionValues | null,
  overviewDate: string,
) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("post", ATTENDANCE_API_PATHS.DAY, {
    onSuccess: () => {
      if (!institutionId) {
        return;
      }

      if (activeFilters) {
        void queryClient.invalidateQueries({
          queryKey: apiQueryClient.queryOptions(
            "get",
            ATTENDANCE_API_PATHS.DAY,
            {
              params: {
                query: {
                  attendanceDate: activeFilters.attendanceDate,
                  campusId: activeFilters.campusId,
                  classId: activeFilters.classId,
                  sectionId: activeFilters.sectionId,
                },
              },
            },
          ).queryKey,
        });
      }

      // Invalidate overview for the date that was actually marked
      const markedDate = activeFilters?.attendanceDate ?? overviewDate;
      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions(
          "get",
          ATTENDANCE_API_PATHS.OVERVIEW,
          {
            params: {
              query: {
                date: markedDate,
              },
            },
          },
        ).queryKey,
      });

      // Also invalidate the currently viewed overview date if different
      if (overviewDate !== markedDate) {
        void queryClient.invalidateQueries({
          queryKey: apiQueryClient.queryOptions(
            "get",
            ATTENDANCE_API_PATHS.OVERVIEW,
            {
              params: {
                query: {
                  date: overviewDate,
                },
              },
            },
          ).queryKey,
        });
      }
    },
  });
}
