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
  ApiTags,
} from "@nestjs/swagger";
import { API_DOCS, API_ROUTES } from "../../constants";
import type { AuthenticatedSession } from "../auth/auth.types";
import { CurrentSession } from "../auth/current-session.decorator";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
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
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, TenantInstitutionGuard)
@Controller(API_ROUTES.GUARDIANS)
export class GuardiansController {
  constructor(private readonly guardiansService: GuardiansService) {}

  @Get()
  @ApiOperation({
    summary: "List guardians for the current tenant institution",
  })
  @ApiOkResponse({ type: GuardianDto, isArray: true })
  listGuardians(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.guardiansService.listGuardians(institution.id, authSession);
  }

  @Get(":guardianId")
  @ApiOperation({ summary: "Get a single guardian for the current tenant" })
  @ApiOkResponse({ type: GuardianDto })
  getGuardian(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("guardianId") guardianId: string,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.guardiansService.getGuardian(
      institution.id,
      guardianId,
      authSession,
    );
  }

  @Patch(":guardianId")
  @ApiOperation({ summary: "Update guardian details" })
  @ApiBody({ type: UpdateGuardianBodyDto })
  @ApiOkResponse({ type: GuardianDto })
  updateGuardian(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("guardianId") guardianId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: UpdateGuardianBodyDto,
  ) {
    return this.guardiansService.updateGuardian(
      institution.id,
      guardianId,
      authSession,
      parseUpdateGuardian(body),
    );
  }

  @Post(":guardianId/students")
  @ApiOperation({ summary: "Link a guardian to a student" })
  @ApiBody({ type: LinkGuardianStudentBodyDto })
  @ApiOkResponse({ type: GuardianDto })
  linkStudent(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("guardianId") guardianId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: LinkGuardianStudentBodyDto,
  ) {
    return this.guardiansService.linkStudent(
      institution.id,
      guardianId,
      authSession,
      parseLinkGuardianStudent(body),
    );
  }

  @Patch(":guardianId/students/:studentId")
  @ApiOperation({ summary: "Update a guardian-student relationship" })
  @ApiBody({ type: UpdateGuardianStudentLinkBodyDto })
  @ApiOkResponse({ type: GuardianDto })
  updateStudentLink(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("guardianId") guardianId: string,
    @Param("studentId") studentId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: UpdateGuardianStudentLinkBodyDto,
  ) {
    return this.guardiansService.updateStudentLink(
      institution.id,
      guardianId,
      studentId,
      authSession,
      parseUpdateGuardianStudentLink(body),
    );
  }

  @Delete(":guardianId/students/:studentId")
  @ApiOperation({ summary: "Unlink a guardian from a student" })
  @ApiOkResponse({ type: GuardianDto })
  unlinkStudent(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("guardianId") guardianId: string,
    @Param("studentId") studentId: string,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.guardiansService.unlinkStudent(
      institution.id,
      guardianId,
      studentId,
      authSession,
    );
  }
}
