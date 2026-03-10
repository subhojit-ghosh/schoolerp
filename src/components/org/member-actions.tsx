"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { restoreMember, removeMember, suspendMember, updateMemberRole } from "@/server/members/actions";
import { STATUS } from "@/constants";
import type { MemberRoleOption } from "@/server/members/queries";

type MemberActionsProps = {
  memberId: string;
  status: string;
  roleId: string | null;
  roleOptions: MemberRoleOption[];
};

export function MemberActions({
  memberId,
  status,
  roleId,
  roleOptions,
}: MemberActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [removeOpen, setRemoveOpen] = useState(false);

  function handleRoleChange(nextRoleId: string) {
    if (nextRoleId === roleId) {
      return;
    }

    startTransition(async () => {
      await updateMemberRole({ memberId, roleId: nextRoleId });
      router.refresh();
    });
  }

  function handleSuspend() {
    startTransition(async () => {
      await suspendMember({ memberId });
      router.refresh();
    });
  }

  function handleRestore() {
    startTransition(async () => {
      await restoreMember({ memberId });
      router.refresh();
    });
  }

  function handleRemove() {
    startTransition(async () => {
      await removeMember({ memberId });
      setRemoveOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" disabled={isPending} />}>
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Open member actions</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger disabled={isPending}>
              Change role
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {roleOptions.map((role) => (
                <DropdownMenuItem
                  key={role.id}
                  onClick={() => handleRoleChange(role.id)}
                  disabled={role.id === roleId}
                >
                  {role.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          {status === STATUS.MEMBER.ACTIVE ? (
            <DropdownMenuItem onClick={handleSuspend} disabled={isPending}>
              Suspend
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleRestore} disabled={isPending}>
              Reactivate
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setRemoveOpen(true)}
            disabled={isPending}
          >
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes institution access for the member. The user account stays intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} disabled={isPending}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
