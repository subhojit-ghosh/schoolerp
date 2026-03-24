import { registerAs } from "@nestjs/config";
import { APP_FALLBACKS } from "@repo/contracts";

export const appConfig = registerAs("app", () => ({
  rootHost: process.env.APP_ROOT_HOST ?? APP_FALLBACKS.ROOT_HOST,
  rootDomain:
    process.env.APP_ROOT_DOMAIN ??
    process.env.APP_ROOT_HOST ??
    APP_FALLBACKS.ROOT_DOMAIN,
}));
