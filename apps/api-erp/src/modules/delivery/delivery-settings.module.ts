import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DeliveryModule } from "./delivery.module";
import { DeliveryConfigController } from "./delivery-config.controller";

@Module({
  imports: [AuthModule, DeliveryModule],
  controllers: [DeliveryConfigController],
})
export class DeliverySettingsModule {}
