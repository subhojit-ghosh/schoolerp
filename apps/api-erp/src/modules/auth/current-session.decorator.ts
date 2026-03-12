import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { AuthenticatedSession } from "./auth.types";

export const CurrentSession = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<{
      authSession?: AuthenticatedSession;
    }>();

    return request.authSession;
  },
);
