import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export type DatabaseClient = postgres.Sql;
export type AppDatabase = ReturnType<typeof drizzle>;

export function createPostgresClient(databaseUrl: string): DatabaseClient {
  return postgres(databaseUrl);
}

export function createDatabase(client: DatabaseClient): AppDatabase {
  return drizzle(client);
}

export function createCachedDatabase(databaseUrl: string): AppDatabase {
  const globalForDb = globalThis as unknown as {
    client: DatabaseClient | undefined;
  };

  const client = globalForDb.client ?? createPostgresClient(databaseUrl);

  if (process.env.NODE_ENV !== "production") {
    globalForDb.client = client;
  }

  return createDatabase(client);
}
