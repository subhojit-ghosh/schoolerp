"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { CreateMemberForm } from "@/components/org/create-member-form";
import { getMemberColumns } from "@/components/org/member-columns";
import { PageShell } from "@/components/page-shell";
import type {
  ListMembersResult,
  MemberRoleOption,
} from "@/server/members/queries";

type MemberListProps = {
  result: ListMembersResult;
  roleOptions: MemberRoleOption[];
};

export function MemberList({ result, roleOptions }: MemberListProps) {
  return (
    <PageShell title="Members">
      <div className="space-y-4">
        <CreateMemberForm roleOptions={roleOptions} />
        <Card>
          <CardHeader>
            <CardTitle>Institution Members</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={getMemberColumns(roleOptions)}
              data={result.rows}
              pagination={{
                page: result.page,
                pageSize: result.pageSize,
                pageCount: result.pageCount,
                total: result.total,
              }}
              searchKey="name"
              searchPlaceholder="Filter members..."
            />
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
