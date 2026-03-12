# Education ERP Platform

This repository is a Bun + Turbo monorepo for a modular, multi-tenant school ERP.

Current workspace layout:

- `apps/erp` — Vite + React ERP frontend
- `apps/api-erp` — NestJS backend for ERP domains
- `packages/backend-core` — shared Nest/database infrastructure
- `packages/contracts` — shared DTOs and schema contracts
- `packages/database` — Drizzle schema, client, and migrations
- `packages/config` — shared config package placeholder

The codebase is still in migration, but new ERP work should target `apps/erp` and `apps/api-erp`.

## Getting Started

Install dependencies:

```bash
bun install
```

Run the ERP frontend:

```bash
bun run dev:erp
```

Run the Nest API:

```bash
bun run dev:api-erp
```

The backend owns its environment configuration. Put API variables in `apps/api-erp/.env.local` or `apps/api-erp/.env`.

Run the full workspace:

```bash
bun run dev
```

Useful commands:

```bash
bun run typecheck
bun run build
bun run lint
bun run api-erp:openapi
bun run db:generate
bun run db:migrate
bun run db:studio
```

Drizzle migrations live in `packages/database/drizzle`, with config in `packages/database/drizzle.config.ts`.

## Learn More

Core technologies:

- [Vite](https://vite.dev)
- [React](https://react.dev)
- [NestJS](https://nestjs.com)
- [Drizzle ORM](https://orm.drizzle.team)
- [Turborepo](https://turbo.build/repo)
- [Bun](https://bun.sh)

Implementation and migration notes live under `docs/plans/`.
