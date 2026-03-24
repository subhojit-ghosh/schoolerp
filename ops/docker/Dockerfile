FROM oven/bun:1.3.10-alpine AS workspace

WORKDIR /app

ARG NEXT_PUBLIC_ROOT_HOST=erp.test
ARG NEXT_PUBLIC_ROOT_DOMAIN=erp.test
ARG VITE_API_URL=/api
ARG VITE_ROOT_HOST=erp.test
ARG VITE_ROOT_DOMAIN=erp.test

ENV NEXT_PUBLIC_ROOT_HOST=${NEXT_PUBLIC_ROOT_HOST}
ENV NEXT_PUBLIC_ROOT_DOMAIN=${NEXT_PUBLIC_ROOT_DOMAIN}
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_ROOT_HOST=${VITE_ROOT_HOST}
ENV VITE_ROOT_DOMAIN=${VITE_ROOT_DOMAIN}

COPY . .

RUN bun install --frozen-lockfile
RUN bun run build

FROM workspace AS tooling

FROM node:lts-alpine AS web

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

RUN apk add --no-cache libc6-compat

COPY --from=workspace /app /app

WORKDIR /app/apps/web

CMD ["/app/apps/web/node_modules/.bin/next", "start", "--port", "3001", "--hostname", "0.0.0.0"]

FROM node:lts-alpine AS api

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY --from=workspace /app /app

WORKDIR /app/apps/api-erp

CMD ["node", "dist/main.js"]

FROM nginx:1.27-alpine AS erp

COPY ops/docker/nginx.erp.conf /etc/nginx/conf.d/default.conf
COPY --from=workspace /app/apps/erp/dist /usr/share/nginx/html
