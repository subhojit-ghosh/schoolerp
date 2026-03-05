import "server-only";
import { db } from "@/db";
import { organization } from "@/db/schema/auth";
import { eq, isNull, desc } from "drizzle-orm";

export type InstitutionRow = {
  id: string;
  name: string;
  slug: string;
  institutionType: string | null;
  status: "active" | "suspended" | null;
  createdAt: Date;
};

export async function listInstitutions(): Promise<InstitutionRow[]> {
  return db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      institutionType: organization.institutionType,
      status: organization.status,
      createdAt: organization.createdAt,
    })
    .from(organization)
    .where(isNull(organization.deletedAt))
    .orderBy(desc(organization.createdAt));
}

export async function getInstitutionById(id: string): Promise<InstitutionRow | null> {
  const [row] = await db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      institutionType: organization.institutionType,
      status: organization.status,
      createdAt: organization.createdAt,
      deletedAt: organization.deletedAt,
    })
    .from(organization)
    .where(eq(organization.id, id))
    .limit(1);

  if (!row || row.deletedAt !== null) return null;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    institutionType: row.institutionType,
    status: row.status,
    createdAt: row.createdAt,
  };
}
