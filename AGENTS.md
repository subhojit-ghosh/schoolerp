# Education ERP Platform

A modular, multi-tenant, white-label ERP platform designed for schools and colleges.

The system supports student lifecycle management including admissions, academics, attendance, examinations, fees, staff management, and communication. It is built with a configurable academic engine to support primary schools, high schools, and colleges using a single core architecture.

The platform is designed to be scalable, extensible, and institution-type configurable, enabling different academic structures (year-based, semester-based, credit-based) without maintaining separate codebases.

## Technical Details

This project use `bun` as package manager. use `bun run typecheck` for typecheck.

Auth system we use - better auth (https://better-auth.com)
Database we use - PostgreSQL
ORM we use - Drizzle (https://orm.drizzle.team)

Keep all the plans in `./docs/plans`.

## Tool Commands

### Better Auth CLI
Use the new standalone CLI `bunx auth` (not the deprecated `@better-auth/cli`):
- `bunx auth generate --adapter drizzle --dialect postgresql` — generate Drizzle schema
- `bunx auth migrate` — run database migrations
- `bunx auth init` — scaffold full setup interactively

### Drizzle
- `bunx drizzle-kit generate` — generate migration files from schema
- `bunx drizzle-kit migrate` — apply migrations
