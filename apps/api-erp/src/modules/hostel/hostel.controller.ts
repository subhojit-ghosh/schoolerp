import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
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
  CreateBuildingBodyDto,
  UpdateBuildingBodyDto,
  UpdateBuildingStatusBodyDto,
  BuildingDto,
  BuildingListResultDto,
  CreateRoomBodyDto,
  UpdateRoomBodyDto,
  UpdateRoomStatusBodyDto,
  RoomDto,
  RoomListResultDto,
  CreateAllocationBodyDto,
  AllocationDto,
  AllocationListResultDto,
  CreateMessPlanBodyDto,
  UpdateMessPlanBodyDto,
  UpdateMessPlanStatusBodyDto,
  MessPlanDto,
  MessPlanListResultDto,
  ListBuildingsQueryParamsDto,
  ListRoomsQueryParamsDto,
  ListAllocationsQueryParamsDto,
  ListMessPlansQueryParamsDto,
} from "./hostel.dto";
import {
  parseCreateBuilding,
  parseUpdateBuilding,
  parseUpdateBuildingStatus,
  parseListBuildings,
  parseCreateRoom,
  parseUpdateRoom,
  parseUpdateRoomStatus,
  parseListRooms,
  parseCreateAllocation,
  parseListAllocations,
  parseCreateMessPlan,
  parseUpdateMessPlan,
  parseUpdateMessPlanStatus,
  parseListMessPlans,
} from "./hostel.schemas";
import { HostelService } from "./hostel.service";

@ApiTags(API_DOCS.TAGS.HOSTEL)
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, TenantInstitutionGuard, PermissionGuard)
@Controller(API_ROUTES.HOSTEL)
export class HostelController {
  constructor(private readonly hostelService: HostelService) {}

  // ── Buildings ─────────────────────────────────────────────────────────

  @Get(API_ROUTES.BUILDINGS)
  @RequirePermission(PERMISSIONS.HOSTEL_READ)
  @ApiOperation({ summary: "List hostel buildings" })
  @ApiOkResponse({ type: BuildingListResultDto })
  async listBuildings(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: ListBuildingsQueryParamsDto,
  ) {
    const parsed = parseListBuildings(query);
    return this.hostelService.listBuildings(institution.id, parsed);
  }

  @Post(API_ROUTES.BUILDINGS)
  @RequirePermission(PERMISSIONS.HOSTEL_MANAGE)
  @ApiOperation({ summary: "Create a hostel building" })
  @ApiCreatedResponse({ type: BuildingDto })
  async createBuilding(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: CreateBuildingBodyDto,
  ) {
    const dto = parseCreateBuilding(body);
    return this.hostelService.createBuilding(institution.id, session, dto);
  }

  @Get(`${API_ROUTES.BUILDINGS}/:buildingId`)
  @RequirePermission(PERMISSIONS.HOSTEL_READ)
  @ApiOperation({ summary: "Get hostel building detail" })
  @ApiOkResponse({ type: BuildingDto })
  async getBuilding(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("buildingId") buildingId: string,
  ) {
    return this.hostelService.getBuilding(institution.id, buildingId);
  }

  @Patch(`${API_ROUTES.BUILDINGS}/:buildingId`)
  @RequirePermission(PERMISSIONS.HOSTEL_MANAGE)
  @ApiOperation({ summary: "Update a hostel building" })
  @ApiOkResponse({ type: BuildingDto })
  async updateBuilding(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("buildingId") buildingId: string,
    @Body() body: UpdateBuildingBodyDto,
  ) {
    const dto = parseUpdateBuilding(body);
    return this.hostelService.updateBuilding(institution.id, buildingId, session, dto);
  }

  @Patch(`${API_ROUTES.BUILDINGS}/:buildingId/${API_ROUTES.STATUS}`)
  @RequirePermission(PERMISSIONS.HOSTEL_MANAGE)
  @ApiOperation({ summary: "Update hostel building status" })
  @ApiOkResponse({ type: BuildingDto })
  async updateBuildingStatus(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("buildingId") buildingId: string,
    @Body() body: UpdateBuildingStatusBodyDto,
  ) {
    const dto = parseUpdateBuildingStatus(body);
    return this.hostelService.updateBuildingStatus(
      institution.id,
      buildingId,
      session,
      dto,
    );
  }

  // ── Rooms ──────────────────────────────────────────────────────────────

  @Get(API_ROUTES.ROOMS)
  @RequirePermission(PERMISSIONS.HOSTEL_READ)
  @ApiOperation({ summary: "List hostel rooms" })
  @ApiOkResponse({ type: RoomListResultDto })
  async listRooms(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: ListRoomsQueryParamsDto,
  ) {
    const parsed = parseListRooms(query);
    return this.hostelService.listRooms(institution.id, parsed);
  }

  @Post(API_ROUTES.ROOMS)
  @RequirePermission(PERMISSIONS.HOSTEL_MANAGE)
  @ApiOperation({ summary: "Create a hostel room" })
  @ApiCreatedResponse({ type: RoomDto })
  async createRoom(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: CreateRoomBodyDto,
  ) {
    const dto = parseCreateRoom(body);
    return this.hostelService.createRoom(institution.id, session, dto);
  }

  @Patch(`${API_ROUTES.ROOMS}/:roomId`)
  @RequirePermission(PERMISSIONS.HOSTEL_MANAGE)
  @ApiOperation({ summary: "Update a hostel room" })
  @ApiOkResponse({ type: RoomDto })
  async updateRoom(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("roomId") roomId: string,
    @Body() body: UpdateRoomBodyDto,
  ) {
    const dto = parseUpdateRoom(body);
    return this.hostelService.updateRoom(institution.id, roomId, session, dto);
  }

  @Patch(`${API_ROUTES.ROOMS}/:roomId/${API_ROUTES.STATUS}`)
  @RequirePermission(PERMISSIONS.HOSTEL_MANAGE)
  @ApiOperation({ summary: "Update hostel room status" })
  @ApiOkResponse({ type: RoomDto })
  async updateRoomStatus(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("roomId") roomId: string,
    @Body() body: UpdateRoomStatusBodyDto,
  ) {
    const dto = parseUpdateRoomStatus(body);
    return this.hostelService.updateRoomStatus(institution.id, roomId, session, dto);
  }

  // ── Allocations ────────────────────────────────────────────────────────

  @Get(API_ROUTES.ALLOCATIONS)
  @RequirePermission(PERMISSIONS.HOSTEL_READ)
  @ApiOperation({ summary: "List bed allocations" })
  @ApiOkResponse({ type: AllocationListResultDto })
  async listAllocations(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: ListAllocationsQueryParamsDto,
  ) {
    const parsed = parseListAllocations(query);
    return this.hostelService.listAllocations(institution.id, parsed);
  }

  @Post(API_ROUTES.ALLOCATIONS)
  @RequirePermission(PERMISSIONS.HOSTEL_MANAGE)
  @ApiOperation({ summary: "Create a bed allocation" })
  @ApiCreatedResponse({ type: AllocationDto })
  async createAllocation(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: CreateAllocationBodyDto,
  ) {
    const dto = parseCreateAllocation(body);
    return this.hostelService.createAllocation(institution.id, session, dto);
  }

  @Post(`${API_ROUTES.ALLOCATIONS}/:allocationId/${API_ROUTES.VACATE}`)
  @RequirePermission(PERMISSIONS.HOSTEL_MANAGE)
  @ApiOperation({ summary: "Vacate a bed allocation" })
  @ApiOkResponse({ type: AllocationDto })
  async vacateAllocation(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("allocationId") allocationId: string,
  ) {
    return this.hostelService.vacateAllocation(institution.id, allocationId, session);
  }

  // ── Mess Plans ─────────────────────────────────────────────────────────

  @Get(API_ROUTES.MESS_PLANS)
  @RequirePermission(PERMISSIONS.HOSTEL_READ)
  @ApiOperation({ summary: "List mess plans" })
  @ApiOkResponse({ type: MessPlanListResultDto })
  async listMessPlans(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: ListMessPlansQueryParamsDto,
  ) {
    const parsed = parseListMessPlans(query);
    return this.hostelService.listMessPlans(institution.id, parsed);
  }

  @Post(API_ROUTES.MESS_PLANS)
  @RequirePermission(PERMISSIONS.HOSTEL_MANAGE)
  @ApiOperation({ summary: "Create a mess plan" })
  @ApiCreatedResponse({ type: MessPlanDto })
  async createMessPlan(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: CreateMessPlanBodyDto,
  ) {
    const dto = parseCreateMessPlan(body);
    return this.hostelService.createMessPlan(institution.id, session, dto);
  }

  @Patch(`${API_ROUTES.MESS_PLANS}/:planId`)
  @RequirePermission(PERMISSIONS.HOSTEL_MANAGE)
  @ApiOperation({ summary: "Update a mess plan" })
  @ApiOkResponse({ type: MessPlanDto })
  async updateMessPlan(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("planId") planId: string,
    @Body() body: UpdateMessPlanBodyDto,
  ) {
    const dto = parseUpdateMessPlan(body);
    return this.hostelService.updateMessPlan(institution.id, planId, session, dto);
  }

  @Patch(`${API_ROUTES.MESS_PLANS}/:planId/${API_ROUTES.STATUS}`)
  @RequirePermission(PERMISSIONS.HOSTEL_MANAGE)
  @ApiOperation({ summary: "Update mess plan status" })
  @ApiOkResponse({ type: MessPlanDto })
  async updateMessPlanStatus(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("planId") planId: string,
    @Body() body: UpdateMessPlanStatusBodyDto,
  ) {
    const dto = parseUpdateMessPlanStatus(body);
    return this.hostelService.updateMessPlanStatus(institution.id, planId, session, dto);
  }
}
