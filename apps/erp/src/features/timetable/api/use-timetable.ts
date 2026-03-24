import { useQueryClient } from "@tanstack/react-query";
import { TIMETABLE_API_PATHS } from "@/features/auth/api/auth.constants";
import { apiQueryClient } from "@/lib/api/client";

type TimetableScopeQuery = {
  classId: string;
  sectionId: string;
  versionId?: string;
  date?: string;
};

export function useTimetableQuery(
  enabled: boolean,
  query: TimetableScopeQuery,
) {
  return apiQueryClient.useQuery(
    "get",
    TIMETABLE_API_PATHS.VIEW,
    {
      params: {
        query,
      },
    },
    {
      enabled,
    },
  );
}

export function useReplaceTimetableMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation(
    "put",
    TIMETABLE_API_PATHS.REPLACE_SECTION,
    {
      onSuccess: () => {
        void queryClient.invalidateQueries();
      },
    },
  );
}

type TimetableVersionsQuery = {
  classId: string;
  sectionId: string;
};

export function useTimetableVersionsQuery(
  enabled: boolean,
  query: TimetableVersionsQuery,
) {
  return apiQueryClient.useQuery(
    "get",
    TIMETABLE_API_PATHS.VERSIONS,
    {
      params: {
        query,
      },
    },
    {
      enabled,
    },
  );
}

export function useCreateTimetableVersionMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("post", TIMETABLE_API_PATHS.VERSIONS, {
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });
}

export function useUpdateTimetableVersionMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation(
    "patch",
    TIMETABLE_API_PATHS.UPDATE_VERSION,
    {
      onSuccess: () => {
        void queryClient.invalidateQueries();
      },
    },
  );
}

export function usePublishTimetableVersionMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation(
    "post",
    TIMETABLE_API_PATHS.PUBLISH_VERSION,
    {
      onSuccess: () => {
        void queryClient.invalidateQueries();
      },
    },
  );
}

export function useSetTimetableVersionStatusMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation(
    "patch",
    TIMETABLE_API_PATHS.SET_VERSION_STATUS,
    {
      onSuccess: () => {
        void queryClient.invalidateQueries();
      },
    },
  );
}

type TimetableStaffOptionsQuery = {
  classId?: string;
  subjectId: string;
};

export function useTimetableStaffOptionsQuery(
  enabled: boolean,
  query: TimetableStaffOptionsQuery,
) {
  return apiQueryClient.useQuery(
    "get",
    TIMETABLE_API_PATHS.STAFF_OPTIONS,
    {
      params: {
        query,
      },
    },
    {
      enabled: enabled && Boolean(query.subjectId),
      staleTime: 60_000,
    },
  );
}

export function useTeacherTimetableQuery(
  enabled: boolean,
  staffId: string | undefined,
) {
  return apiQueryClient.useQuery(
    "get",
    TIMETABLE_API_PATHS.TEACHER_VIEW,
    {
      params: {
        query: {
          staffId: staffId ?? "",
        },
      },
    },
    {
      enabled: enabled && Boolean(staffId),
    },
  );
}

export function useCopySectionTimetableMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation("post", TIMETABLE_API_PATHS.COPY_SECTION, {
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });
}

export function useDeleteTimetableEntryMutation() {
  const queryClient = useQueryClient();

  return apiQueryClient.useMutation(
    "delete",
    TIMETABLE_API_PATHS.DELETE_ENTRY,
    {
      onSuccess: () => {
        void queryClient.invalidateQueries();
      },
    },
  );
}
