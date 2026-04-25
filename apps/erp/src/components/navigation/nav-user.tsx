import {
  IconDotsVertical,
  IconLogout2,
  IconSettings,
} from "@tabler/icons-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { useSignOutMutation } from "@/features/auth/api/use-auth";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { ERP_ROUTES } from "@/constants/routes";
import { formatPhoneCompact } from "@/lib/format";

function toInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function NavUser() {
  const navigate = useNavigate();
  const signOutMutation = useSignOutMutation();
  const session = useAuthStore((store) => store.session);
  const user = session?.user;

  if (!user) {
    return null;
  }

  const secondaryLabel = user.mobile
    ? formatPhoneCompact(user.mobile)
    : user.email;
  const initials = toInitials(user.name);

  async function handleSignOut() {
    try {
      await signOutMutation.mutateAsync({});
      void navigate(ERP_ROUTES.SIGN_IN, { replace: true });
    } catch {
      toast.error("Could not log out. Please try again.");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/50"
          type="button"
        >
          <Avatar className="size-8 rounded-md">
            <AvatarImage alt={user.name} src="" />
            <AvatarFallback className="rounded-md">{initials}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-sm leading-tight">
            <span className="truncate font-medium">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {secondaryLabel}
            </span>
          </div>
          <IconDotsVertical className="ml-auto size-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 rounded-xl"
        side="right"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="size-8 rounded-md">
              <AvatarImage alt={user.name} src="" />
              <AvatarFallback className="rounded-md">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {secondaryLabel}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void navigate(ERP_ROUTES.ACCOUNT)}>
          <IconSettings />
          Account
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={signOutMutation.isPending}
          onClick={() => void handleSignOut()}
        >
          <IconLogout2 />
          {signOutMutation.isPending ? "Logging out..." : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
