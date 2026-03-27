import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { API_DOCS, API_ROUTES, PERMISSIONS } from "../../constants";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermission } from "../auth/require-permission.decorator";
import { ScopeGuard } from "../auth/scope.guard";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
import { PaymentGatewayConfigService } from "./payment-gateway-config.service";
import {
  PaymentConfigDto,
  UpsertPaymentConfigBodyDto,
} from "./payment-gateway-config.dto";
import {
  parseUpsertPaymentConfig,
} from "./payment-gateway-config.schemas";

@ApiTags(API_DOCS.TAGS.SETTINGS)
@ApiCookieAuth()
@UseGuards(
  SessionAuthGuard,
  TenantInstitutionGuard,
  PermissionGuard,
  ScopeGuard,
)
@Controller(`${API_ROUTES.SETTINGS}/${API_ROUTES.PAYMENT}`)
export class PaymentGatewayConfigController {
  constructor(
    private readonly configService: PaymentGatewayConfigService,
  ) {}

  @Get()
  @RequirePermission(PERMISSIONS.INSTITUTION_PAYMENT_MANAGE)
  @ApiOperation({ summary: "Get payment gateway config for current tenant" })
  @ApiOkResponse({ type: PaymentConfigDto })
  async getConfig(
    @CurrentInstitution() institution: TenantInstitution,
  ): Promise<PaymentConfigDto | null> {
    return this.configService.getConfig(institution.id);
  }

  @Put()
  @RequirePermission(PERMISSIONS.INSTITUTION_PAYMENT_MANAGE)
  @ApiOperation({ summary: "Create or update payment gateway config" })
  @ApiOkResponse({ type: PaymentConfigDto })
  async upsertConfig(
    @CurrentInstitution() institution: TenantInstitution,
    @Body() body: UpsertPaymentConfigBodyDto,
  ): Promise<PaymentConfigDto> {
    const input = parseUpsertPaymentConfig(body);

    return this.configService.upsertConfig({
      institutionId: institution.id,
      provider: input.provider as Parameters<
        PaymentGatewayConfigService["upsertConfig"]
      >[0]["provider"],
      credentials: input.credentials,
      displayLabel: input.displayLabel,
    });
  }

  @Delete()
  @RequirePermission(PERMISSIONS.INSTITUTION_PAYMENT_MANAGE)
  @ApiOperation({ summary: "Deactivate payment gateway config" })
  async deactivateConfig(
    @CurrentInstitution() institution: TenantInstitution,
  ): Promise<void> {
    await this.configService.deactivateConfig(institution.id);
  }

  @Post("test")
  @RequirePermission(PERMISSIONS.INSTITUTION_PAYMENT_MANAGE)
  @ApiOperation({ summary: "Verify provider credentials by resolving the provider" })
  async testConfig(
    @CurrentInstitution() institution: TenantInstitution,
  ): Promise<{ provider: string; active: boolean }> {
    const provider = await this.configService.resolveProvider(institution.id);

    return {
      provider: provider.provider,
      active: provider.provider !== "disabled",
    };
  }
}
