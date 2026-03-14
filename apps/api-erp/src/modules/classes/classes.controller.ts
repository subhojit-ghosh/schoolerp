import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { API_DOCS, API_ROUTES } from "../../constants";
import { CurrentSession } from "../auth/current-session.decorator";
import type { AuthenticatedSession } from "../auth/auth.types";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
import {
  ClassDto,
  CreateClassBodyDto,
  ListClassesResultDto,
  ListClassesQueryDto,
  SetClassStatusBodyDto,
  UpdateClassBodyDto,
} from "./classes.dto";
import {
  parseCreateClass,
  parseListClassesQuery,
  parseSetClassStatus,
  parseUpdateClass,
} from "./classes.schemas";
import { ClassesService } from "./classes.service";

@ApiTags(API_DOCS.TAGS.CLASSES)
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, TenantInstitutionGuard)
@Controller(API_ROUTES.CLASSES)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get()
  @ApiOperation({ summary: "List classes for the current tenant institution" })
  @ApiQuery({ name: "campusId", required: false, type: String })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "q", required: false, type: String })
  @ApiQuery({ name: "sort", required: false, type: String })
  @ApiQuery({ name: "order", required: false, type: String })
  @ApiOkResponse({ type: ListClassesResultDto })
  listClasses(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @Query() query: ListClassesQueryDto,
  ) {
    const parsedQuery = parseListClassesQuery(query);

    return this.classesService.listClasses(
      institution.id,
      authSession,
      parsedQuery,
    );
  }

  @Post()
  @ApiOperation({
    summary: "Create a class with sections for the current tenant",
  })
  @ApiBody({ type: CreateClassBodyDto })
  @ApiOkResponse({ type: ClassDto })
  createClass(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: CreateClassBodyDto,
  ) {
    return this.classesService.createClass(
      institution.id,
      authSession,
      parseCreateClass(body),
    );
  }

  @Get(":classId")
  @ApiOperation({ summary: "Get a class with sections for the current tenant" })
  @ApiOkResponse({ type: ClassDto })
  getClass(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("classId") classId: string,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.classesService.getClass(institution.id, classId, authSession);
  }

  @Patch(":classId")
  @ApiOperation({
    summary: "Update a class and reconcile sections for the current tenant",
  })
  @ApiBody({ type: UpdateClassBodyDto })
  @ApiOkResponse({ type: ClassDto })
  updateClass(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("classId") classId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: UpdateClassBodyDto,
  ) {
    return this.classesService.updateClass(
      institution.id,
      classId,
      authSession,
      parseUpdateClass(body),
    );
  }

  @Patch(":classId/status")
  @ApiOperation({ summary: "Enable or disable a class for the current tenant" })
  @ApiBody({ type: SetClassStatusBodyDto })
  @ApiOkResponse({ type: ClassDto })
  setClassStatus(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("classId") classId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: SetClassStatusBodyDto,
  ) {
    return this.classesService.setClassStatus(
      institution.id,
      classId,
      authSession,
      parseSetClassStatus(body),
    );
  }

  @Delete(":classId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a class for the current tenant" })
  @ApiNoContentResponse()
  deleteClass(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("classId") classId: string,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.classesService.deleteClass(
      institution.id,
      classId,
      authSession,
    );
  }
}
