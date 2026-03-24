# Production Docker Compose

This deployment stack is designed for a single VPS:

- host-level `caddy` terminates TLS and routes traffic
- `web` serves the public root app
- `erp` serves the tenant ERP SPA
- `api` runs the NestJS backend
- `postgres` runs PostgreSQL 18 with a persistent volume

## 1. Prepare DNS

Point these records to the VPS:

- `ROOT_HOST` (example: `erp.example.com`)
- `*.ROOT_DOMAIN` (example: `*.erp.example.com`)

This setup assumes:

- root app lives at `https://ROOT_HOST`
- tenant app lives at `https://<tenant>.ROOT_DOMAIN`

The example host Caddy config uses explicit root-domain and wildcard-domain site blocks.

## 2. Prepare environment

Copy the example env file and fill in real values:

```bash
cp ops/docker/.env.production.example ops/docker/.env.production
```

Important values:

- `ROOT_HOST` and `ROOT_DOMAIN`
- `POSTGRES_*`
- `DATABASE_URL`
- delivery provider variables if you want real SMS/email instead of log mode

`ROOT_DOMAIN` should usually match `ROOT_HOST`. Example:

- root app: `erp.example.com`
- tenant app: `demo.erp.example.com`
- set both `ROOT_HOST` and `ROOT_DOMAIN` to `erp.example.com`

## 3. Start the containers

The app services bind only to loopback:

- `127.0.0.1:5001` -> public web app
- `127.0.0.1:5000` -> tenant ERP SPA
- `127.0.0.1:5002` -> Nest API

Start the database, migrate, and seed:

```bash
docker compose --env-file ops/docker/.env.production up -d postgres
docker compose --env-file ops/docker/.env.production --profile ops run --rm migrate
docker compose --env-file ops/docker/.env.production --profile ops run --rm seed
```

Then start the app containers:

```bash
docker compose --env-file ops/docker/.env.production up -d --build
```

## 4. Install host Caddy config

Use `ops/Caddyfile.production.example` as the starting point for the VPS Caddyfile. Replace:

- `admin@example.com`
- `erp.example.com`

Then reload Caddy on the host.

Important:

- The `*.your-root-domain` tenant block needs a wildcard certificate.
- With Caddy, wildcard certificates require DNS challenge configuration for your DNS provider.
- The example file includes a commented `tls { dns ... }` section to fill in.
- This explicit domain-based example does not automatically cover arbitrary institution custom domains. For custom domains, either add explicit site blocks or switch to an on-demand TLS setup.

Before starting the stack, confirm those host ports are free:

```bash
sudo ss -ltnp '( sport = :5000 or sport = :5001 or sport = :5002 )'
```

If that command prints no listening sockets, the ports are free.

## 5. Update a deployment

```bash
git pull
docker compose --env-file ops/docker/.env.production --profile ops run --rm migrate
docker compose --env-file ops/docker/.env.production --profile ops run --rm seed
docker compose --env-file ops/docker/.env.production up -d --build
```

## Notes

- API traffic is routed through same-host `/api` to preserve cookie auth behavior.
- Cookies are scoped to the exact incoming hostname by the backend. `AUTH_COOKIE_DOMAIN` is only the fallback value when no request hostname is available.
- The ERP frontend build bakes in `ROOT_HOST` and `ROOT_DOMAIN`, so rebuild containers after changing domains.
- The provided Caddy example is explicit-domain based: one block for the root app and one wildcard block for tenant subdomains.
- The stack uses the official `postgres:18-alpine` image. PostgreSQL 18 changed the image's default data layout, so Compose sets `PGDATA=/var/lib/postgresql/18/docker` and mounts the volume at `/var/lib/postgresql`.
- The runtime images use `node:lts-alpine`. That tracks the current Node LTS line automatically; if you want completely repeatable builds across time, pin it to a specific LTS major instead.
- The `seed` service is safe to rerun for platform permissions and system roles because the seed script uses idempotent inserts.
