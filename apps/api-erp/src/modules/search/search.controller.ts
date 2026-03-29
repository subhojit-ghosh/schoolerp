import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { API_DOCS } from "../../constants";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
import { SearchService } from "./search.service";

@ApiTags(API_DOCS.TAGS.SEARCH)
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, TenantInstitutionGuard)
@Controller("search")
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: "Global search across students, staff, receipts" })
  @ApiQuery({ name: "q", required: true, type: String })
  async globalSearch(
    @CurrentInstitution() institution: TenantInstitution,
    @Query("q") q: string,
  ) {
    return this.searchService.globalSearch(institution.id, q ?? "");
  }
}
