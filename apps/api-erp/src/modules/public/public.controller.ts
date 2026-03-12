import { Controller, Get, Query, Req } from "@nestjs/common";
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { API_DOCS, API_ROUTES, QUERY_PARAMS } from "../../constants";
import { TenantBrandingDto } from "./public.dto";
import { PublicService } from "./public.service";

@ApiTags(API_DOCS.TAGS.PUBLIC)
@Controller(API_ROUTES.PUBLIC)
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get(API_ROUTES.TENANT_BRANDING)
  @ApiOperation({
    summary:
      "Return tenant branding for the current subdomain or local dev override.",
  })
  @ApiQuery({
    name: QUERY_PARAMS.TENANT,
    required: false,
    description: "Optional tenant slug override for localhost development.",
  })
  @ApiOkResponse({ type: TenantBrandingDto })
  getTenantBranding(
    @Req() request: { headers: { host?: string } },
    @Query(QUERY_PARAMS.TENANT) tenantSlug?: string,
  ) {
    return this.publicService.getTenantBranding(
      request.headers.host,
      tenantSlug,
    );
  }
}
