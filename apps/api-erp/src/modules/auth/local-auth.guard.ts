import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AUTH_STRATEGIES } from "./auth.constants";
import { parseSignIn } from "./auth.schemas";

@Injectable()
export class LocalAuthGuard extends AuthGuard(AUTH_STRATEGIES.LOCAL) {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ body: unknown }>();

    parseSignIn(request.body);

    return super.canActivate(context);
  }
}
