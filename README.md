# Education ERP Platform

This repository is now a Turbo monorepo with a split application layout:

- `apps/web` — current Next.js web app
- `apps/api` — NestJS backend scaffold
- `packages/contracts` — shared API contracts

The current business logic still lives mostly in `apps/web` and will be extracted into `apps/api` incrementally.

## Getting Started

Install dependencies:

```bash
bun install
```

Run the web app:

```bash
bun run dev:web
```

Run the Nest API:

```bash
bun run dev:api
```

The API runs on Bun directly from TypeScript in development and uses Bun to start the built server in production.
The API owns its environment configuration. Put API variables in `apps/api/.env.local` or `apps/api/.env`.

Run the full workspace:

```bash
bun run dev
```

Useful commands:

```bash
bun run typecheck
bun run lint
bun run db:generate
bun run db:migrate
```

Drizzle migrations now live in `packages/database/drizzle`, with config in `packages/database/drizzle.config.ts`.

## Learn More

Core technologies:

- [Next.js](https://nextjs.org)
- [NestJS](https://nestjs.com)
- [Better Auth](https://better-auth.com)
- [Drizzle ORM](https://orm.drizzle.team)
- [Turborepo](https://turbo.build/repo)

Implementation and migration notes live under `docs/plans/`.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
