import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { CampusesController } from "./campuses.controller";
import { CampusesService } from "./campuses.service";

@Module({
  imports: [AuthModule],
  controllers: [CampusesController],
  providers: [CampusesService],
})
export class CampusesModule {}
