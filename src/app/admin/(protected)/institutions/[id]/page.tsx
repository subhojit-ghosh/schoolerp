import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STATUS } from "@/constants";
import { EditInstitutionForm } from "@/components/platform/edit-institution-form";
import { getInstitutionById } from "@/server/institutions/queries";

type EditInstitutionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditInstitutionPage({
  params,
}: EditInstitutionPageProps) {
  const { id } = await params;
  const institution = await getInstitutionById(id);

  if (!institution) {
    notFound();
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-lg">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{institution.name}</CardTitle>
                <CardDescription className="mt-1 font-mono text-xs">
                  {institution.slug}
                </CardDescription>
              </div>
              <Badge
                variant={institution.status === STATUS.ORG.ACTIVE ? "default" : "secondary"}
              >
                {institution.status ?? STATUS.ORG.ACTIVE}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <EditInstitutionForm institution={institution} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
