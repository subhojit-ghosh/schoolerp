import type { components } from "@/lib/api/generated/schema";

export type AuthSession = components["schemas"]["AuthContextDto"];
export type SignInBody = components["schemas"]["SignInBodyDto"];
export type SignUpBody = components["schemas"]["SignUpBodyDto"];
