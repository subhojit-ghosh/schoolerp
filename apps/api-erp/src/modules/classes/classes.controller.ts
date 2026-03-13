import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { API_DOCS, API_ROUTES } from "../../constants";
import { CurrentSession } from "../auth/current-session.decorator";
import type { AuthenticatedSession } from "../auth/auth.types";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import {
  ClassDto,
  CreateClassBodyDto,
  UpdateClassBodyDto,
} from "./classes.dto";
import { parseCreateClass, parseUpdateClass } from "./classes.schemas";
import { ClassesService } from "./classes.service";

@ApiTags(API_DOCS.TAGS.CLASSES)
@Controller(`${API_ROUTES.INSTITUTIONS}/:institutionId/${API_ROUTES.CLASSES}`)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @UseGuards(SessionAuthGuard)
  @Get()
  @ApiCookieAuth()
  @ApiOperation({ summary: "List classes for an institution" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiOkResponse({ type: ClassDto, isArray: true })
  listClasses(
    @Param("institutionId") institutionId: string,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.classesService.listClasses(institutionId, authSession);
  }

  @UseGuards(SessionAuthGuard)
  @Post()
  @ApiCookieAuth()
  @ApiOperation({ summary: "Create a class with sections" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiBody({ type: CreateClassBodyDto })
  @ApiOkResponse({ type: ClassDto })
  createClass(
    @Param("institutionId") institutionId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: CreateClassBodyDto,
  ) {
    return this.classesService.createClass(
      institutionId,
      authSession,
      parseCreateClass(body),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Get(":classId")
  @ApiCookieAuth()
  @ApiOperation({ summary: "Get a class with sections" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiParam({ name: "classId", type: String })
  @ApiOkResponse({ type: ClassDto })
  getClass(
    @Param("institutionId") institutionId: string,
    @Param("classId") classId: string,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.classesService.getClass(institutionId, classId, authSession);
  }

  @UseGuards(SessionAuthGuard)
  @Patch(":classId")
  @ApiCookieAuth()
  @ApiOperation({ summary: "Update a class and reconcile sections" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiParam({ name: "classId", type: String })
  @ApiBody({ type: UpdateClassBodyDto })
  @ApiOkResponse({ type: ClassDto })
  updateClass(
    @Param("institutionId") institutionId: string,
    @Param("classId") classId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: UpdateClassBodyDto,
  ) {
    return this.classesService.updateClass(
      institutionId,
      classId,
      authSession,
      parseUpdateClass(body),
    );
  }
}
