import "server-only";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { organization } from "@/lib/auth-schema";
import { eq } from "drizzle-orm";

export type InstitutionContext = {
  id: string;
  slug: string;
  name: string;
  status: string;
  branding: {
    logoUrl: string | null;
    primaryColor: string | null;
  };
};

/**
 * Reads x-institution-slug from request headers (set by proxy) and resolves
 * the full institution context from DB. Throws an invariant error if missing —
 * this is a system bug, not a user error (proxy guarantees the header exists).
 */
export async function getCurrentInstitution(): Promise<InstitutionContext> {
  const slug = (await headers()).get("x-institution-slug");
  if (!slug) {
    throw new Error("Invariant: x-institution-slug header missing — check proxy configuration");
  }

  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.slug, slug))
    .limit(1);

  if (!org) {
    throw new Error(`Invariant: institution not found for slug "${slug}"`);
  }

  return {
    id: org.id,
    slug: org.slug,
    name: org.name,
    status: org.status ?? "active",
    branding: {
      logoUrl: null,       // TODO: add logoUrl column to organization table
      primaryColor: null,  // TODO: add primaryColor column to organization table
    },
  };
}

/**
 * Lightweight version for auth pages — returns only branding fields.
 * Does NOT validate session or membership.
 */
export async function getCurrentInstitutionBranding() {
  const ctx = await getCurrentInstitution();
  return {
    slug: ctx.slug,
    name: ctx.name,
    logoUrl: ctx.branding.logoUrl,
    primaryColor: ctx.branding.primaryColor,
  };
}
