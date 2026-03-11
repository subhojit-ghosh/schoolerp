import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from "@nestjs/common";
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { API_DOCS, API_ROUTES } from "../../constants";
import {
  InstitutionCountsDto,
  InstitutionDto,
  ListInstitutionsQueryDto,
  ListInstitutionsResultDto,
} from "./institutions.dto";
import { InstitutionsService } from "./institutions.service";
import { parseListInstitutionsQuery } from "./institutions.schemas";

@ApiTags(API_DOCS.TAGS.INSTITUTIONS)
@Controller(API_ROUTES.INSTITUTIONS)
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Get()
  @ApiOperation({ summary: "List institutions" })
  @ApiOkResponse({
    description: "Paginated institution list",
    type: ListInstitutionsResultDto,
  })
  async listInstitutions(@Query() query: ListInstitutionsQueryDto) {
    const parsedQuery = parseListInstitutionsQuery(query);
    return this.institutionsService.listInstitutions(parsedQuery);
  }

  @Get(API_ROUTES.COUNTS)
  @ApiOperation({ summary: "Count institutions by status" })
  @ApiOkResponse({
    description: "Institution counters",
    type: InstitutionCountsDto,
  })
  getInstitutionCounts() {
    return this.institutionsService.countInstitutionsByStatus();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get institution by id" })
  @ApiOkResponse({
    description: "Institution details",
    type: InstitutionDto,
  })
  @ApiNotFoundResponse({ description: "Institution not found" })
  async getInstitutionById(@Param("id") id: string) {
    const institution = await this.institutionsService.getInstitutionById(id);

    if (!institution) {
      throw new NotFoundException("Institution not found");
    }

    return institution;
  }
}
