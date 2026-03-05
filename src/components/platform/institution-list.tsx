import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InstitutionActions } from "@/components/platform/institution-actions";
import { INSTITUTION_TYPES } from "@/server/institutions/schemas";
import type { InstitutionRow } from "@/server/institutions/queries";

function typeLabel(value: string | null) {
  if (!value) return "—";
  return INSTITUTION_TYPES.find((t) => t.value === value)?.label ?? value;
}

type InstitutionListProps = {
  institutions: InstitutionRow[];
};

export function InstitutionList({ institutions }: InstitutionListProps) {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Institutions</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {institutions.length} institution{institutions.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/admin/institutions/new">
          <Button>
            <PlusIcon className="mr-2 size-4" />
            New institution
          </Button>
        </Link>
      </div>

      {institutions.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed py-16 text-center text-sm">
          No institutions yet. Create the first one.
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Slug</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {institutions.map((inst) => (
                <tr key={inst.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{inst.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {inst.slug}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{typeLabel(inst.institutionType)}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={inst.status === "active" ? "default" : "secondary"}>
                      {inst.status ?? "active"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <InstitutionActions id={inst.id} status={inst.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
