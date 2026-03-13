import { useQueryClient } from "@tanstack/react-query";
import { apiQueryClient } from "@/lib/api/client";
import { ATTENDANCE_API_PATHS } from "@/features/auth/api/auth.constants";
import type {
  AttendanceDayViewValues,
  AttendanceSelectionValues,
} from "../model/attendance-form-schema";

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

export function useAttendanceDayViewQuery(
  institutionId: string | undefined,
  filters: AttendanceDayViewValues,
) {
  return apiQueryClient.useQuery(
    "get",
    ATTENDANCE_API_PATHS.DAY_VIEW,
    {
      params: {
        query: {
          attendanceDate: filters.attendanceDate,
        },
      },
    },
    {
      enabled: Boolean(institutionId && filters.attendanceDate),
    },
  );
}

export function useUpsertAttendanceDayMutation(
  institutionId: string | undefined,
  activeFilters: AttendanceSelectionValues | null,
  dayViewFilters: AttendanceDayViewValues,
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

      void queryClient.invalidateQueries({
        queryKey: apiQueryClient.queryOptions(
          "get",
          ATTENDANCE_API_PATHS.DAY_VIEW,
          {
            params: {
              query: {
                attendanceDate: dayViewFilters.attendanceDate,
              },
            },
          },
        ).queryKey,
      });
    },
  });
}
