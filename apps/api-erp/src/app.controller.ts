import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Query,
} from "@nestjs/common";
import {
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { AppService } from "./app.service";
import { HealthResponseDto } from "./app.dto";
import { API_DOCS, API_ROUTES } from "./constants";
import { TenantContextService } from "./modules/tenant-context/tenant-context.service";

@ApiTags(API_DOCS.TAGS.HEALTH)
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Get(API_ROUTES.HEALTH)
  @ApiOperation({ summary: "Return API health status" })
  @ApiOkResponse({ type: HealthResponseDto })
  getHealth() {
    return this.appService.getHealth();
  }

  @Get(`${API_ROUTES.INTERNAL}/${API_ROUTES.TLS}/${API_ROUTES.ALLOW}`)
  @ApiExcludeEndpoint()
  async allowTlsCertificate(@Query("domain") domain?: string) {
    if (!domain) {
      throw new BadRequestException("Domain is required.");
    }

    const isAllowed = await this.tenantContextService.isManagedHostname(domain);

    if (!isAllowed) {
      throw new ForbiddenException("Domain is not managed by this platform.");
    }

    return {
      ok: true,
    };
  }
}
