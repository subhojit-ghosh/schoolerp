import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { CommunicationsModule } from "../communications/communications.module";
import { PaymentGatewayConfigService } from "./payment-gateway-config.service";
import { PaymentOrderService } from "./payment-order.service";
import { PaymentOrderController } from "./payment-order.controller";

@Module({
  imports: [AuthModule, CommunicationsModule],
  controllers: [PaymentOrderController],
  providers: [PaymentGatewayConfigService, PaymentOrderService],
  exports: [PaymentGatewayConfigService, PaymentOrderService],
})
export class PaymentGatewayModule {}
