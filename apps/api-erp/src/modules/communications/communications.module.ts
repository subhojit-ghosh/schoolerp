import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AuditModule } from "../audit/audit.module";
import { DeliveryModule } from "../delivery/delivery.module";
import { CommunicationsController } from "./communications.controller";
import { CommunicationsService } from "./communications.service";
import { NotificationFactory } from "./notification.factory";

@Module({
  imports: [AuthModule, AuditModule, DeliveryModule],
  controllers: [CommunicationsController],
  providers: [CommunicationsService, NotificationFactory],
  exports: [NotificationFactory],
})
export class CommunicationsModule {}
