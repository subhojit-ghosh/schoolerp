"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ROUTE_BUILDERS, STATUS, type OrgStatus } from "@/constants";
import { MoreHorizontal } from "lucide-react";
import {
  suspendInstitution,
  restoreInstitution,
  deleteInstitution,
} from "@/server/institutions/actions";

type InstitutionActionsProps = {
  id: string;
  status: OrgStatus | null;
};

export function InstitutionActions({ id, status }: InstitutionActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);

  function handleSuspend() {
    startTransition(async () => {
      await suspendInstitution({ id });
      router.refresh();
    });
  }

  function handleRestore() {
    startTransition(async () => {
      await restoreInstitution({ id });
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteInstitution({ id });
      setDeleteOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" disabled={isPending} />}>
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Open menu</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem render={<a href={ROUTE_BUILDERS.ADMIN.INSTITUTION_BY_ID(id)} />}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {status === STATUS.ORG.ACTIVE ? (
            <DropdownMenuItem onClick={handleSuspend} disabled={isPending}>
              Suspend
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleRestore} disabled={isPending}>
              Restore
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete institution?</AlertDialogTitle>
            <AlertDialogDescription>
              This will soft-delete the institution. The subdomain will stop
              working. The data is preserved in the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
