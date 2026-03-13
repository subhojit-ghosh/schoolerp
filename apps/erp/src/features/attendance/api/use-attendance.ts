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
        path: {
          institutionId: institutionId ?? "",
        },
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
        path: {
          institutionId: institutionId ?? "",
        },
        query: {
          attendanceDate: filters?.attendanceDate ?? "",
          campusId: filters?.campusId ?? "",
          className: filters?.className ?? "",
          sectionName: filters?.sectionName ?? "",
        },
      },
    },
    {
      enabled: Boolean(
        institutionId &&
          filters?.attendanceDate &&
          filters?.campusId &&
          filters?.className &&
          filters?.sectionName,
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
        path: {
          institutionId: institutionId ?? "",
        },
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
                path: {
                  institutionId,
                },
                query: {
                  attendanceDate: activeFilters.attendanceDate,
                  campusId: activeFilters.campusId,
                  className: activeFilters.className,
                  sectionName: activeFilters.sectionName,
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
              path: {
                institutionId,
              },
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
