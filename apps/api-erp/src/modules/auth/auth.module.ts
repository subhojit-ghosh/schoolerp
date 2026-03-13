import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { TenantContextModule } from "../tenant-context/tenant-context.module";
import { AuthController } from "./auth.controller";
import { AuthRateLimitService } from "./auth-rate-limit.service";
import { AuthService } from "./auth.service";
import { LocalStrategy } from "./local.strategy";
import { PasswordResetDeliveryService } from "./password-reset-delivery.service";
import { SessionAuthGuard } from "./session-auth.guard";

@Module({
  imports: [PassportModule.register({ session: false }), TenantContextModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRateLimitService,
    PasswordResetDeliveryService,
    LocalStrategy,
    SessionAuthGuard,
  ],
  exports: [AuthService, SessionAuthGuard, TenantContextModule],
})
export class AuthModule {}
