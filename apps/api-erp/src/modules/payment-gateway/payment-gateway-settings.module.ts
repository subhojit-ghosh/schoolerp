import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PaymentGatewayModule } from "./payment-gateway.module";
import { PaymentGatewayConfigController } from "./payment-gateway-config.controller";

@Module({
  imports: [AuthModule, PaymentGatewayModule],
  controllers: [PaymentGatewayConfigController],
})
export class PaymentGatewaySettingsModule {}
