import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AppService } from "./app.service";
import { HealthResponseDto } from "./app.dto";
import { API_DOCS, API_ROUTES } from "./constants";

@ApiTags(API_DOCS.TAGS.HEALTH)
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get(API_ROUTES.HEALTH)
  @ApiOperation({ summary: "Return API health status" })
  @ApiOkResponse({ type: HealthResponseDto })
  getHealth() {
    return this.appService.getHealth();
  }
}
