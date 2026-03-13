import {
  Body,
  Controller,
  Delete,
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
import type { AuthenticatedSession } from "../auth/auth.types";
import { CurrentSession } from "../auth/current-session.decorator";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import {
  GuardianDto,
  LinkGuardianStudentBodyDto,
  UpdateGuardianBodyDto,
  UpdateGuardianStudentLinkBodyDto,
} from "./guardians.dto";
import {
  parseLinkGuardianStudent,
  parseUpdateGuardian,
  parseUpdateGuardianStudentLink,
} from "./guardians.schemas";
import { GuardiansService } from "./guardians.service";

@ApiTags(API_DOCS.TAGS.GUARDIANS)
@Controller(`${API_ROUTES.INSTITUTIONS}/:institutionId/${API_ROUTES.GUARDIANS}`)
export class GuardiansController {
  constructor(private readonly guardiansService: GuardiansService) {}

  @UseGuards(SessionAuthGuard)
  @Get()
  @ApiCookieAuth()
  @ApiOperation({ summary: "List guardians for an institution" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiOkResponse({ type: GuardianDto, isArray: true })
  listGuardians(
    @Param("institutionId") institutionId: string,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.guardiansService.listGuardians(institutionId, authSession);
  }

  @UseGuards(SessionAuthGuard)
  @Get(":guardianId")
  @ApiCookieAuth()
  @ApiOperation({ summary: "Get a single guardian for an institution" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiParam({ name: "guardianId", type: String })
  @ApiOkResponse({ type: GuardianDto })
  getGuardian(
    @Param("institutionId") institutionId: string,
    @Param("guardianId") guardianId: string,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.guardiansService.getGuardian(
      institutionId,
      guardianId,
      authSession,
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch(":guardianId")
  @ApiCookieAuth()
  @ApiOperation({ summary: "Update guardian details" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiParam({ name: "guardianId", type: String })
  @ApiBody({ type: UpdateGuardianBodyDto })
  @ApiOkResponse({ type: GuardianDto })
  updateGuardian(
    @Param("institutionId") institutionId: string,
    @Param("guardianId") guardianId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: UpdateGuardianBodyDto,
  ) {
    return this.guardiansService.updateGuardian(
      institutionId,
      guardianId,
      authSession,
      parseUpdateGuardian(body),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Post(":guardianId/students")
  @ApiCookieAuth()
  @ApiOperation({ summary: "Link a guardian to a student" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiParam({ name: "guardianId", type: String })
  @ApiBody({ type: LinkGuardianStudentBodyDto })
  @ApiOkResponse({ type: GuardianDto })
  linkStudent(
    @Param("institutionId") institutionId: string,
    @Param("guardianId") guardianId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: LinkGuardianStudentBodyDto,
  ) {
    return this.guardiansService.linkStudent(
      institutionId,
      guardianId,
      authSession,
      parseLinkGuardianStudent(body),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch(":guardianId/students/:studentId")
  @ApiCookieAuth()
  @ApiOperation({ summary: "Update a guardian-student relationship" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiParam({ name: "guardianId", type: String })
  @ApiParam({ name: "studentId", type: String })
  @ApiBody({ type: UpdateGuardianStudentLinkBodyDto })
  @ApiOkResponse({ type: GuardianDto })
  updateStudentLink(
    @Param("institutionId") institutionId: string,
    @Param("guardianId") guardianId: string,
    @Param("studentId") studentId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: UpdateGuardianStudentLinkBodyDto,
  ) {
    return this.guardiansService.updateStudentLink(
      institutionId,
      guardianId,
      studentId,
      authSession,
      parseUpdateGuardianStudentLink(body),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Delete(":guardianId/students/:studentId")
  @ApiCookieAuth()
  @ApiOperation({ summary: "Unlink a guardian from a student" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiParam({ name: "guardianId", type: String })
  @ApiParam({ name: "studentId", type: String })
  @ApiOkResponse({ type: GuardianDto })
  unlinkStudent(
    @Param("institutionId") institutionId: string,
    @Param("guardianId") guardianId: string,
    @Param("studentId") studentId: string,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.guardiansService.unlinkStudent(
      institutionId,
      guardianId,
      studentId,
      authSession,
    );
  }
}
