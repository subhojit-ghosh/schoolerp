import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { DomainEventsService } from "../domain-events/domain-events.service";
import { WorkflowListeners } from "./workflow-listeners";

@Injectable()
export class WorkflowsService implements OnModuleInit {
  private readonly logger = new Logger(WorkflowsService.name);

  constructor(
    private readonly domainEventsService: DomainEventsService,
    private readonly workflowListeners: WorkflowListeners,
  ) {}

  onModuleInit() {
    this.registerListeners();
  }

  private registerListeners() {
    const listenerMap = this.workflowListeners.getListenerMap();

    for (const [eventType, handler] of listenerMap) {
      this.domainEventsService.registerListener(eventType, handler);
    }

    this.logger.log(
      `Registered ${listenerMap.size} workflow listeners`,
    );
  }
}
