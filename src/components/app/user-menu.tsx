"use client";

import { useTransition } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserMenuProps = {
  email: string;
  name: string;
  onSignOut: () => Promise<void>;
  subtitle: string;
};

export function UserMenu({
  email,
  name,
  onSignOut,
  subtitle,
}: UserMenuProps) {
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(() => {
      void onSignOut();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            className="h-10 min-w-44 justify-between rounded-xl border-border/60 bg-background/80 px-2.5 shadow-none"
          />
        }
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar className="size-7 rounded-lg">
            <AvatarFallback className="rounded-lg text-xs font-semibold">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 text-left group-data-[popup-open]:pr-1">
            <p className="truncate text-xs font-semibold leading-none">
              {name}
            </p>
            <p className="truncate pt-1 text-[0.625rem] text-muted-foreground">
              {subtitle}
            </p>
          </div>
        </div>
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-xl">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-3 px-3 py-2.5">
              <Avatar className="size-9 rounded-xl">
                <AvatarFallback className="rounded-xl text-sm font-semibold">
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 text-left">
                <p className="truncate text-sm font-medium">{name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {email}
                </p>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={isPending} onClick={handleSignOut}>
          <LogOut className="mr-2 size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
