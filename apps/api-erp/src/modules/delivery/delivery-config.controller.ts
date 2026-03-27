import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { DELIVERY_CHANNELS } from "@repo/contracts";
import { API_DOCS, API_ROUTES, PERMISSIONS } from "../../constants";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermission } from "../auth/require-permission.decorator";
import { ScopeGuard } from "../auth/scope.guard";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
import { DeliveryConfigService } from "./delivery-config.service";
import {
  DeliveryConfigDto,
  ListDeliveryConfigsResultDto,
  TestDeliveryResultDto,
  UpsertDeliveryConfigBodyDto,
  TestDeliveryBodyDto,
} from "./delivery-config.dto";
import {
  parseDeliveryChannel,
  parseTestDelivery,
  parseUpsertDeliveryConfig,
} from "./delivery-config.schemas";
import { DeliveryService } from "./delivery.service";

@ApiTags(API_DOCS.TAGS.SETTINGS)
@ApiCookieAuth()
@UseGuards(
  SessionAuthGuard,
  TenantInstitutionGuard,
  PermissionGuard,
  ScopeGuard,
)
@Controller(`${API_ROUTES.SETTINGS}/${API_ROUTES.DELIVERY}`)
export class DeliveryConfigController {
  constructor(
    private readonly deliveryConfigService: DeliveryConfigService,
    private readonly deliveryService: DeliveryService,
  ) {}

  @Get()
  @RequirePermission(PERMISSIONS.INSTITUTION_DELIVERY_MANAGE)
  @ApiOperation({ summary: "List delivery provider configs for current tenant" })
  @ApiOkResponse({ type: ListDeliveryConfigsResultDto })
  async listConfigs(
    @CurrentInstitution() institution: TenantInstitution,
  ): Promise<ListDeliveryConfigsResultDto> {
    const configs = await this.deliveryConfigService.listConfigs(institution.id);

    return { configs };
  }

  @Put(":channel")
  @RequirePermission(PERMISSIONS.INSTITUTION_DELIVERY_MANAGE)
  @ApiOperation({ summary: "Create or update delivery provider config for a channel" })
  @ApiOkResponse({ type: DeliveryConfigDto })
  async upsertConfig(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("channel") channelParam: string,
    @Body() body: UpsertDeliveryConfigBodyDto,
  ): Promise<DeliveryConfigDto> {
    const channel = parseDeliveryChannel(channelParam);
    const input = parseUpsertDeliveryConfig(body);

    return this.deliveryConfigService.upsertConfig({
      institutionId: institution.id,
      channel,
      provider: input.provider,
      credentials: input.credentials,
      senderIdentity: input.senderIdentity,
    });
  }

  @Delete(":channel")
  @RequirePermission(PERMISSIONS.INSTITUTION_DELIVERY_MANAGE)
  @ApiOperation({ summary: "Deactivate delivery provider config for a channel" })
  async deactivateConfig(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("channel") channelParam: string,
  ): Promise<void> {
    const channel = parseDeliveryChannel(channelParam);

    await this.deliveryConfigService.deactivateConfig(institution.id, channel);
  }

  @Post(API_ROUTES.TEST)
  @RequirePermission(PERMISSIONS.INSTITUTION_DELIVERY_MANAGE)
  @ApiOperation({ summary: "Send a test message using the configured provider" })
  @ApiOkResponse({ type: TestDeliveryResultDto })
  async testDelivery(
    @CurrentInstitution() institution: TenantInstitution,
    @Body() body: TestDeliveryBodyDto,
  ): Promise<TestDeliveryResultDto> {
    const input = parseTestDelivery(body);

    if (input.channel === DELIVERY_CHANNELS.EMAIL) {
      const result = await this.deliveryService.sendEmail(
        {
          to: input.recipient,
          subject: "Education ERP — Test email delivery",
          text: "This is a test email from your Education ERP delivery configuration. If you received this, your email provider is configured correctly.",
        },
        institution.id,
      );

      return {
        accepted: result.accepted,
        provider: result.provider,
        externalId: result.externalId,
      };
    }

    const result = await this.deliveryService.sendSms(
      {
        to: input.recipient,
        text: "Education ERP test SMS. Your SMS provider is configured correctly.",
      },
      institution.id,
    );

    return {
      accepted: result.accepted,
      provider: result.provider,
      externalId: result.externalId,
    };
  }
}
