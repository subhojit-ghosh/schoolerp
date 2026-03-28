import { useQueryClient } from "@tanstack/react-query";
import { apiQueryClient } from "@/lib/api/client";
import { STAFF_ATTENDANCE_API_PATHS } from "@/features/auth/api/auth.constants";

export type StaffAttendanceRosterFilters = {
  campusId: string;
  attendanceDate: string;
};

export type StaffAttendanceReportFilters = {
  campusId: string;
  fromDate: string;
  toDate: string;
};

export function useStaffAttendanceRosterQuery(
  institutionId: string | undefined,
  filters: StaffAttendanceRosterFilters | null,
) {
  return apiQueryClient.useQuery(
    "get",
    STAFF_ATTENDANCE_API_PATHS.ROSTER,
    {
      params: {
        query: {
          campusId: filters?.campusId ?? "",
          attendanceDate: filters?.attendanceDate ?? "",
        },
      },
    },
    {
      enabled: Boolean(
        institutionId && filters?.campusId && filters?.attendanceDate,
      ),
    },
  );
}

export function useUpsertStaffAttendanceDayMutation(
  institutionId: string | undefined,
  activeFilters: StaffAttendanceRosterFilters | null,
) {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("post", STAFF_ATTENDANCE_API_PATHS.DAY, {
    onSuccess: () => {
      if (!institutionId || !activeFilters) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions(
          "get",
          STAFF_ATTENDANCE_API_PATHS.ROSTER,
          {
            params: {
              query: {
                campusId: activeFilters.campusId,
                attendanceDate: activeFilters.attendanceDate,
              },
            },
          },
        ).queryKey,
      });

      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions(
          "get",
          STAFF_ATTENDANCE_API_PATHS.DAY_VIEW,
          {
            params: {
              query: {
                attendanceDate: activeFilters.attendanceDate,
              },
            },
          },
        ).queryKey,
      });
    },
  });
}

export function useStaffAttendanceDayViewQuery(
  institutionId: string | undefined,
  attendanceDate: string,
) {
  return apiQueryClient.useQuery(
    "get",
    STAFF_ATTENDANCE_API_PATHS.DAY_VIEW,
    {
      params: {
        query: {
          attendanceDate,
        },
      },
    },
    {
      enabled: Boolean(institutionId && attendanceDate),
    },
  );
}

export function useStaffAttendanceReportQuery(
  institutionId: string | undefined,
  filters: StaffAttendanceReportFilters | null,
) {
  return apiQueryClient.useQuery(
    "get",
    STAFF_ATTENDANCE_API_PATHS.REPORT,
    {
      params: {
        query: {
          campusId: filters?.campusId ?? "",
          fromDate: filters?.fromDate ?? "",
          toDate: filters?.toDate ?? "",
        },
      },
    },
    {
      enabled: Boolean(
        institutionId &&
          filters?.campusId &&
          filters?.fromDate &&
          filters?.toDate,
      ),
    },
  );
}
