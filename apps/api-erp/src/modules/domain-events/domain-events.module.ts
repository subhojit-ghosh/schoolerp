import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DomainEventsController } from "./domain-events.controller";
import { DomainEventsService } from "./domain-events.service";

@Module({
  imports: [AuthModule],
  controllers: [DomainEventsController],
  providers: [DomainEventsService],
  exports: [DomainEventsService],
})
export class DomainEventsModule {}
