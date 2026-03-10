"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  archiveAcademicYear,
  restoreAcademicYear,
  setCurrentAcademicYear,
} from "@/server/academic-years/actions";
import { STATUS } from "@/constants";

type AcademicYearActionsProps = {
  academicYearId: string;
  isCurrent: boolean;
  status: string;
  canManage: boolean;
};

export function AcademicYearActions({
  academicYearId,
  isCurrent,
  status,
  canManage,
}: AcademicYearActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleMakeCurrent() {
    startTransition(async () => {
      await setCurrentAcademicYear({ academicYearId });
      router.refresh();
    });
  }

  function handleArchive() {
    startTransition(async () => {
      await archiveAcademicYear({ academicYearId });
      router.refresh();
    });
  }

  function handleRestore() {
    startTransition(async () => {
      await restoreAcademicYear({ academicYearId });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!canManage ? null : (
        <>
      {!isCurrent ? (
        <Button size="sm" variant="outline" disabled={isPending} onClick={handleMakeCurrent}>
          Make current
        </Button>
      ) : null}
      {status === STATUS.ACADEMIC_YEAR.ACTIVE ? (
        <Button size="sm" variant="outline" disabled={isPending || isCurrent} onClick={handleArchive}>
          Archive
        </Button>
      ) : (
        <Button size="sm" variant="outline" disabled={isPending} onClick={handleRestore}>
          Restore
        </Button>
      )}
        </>
      )}
    </div>
  );
}
