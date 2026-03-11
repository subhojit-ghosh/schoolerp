import { getCurrentInstitution } from "@/server/institutions/get-current";
import { requireOrgAccess, assertPermission } from "@/server/auth/require-org-access";
import { PERMISSIONS, QUERY_PARAMS, SORT_ORDERS } from "@/constants";
import { MemberList } from "@/components/org/member-list";
import {
  listAssignableMemberRoles,
  listMembers,
} from "@/server/members/queries";

type MembersPageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const institution = await getCurrentInstitution();
  const org = await requireOrgAccess(institution);
  assertPermission(org, PERMISSIONS.MEMBERS.INVITE);

  const params = await searchParams;
  const orderParam = params[QUERY_PARAMS.ORDER];
  const [result, roleOptions] = await Promise.all([
    listMembers({
      institutionId: institution.id,
      search: params[QUERY_PARAMS.SEARCH],
      page: params[QUERY_PARAMS.PAGE] ? Number(params[QUERY_PARAMS.PAGE]) : undefined,
      limit: params[QUERY_PARAMS.LIMIT] ? Number(params[QUERY_PARAMS.LIMIT]) : undefined,
      sort: params[QUERY_PARAMS.SORT],
      order:
        orderParam === SORT_ORDERS.ASC || orderParam === SORT_ORDERS.DESC
          ? orderParam
          : undefined,
    }),
    listAssignableMemberRoles(institution.id),
  ]);

  return <MemberList result={result} roleOptions={roleOptions} />;
}
