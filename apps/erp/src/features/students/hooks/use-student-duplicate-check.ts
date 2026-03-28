import { useMemo } from "react";
import { apiQueryClient } from "@/lib/api/client";
import { STUDENTS_API_PATHS } from "@/features/auth/api/auth.constants";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

const DUPLICATE_CHECK_DEBOUNCE_MS = 500;
const DUPLICATE_CHECK_PAGE_SIZE = 5;

type DuplicateCheckInput = {
  firstName: string;
  lastName: string;
  classId: string;
  className: string;
};

type DuplicateMatch = {
  fullName: string;
  className: string;
};

type DuplicateCheckResult = {
  isChecking: boolean;
  match: DuplicateMatch | null;
};

export function useStudentDuplicateCheck(
  institutionId: string | undefined,
  input: DuplicateCheckInput,
): DuplicateCheckResult {
  const searchQuery = useMemo(() => {
    const first = input.firstName.trim();
    if (!first) {
      return "";
    }
    const last = input.lastName.trim();
    return last ? `${first} ${last}` : first;
  }, [input.firstName, input.lastName]);

  const debouncedQuery = useDebouncedValue(searchQuery, DUPLICATE_CHECK_DEBOUNCE_MS);
  const debouncedClassId = useDebouncedValue(input.classId, DUPLICATE_CHECK_DEBOUNCE_MS);

  const enabled = Boolean(
    institutionId && debouncedQuery.length > 0 && debouncedClassId,
  );

  const studentsQuery = apiQueryClient.useQuery(
    "get",
    STUDENTS_API_PATHS.LIST,
    {
      params: {
        query: {
          q: debouncedQuery,
          limit: DUPLICATE_CHECK_PAGE_SIZE,
          page: 1,
        },
      },
    },
    {
      enabled,
    },
  );

  const match = useMemo((): DuplicateMatch | null => {
    if (!enabled || !studentsQuery.data) {
      return null;
    }

    const rows = studentsQuery.data.rows ?? [];
    const normalizedFirst = input.firstName.trim().toLowerCase();
    const normalizedLast = input.lastName.trim().toLowerCase();

    const duplicate = rows.find((student) => {
      const studentFirst = student.firstName.toLowerCase();
      const studentLast = (student.lastName ?? "").toLowerCase();
      const nameMatch =
        studentFirst === normalizedFirst && studentLast === normalizedLast;
      const classMatch = student.classId === debouncedClassId;
      return nameMatch && classMatch;
    });

    if (!duplicate) {
      return null;
    }

    return {
      fullName: duplicate.fullName,
      className: input.className,
    };
  }, [
    enabled,
    studentsQuery.data,
    input.firstName,
    input.lastName,
    input.className,
    debouncedClassId,
  ]);

  return {
    isChecking: studentsQuery.isLoading && enabled,
    match,
  };
}
