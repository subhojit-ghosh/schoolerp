import { inArray, type AnyColumn, type SQL } from "@repo/database";
import type { ResolvedScopes } from "./auth.types";

export function campusScopeFilter(
  column: AnyColumn,
  scopes: ResolvedScopes,
): SQL | undefined {
  if (scopes.campusIds === "all") return undefined;
  if (scopes.campusIds.length === 0) return inArray(column, [""]);
  return inArray(column, scopes.campusIds);
}

export function classScopeFilter(
  column: AnyColumn,
  scopes: ResolvedScopes,
): SQL | undefined {
  if (scopes.classIds === "all") return undefined;
  if (scopes.classIds.length === 0) return inArray(column, [""]);
  return inArray(column, scopes.classIds);
}

export function sectionScopeFilter(
  column: AnyColumn,
  scopes: ResolvedScopes,
): SQL | undefined {
  if (scopes.sectionIds === "all") return undefined;
  if (scopes.sectionIds.length === 0) return inArray(column, [""]);
  return inArray(column, scopes.sectionIds);
}
