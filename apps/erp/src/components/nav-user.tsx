import { IconDotsVertical, IconLogout } from "@tabler/icons-react";
import { useNavigate } from "react-router";
import { Badge } from "@repo/ui/components/ui/badge";
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
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@repo/ui/components/ui/sidebar";
import { useSignOutMutation } from "@/features/auth/api/use-auth";
import { getActiveContext } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";

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
  const { isMobile } = useSidebar();
  const signOutMutation = useSignOutMutation();
  const session = useAuthStore((store) => store.session);
  const user = session?.user;

  async function handleSignOut() {
    await signOutMutation.mutateAsync({});
    void navigate("/sign-in");
  }

  if (!user) {
    return null;
  }

  const secondaryLabel = user.email ?? user.mobile;
  const initials = toInitials(user.name);
  const institutionName = session?.activeOrganization?.name ?? "Institution";
  const campusName = session?.activeCampus?.name ?? "Campus";
  const activeContext = getActiveContext(session);
  const memberTypes = Array.from(
    new Set(session?.memberships.map((membership) => membership.memberType) ?? []),
  );

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarImage alt={user.name} src="" />
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {secondaryLabel}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage alt={user.name} src="" />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
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
            <div className="flex flex-col gap-2 px-2 py-2">
              <div>
                <p className="text-xs font-medium text-foreground">{institutionName}</p>
                <p className="text-xs text-muted-foreground">
                  {activeContext ? `${activeContext.label} view` : campusName}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {activeContext ? (
                  <Badge variant="secondary">{activeContext.label}</Badge>
                ) : null}
                {memberTypes.map((memberType) => (
                  <Badge key={memberType} className="capitalize" variant="outline">
                    {memberType}
                  </Badge>
                ))}
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={signOutMutation.isPending}
              onClick={() => void handleSignOut()}
            >
              <IconLogout />
              {signOutMutation.isPending ? "Signing out..." : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
