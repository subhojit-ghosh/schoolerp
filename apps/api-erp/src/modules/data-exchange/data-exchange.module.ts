import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { FeesModule } from "../fees/fees.module";
import { GuardiansModule } from "../guardians/guardians.module";
import { StaffModule } from "../staff/staff.module";
import { StudentsModule } from "../students/students.module";
import { DataExchangeController } from "./data-exchange.controller";
import { DataExchangeService } from "./data-exchange.service";

@Module({
  imports: [AuthModule, StudentsModule, StaffModule, GuardiansModule, FeesModule],
  controllers: [DataExchangeController],
  providers: [DataExchangeService],
})
export class DataExchangeModule {}
