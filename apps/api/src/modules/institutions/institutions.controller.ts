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
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { API_DOCS, API_ROUTES, QUERY_PARAMS } from "../../constants";
import { InstitutionsService } from "./institutions.service";
import { parseListInstitutionsQuery } from "./institutions.schemas";

@ApiTags(API_DOCS.TAGS.INSTITUTIONS)
@Controller(API_ROUTES.INSTITUTIONS)
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Get()
  @ApiOperation({ summary: "List institutions" })
  @ApiQuery({ name: QUERY_PARAMS.PAGE, required: false, type: Number })
  @ApiQuery({ name: QUERY_PARAMS.LIMIT, required: false, type: Number })
  @ApiQuery({ name: QUERY_PARAMS.SEARCH, required: false, type: String })
  @ApiQuery({ name: QUERY_PARAMS.SORT, required: false, type: String })
  @ApiQuery({ name: QUERY_PARAMS.ORDER, required: false, type: String })
  @ApiOkResponse({ description: "Paginated institution list" })
  async listInstitutions(@Query() query: Record<string, unknown>) {
    const parsedQuery = parseListInstitutionsQuery(query);
    return this.institutionsService.listInstitutions(parsedQuery);
  }

  @Get(API_ROUTES.COUNTS)
  @ApiOperation({ summary: "Count institutions by status" })
  @ApiOkResponse({ description: "Institution counters" })
  getInstitutionCounts() {
    return this.institutionsService.countInstitutionsByStatus();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get institution by id" })
  @ApiOkResponse({ description: "Institution details" })
  @ApiNotFoundResponse({ description: "Institution not found" })
  async getInstitutionById(@Param("id") id: string) {
    const institution = await this.institutionsService.getInstitutionById(id);

    if (!institution) {
      throw new NotFoundException("Institution not found");
    }

    return institution;
  }
}
