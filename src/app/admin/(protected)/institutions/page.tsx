import { listInstitutions } from "@/server/institutions/queries";
import { InstitutionList } from "@/components/platform/institution-list";

type Props = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    limit?: string;
    sort?: string;
    order?: string;
  }>;
};

export default async function InstitutionsPage({ searchParams }: Props) {
  const params = await searchParams;
  const result = await listInstitutions({
    search: params.q,
    page: params.page ? Number(params.page) : undefined,
    limit: params.limit ? Number(params.limit) : undefined,
    sort: params.sort,
    order: params.order === "asc" || params.order === "desc" ? params.order : undefined,
  });

  return <InstitutionList result={result} />;
}
