import { listInstitutions } from "@/server/institutions/queries";
import { InstitutionList } from "@/components/platform/institution-list";
import { QUERY_PARAMS, SORT_ORDERS } from "@/constants";

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function InstitutionsPage({ searchParams }: Props) {
  const params = await searchParams;
  const orderParam = params[QUERY_PARAMS.ORDER];
  const result = await listInstitutions({
    search: params[QUERY_PARAMS.SEARCH],
    page: params[QUERY_PARAMS.PAGE] ? Number(params[QUERY_PARAMS.PAGE]) : undefined,
    limit: params[QUERY_PARAMS.LIMIT] ? Number(params[QUERY_PARAMS.LIMIT]) : undefined,
    sort: params[QUERY_PARAMS.SORT],
    order:
      orderParam === SORT_ORDERS.ASC || orderParam === SORT_ORDERS.DESC
        ? orderParam
        : undefined,
  });

  return <InstitutionList result={result} />;
}
