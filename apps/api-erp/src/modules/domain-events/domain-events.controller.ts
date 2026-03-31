import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { API_DOCS, API_ROUTES, PERMISSIONS } from "../../constants";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermission } from "../auth/require-permission.decorator";
import { ScopeGuard } from "../auth/scope.guard";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
import {
  ListDomainEventsQueryDto,
  ListDomainEventsResultDto,
  RetryDomainEventResultDto,
} from "./domain-events.dto";
import { parseListDomainEventsQuery } from "./domain-events.schemas";
import { DomainEventsService } from "./domain-events.service";

@ApiTags(API_DOCS.TAGS.DOMAIN_EVENTS)
@ApiCookieAuth()
@UseGuards(
  SessionAuthGuard,
  TenantInstitutionGuard,
  PermissionGuard,
  ScopeGuard,
)
@Controller(API_ROUTES.DOMAIN_EVENTS)
export class DomainEventsController {
  constructor(
    private readonly domainEventsService: DomainEventsService,
  ) {}

  @Get()
  @RequirePermission(PERMISSIONS.AUDIT_READ)
  @ApiOperation({ summary: "List domain events for the current tenant" })
  @ApiQuery({ name: "q", required: false, type: String })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "sort", required: false, type: String })
  @ApiQuery({ name: "order", required: false, type: String })
  @ApiQuery({ name: "eventType", required: false, type: String })
  @ApiQuery({ name: "status", required: false, type: String })
  @ApiOkResponse({ type: ListDomainEventsResultDto })
  listEvents(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: ListDomainEventsQueryDto,
  ) {
    return this.domainEventsService.listEvents(
      institution.id,
      parseListDomainEventsQuery(query),
    );
  }

  @Post(`:id/${API_ROUTES.RETRY}`)
  @RequirePermission(PERMISSIONS.AUDIT_READ)
  @ApiOperation({ summary: "Manually retry a failed domain event" })
  @ApiOkResponse({ type: RetryDomainEventResultDto })
  retryEvent(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("id") eventId: string,
  ) {
    return this.domainEventsService.retryEvent(institution.id, eventId);
  }
}
