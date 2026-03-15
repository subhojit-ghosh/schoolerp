import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { ResolvedScopes } from "./auth.types";

export const CurrentScopes = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<{
      resolvedScopes?: ResolvedScopes;
    }>();

    return (
      request.resolvedScopes ?? {
        campusIds: "all",
        classIds: "all",
        sectionIds: "all",
      }
    );
  },
);
