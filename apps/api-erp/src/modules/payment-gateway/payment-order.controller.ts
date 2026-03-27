import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
  type RawBodyRequest,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";
import { API_DOCS, API_ROUTES, PERMISSIONS } from "../../constants";
import { CurrentSession } from "../auth/current-session.decorator";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermission } from "../auth/require-permission.decorator";
import { ScopeGuard } from "../auth/scope.guard";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import type { AuthenticatedSession } from "../auth/auth.types";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
import { PaymentOrderService } from "./payment-order.service";
import {
  CreatePaymentOrderBodyDto,
  PaymentOrderResultDto,
  VerifyPaymentBodyDto,
} from "./payment-gateway-config.dto";
import {
  parseCreatePaymentOrder,
  parseVerifyPayment,
} from "./payment-gateway-config.schemas";

@ApiTags(API_DOCS.TAGS.FEES)
@Controller(API_ROUTES.FEES)
export class PaymentOrderController {
  constructor(private readonly orderService: PaymentOrderService) {}

  // ── Authenticated endpoints ────────────────────────────────────────────────

  @Post(`${API_ROUTES.PAYMENTS}/${API_ROUTES.ONLINE_ORDER}`)
  @ApiCookieAuth()
  @UseGuards(
    SessionAuthGuard,
    TenantInstitutionGuard,
    PermissionGuard,
    ScopeGuard,
  )
  @RequirePermission(PERMISSIONS.FEES_PAYMENT_ONLINE)
  @ApiOperation({ summary: "Create an online payment order with the configured PG" })
  @ApiCreatedResponse({ type: PaymentOrderResultDto })
  async createOrder(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: CreatePaymentOrderBodyDto,
  ): Promise<PaymentOrderResultDto> {
    const input = parseCreatePaymentOrder(body);

    return this.orderService.createOrder({
      institutionId: institution.id,
      feeAssignmentId: input.feeAssignmentId,
      amountInPaise: input.amountInPaise,
      studentName: input.studentName ?? "Student",
      guardianMobile: input.guardianMobile ?? "",
      guardianEmail: input.guardianEmail,
      description: input.description ?? "School fee payment",
      createdByUserId: session.user.id,
    });
  }

  @Post(`${API_ROUTES.PAYMENTS}/${API_ROUTES.ONLINE_VERIFY}`)
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth()
  @UseGuards(
    SessionAuthGuard,
    TenantInstitutionGuard,
    PermissionGuard,
    ScopeGuard,
  )
  @RequirePermission(PERMISSIONS.FEES_PAYMENT_ONLINE)
  @ApiOperation({ summary: "Verify a client-side payment callback" })
  @ApiOkResponse({ schema: { properties: { success: { type: "boolean" } } } })
  async verifyPayment(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: VerifyPaymentBodyDto,
  ): Promise<{ success: boolean }> {
    const input = parseVerifyPayment(body);

    return this.orderService.verifyClientPayment({
      institutionId: institution.id,
      internalOrderId: input.internalOrderId,
      externalOrderId: input.externalOrderId,
      externalPaymentId: input.externalPaymentId,
      externalSignature: input.externalSignature,
      createdByUserId: session.user.id,
    });
  }

  // ── Webhook endpoint (no session auth — signed by PG) ─────────────────────

  @Post(`${API_ROUTES.WEBHOOK}/:institutionId`)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Inbound webhook from payment gateway" })
  async handleWebhook(
    @Param("institutionId") institutionId: string,
    @Headers("x-razorpay-signature") razorpaySignature: string | undefined,
    @Headers("x-webhook-signature") webhookSignature: string | undefined,
    @Headers("x-payu-checksum") payuChecksum: string | undefined,
    @Req() req: RawBodyRequest<Request>,
  ): Promise<void> {
    const rawBody = req.rawBody;

    if (!rawBody) {
      return;
    }

    const signature =
      razorpaySignature ?? webhookSignature ?? payuChecksum ?? "";

    await this.orderService.handleWebhook({
      institutionId,
      payload: rawBody,
      signature,
    });
  }
}
