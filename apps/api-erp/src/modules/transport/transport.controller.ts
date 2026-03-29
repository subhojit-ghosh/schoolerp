import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { API_DOCS, API_ROUTES, PERMISSIONS } from "../../constants";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermission } from "../auth/require-permission.decorator";
import { CurrentSession } from "../auth/current-session.decorator";
import type { AuthenticatedSession } from "../auth/auth.types";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
import {
  AssignmentDto,
  AssignmentListResultDto,
  CreateAssignmentBodyDto,
  CreateRouteBodyDto,
  CreateStopBodyDto,
  CreateVehicleBodyDto,
  ListAssignmentsQueryParamsDto,
  ListRoutesQueryParamsDto,
  ListVehiclesQueryParamsDto,
  RouteDetailDto,
  RouteDto,
  RouteListResultDto,
  StopDto,
  UpdateAssignmentBodyDto,
  UpdateRouteBodyDto,
  UpdateStopBodyDto,
  UpdateVehicleBodyDto,
  VehicleDto,
  VehicleListResultDto,
} from "./transport.dto";
import {
  parseCreateAssignment,
  parseCreateRoute,
  parseCreateStop,
  parseCreateVehicle,
  parseListAssignments,
  parseListRoutes,
  parseListVehicles,
  parseUpdateAssignment,
  parseUpdateRoute,
  parseUpdateStop,
  parseUpdateVehicle,
} from "./transport.schemas";
import { TransportService } from "./transport.service";

@ApiTags(API_DOCS.TAGS.TRANSPORT)
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, TenantInstitutionGuard, PermissionGuard)
@Controller(API_ROUTES.TRANSPORT)
export class TransportController {
  constructor(private readonly transportService: TransportService) {}

  // ── Routes ─────────────────────────────────────────────────────────────────

  @Get(API_ROUTES.TRANSPORT_ROUTES)
  @RequirePermission(PERMISSIONS.TRANSPORT_READ)
  @ApiOperation({ summary: "List transport routes" })
  @ApiOkResponse({ type: RouteListResultDto })
  async listRoutes(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: ListRoutesQueryParamsDto,
  ) {
    const parsed = parseListRoutes(query);
    return this.transportService.listRoutes(institution.id, parsed);
  }

  @Get(`${API_ROUTES.TRANSPORT_ROUTES}/:routeId`)
  @RequirePermission(PERMISSIONS.TRANSPORT_READ)
  @ApiOperation({ summary: "Get a transport route with its stops" })
  @ApiOkResponse({ type: RouteDetailDto })
  async getRoute(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("routeId") routeId: string,
  ) {
    return this.transportService.getRoute(institution.id, routeId);
  }

  @Post(API_ROUTES.TRANSPORT_ROUTES)
  @RequirePermission(PERMISSIONS.TRANSPORT_MANAGE)
  @ApiOperation({ summary: "Create a transport route" })
  @ApiCreatedResponse({ type: RouteDto })
  async createRoute(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: CreateRouteBodyDto,
  ) {
    const dto = parseCreateRoute(body);
    return this.transportService.createRoute(institution.id, session, dto);
  }

  @Put(`${API_ROUTES.TRANSPORT_ROUTES}/:routeId`)
  @RequirePermission(PERMISSIONS.TRANSPORT_MANAGE)
  @ApiOperation({ summary: "Update a transport route" })
  @ApiOkResponse({ type: RouteDto })
  async updateRoute(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("routeId") routeId: string,
    @Body() body: UpdateRouteBodyDto,
  ) {
    const dto = parseUpdateRoute(body);
    return this.transportService.updateRoute(
      institution.id,
      routeId,
      session,
      dto,
    );
  }

  // ── Stops ──────────────────────────────────────────────────────────────────

  @Post(`${API_ROUTES.TRANSPORT_ROUTES}/:routeId/${API_ROUTES.TRANSPORT_STOPS}`)
  @RequirePermission(PERMISSIONS.TRANSPORT_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Add a stop to a route" })
  @ApiCreatedResponse({ type: StopDto })
  async createStop(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("routeId") routeId: string,
    @Body() body: CreateStopBodyDto,
  ) {
    const dto = parseCreateStop(body);
    return this.transportService.createStop(
      institution.id,
      routeId,
      session,
      dto,
    );
  }

  @Put(
    `${API_ROUTES.TRANSPORT_ROUTES}/:routeId/${API_ROUTES.TRANSPORT_STOPS}/:stopId`,
  )
  @RequirePermission(PERMISSIONS.TRANSPORT_MANAGE)
  @ApiOperation({ summary: "Update a route stop" })
  @ApiOkResponse({ type: StopDto })
  async updateStop(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("routeId") routeId: string,
    @Param("stopId") stopId: string,
    @Body() body: UpdateStopBodyDto,
  ) {
    const dto = parseUpdateStop(body);
    return this.transportService.updateStop(
      institution.id,
      routeId,
      stopId,
      session,
      dto,
    );
  }

  // ── Vehicles ───────────────────────────────────────────────────────────────

  @Get(API_ROUTES.TRANSPORT_VEHICLES)
  @RequirePermission(PERMISSIONS.TRANSPORT_READ)
  @ApiOperation({ summary: "List transport vehicles" })
  @ApiOkResponse({ type: VehicleListResultDto })
  async listVehicles(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: ListVehiclesQueryParamsDto,
  ) {
    const parsed = parseListVehicles(query);
    return this.transportService.listVehicles(institution.id, parsed);
  }

  @Post(API_ROUTES.TRANSPORT_VEHICLES)
  @RequirePermission(PERMISSIONS.TRANSPORT_MANAGE)
  @ApiOperation({ summary: "Add a vehicle" })
  @ApiCreatedResponse({ type: VehicleDto })
  async createVehicle(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: CreateVehicleBodyDto,
  ) {
    const dto = parseCreateVehicle(body);
    return this.transportService.createVehicle(institution.id, session, dto);
  }

  @Put(`${API_ROUTES.TRANSPORT_VEHICLES}/:vehicleId`)
  @RequirePermission(PERMISSIONS.TRANSPORT_MANAGE)
  @ApiOperation({ summary: "Update a vehicle" })
  @ApiOkResponse({ type: VehicleDto })
  async updateVehicle(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("vehicleId") vehicleId: string,
    @Body() body: UpdateVehicleBodyDto,
  ) {
    const dto = parseUpdateVehicle(body);
    return this.transportService.updateVehicle(
      institution.id,
      vehicleId,
      session,
      dto,
    );
  }

  // ── Assignments ────────────────────────────────────────────────────────────

  @Get(API_ROUTES.TRANSPORT_ASSIGNMENTS)
  @RequirePermission(PERMISSIONS.TRANSPORT_READ)
  @ApiOperation({ summary: "List student transport assignments" })
  @ApiOkResponse({ type: AssignmentListResultDto })
  async listAssignments(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: ListAssignmentsQueryParamsDto,
  ) {
    const parsed = parseListAssignments(query);
    return this.transportService.listAssignments(institution.id, parsed);
  }

  @Post(API_ROUTES.TRANSPORT_ASSIGNMENTS)
  @RequirePermission(PERMISSIONS.TRANSPORT_MANAGE)
  @ApiOperation({ summary: "Assign a student to a transport route" })
  @ApiCreatedResponse({ type: AssignmentDto })
  async createAssignment(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: CreateAssignmentBodyDto,
  ) {
    const dto = parseCreateAssignment(body);
    return this.transportService.createAssignment(institution.id, session, dto);
  }

  @Put(`${API_ROUTES.TRANSPORT_ASSIGNMENTS}/:assignmentId`)
  @RequirePermission(PERMISSIONS.TRANSPORT_MANAGE)
  @ApiOperation({ summary: "Update a student transport assignment" })
  @ApiOkResponse({ type: AssignmentDto })
  async updateAssignment(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("assignmentId") assignmentId: string,
    @Body() body: UpdateAssignmentBodyDto,
  ) {
    const dto = parseUpdateAssignment(body);
    return this.transportService.updateAssignment(
      institution.id,
      assignmentId,
      session,
      dto,
    );
  }
}
