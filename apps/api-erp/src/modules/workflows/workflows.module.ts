import { Module } from "@nestjs/common";
import { CommunicationsModule } from "../communications/communications.module";
import { DomainEventsModule } from "../domain-events/domain-events.module";
import { WorkflowListeners } from "./workflow-listeners";
import { WorkflowsService } from "./workflows.service";

@Module({
  imports: [DomainEventsModule, CommunicationsModule],
  providers: [WorkflowsService, WorkflowListeners],
})
export class WorkflowsModule {}
