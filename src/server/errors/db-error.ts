type PostgresError = {
  code?: string;
  detail?: string;
  cause?: unknown;
};

export type DatabaseErrorRule = {
  code: string;
  column?: string;
  message: string;
};

function isPostgresError(error: unknown): error is PostgresError {
  if (typeof error !== "object" || error === null) return false;
  return "code" in error || "detail" in error || "cause" in error;
}

export function extractPostgresError(error: unknown): PostgresError | null {
  if (!isPostgresError(error)) return null;
  if (typeof error.code === "string") return error;
  return extractPostgresError(error.cause);
}

function extractColumnFromDetail(detail: string): string | null {
  const match = detail.match(/^Key \((\w+)\)/);
  return match?.[1] ?? null;
}

export function matchDatabaseRule(
  error: PostgresError,
  rules: DatabaseErrorRule[],
): string | null {
  for (const rule of rules) {
    if (error.code !== rule.code) continue;
    if (!rule.column) return rule.message;
    if (error.detail && extractColumnFromDetail(error.detail) === rule.column) {
      return rule.message;
    }
  }
  return null;
}
