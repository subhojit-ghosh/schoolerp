"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/page-shell";
import { CreateRoleForm } from "@/components/org/create-role-form";
import { RoleCard } from "@/components/org/role-card";
import type { PermissionOption, RoleRow } from "@/server/roles/shared";

type RolesContentProps = {
  roles: RoleRow[];
  permissionOptions: PermissionOption[];
};

export function RolesContent({ roles, permissionOptions }: RolesContentProps) {
  return (
    <PageShell title="Roles">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Create Custom Role</CardTitle>
            <CardDescription>
              Custom roles are institution-specific and can be assigned to members immediately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateRoleForm permissionOptions={permissionOptions} />
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {roles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              permissionOptions={permissionOptions}
            />
          ))}
        </div>
      </div>
    </PageShell>
  );
}
