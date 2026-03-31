import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { API_DOCS, API_ROUTES, PERMISSIONS } from "../../constants";
import type { AuthenticatedSession, ResolvedScopes } from "../auth/auth.types";
import { CurrentScopes } from "../auth/current-scopes.decorator";
import { CurrentSession } from "../auth/current-session.decorator";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermission } from "../auth/require-permission.decorator";
import { ScopeGuard } from "../auth/scope.guard";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import {
  AdmissionApplicationDto,
  AdmissionFormFieldDto,
  AdmissionEnquiryDto,
  ApplicationDocumentDto,
  ConvertToStudentBodyDto,
  ConvertToStudentResultDto,
  CreateAdmissionApplicationBodyDto,
  CreateAdmissionEnquiryBodyDto,
  CreateDocumentChecklistItemBodyDto,
  DocumentChecklistItemDto,
  ListAdmissionFormFieldsQueryDto,
  ListAdmissionFormFieldsResultDto,
  ListAdmissionApplicationsQueryDto,
  ListAdmissionApplicationsResultDto,
  ListAdmissionEnquiriesQueryDto,
  ListAdmissionEnquiriesResultDto,
  ListApplicationDocumentsResultDto,
  ListDocumentChecklistResultDto,
  PromoteWaitlistResultDto,
  RecordRegistrationFeeBodyDto,
  RegistrationFeeResultDto,
  UpsertAdmissionFormFieldBodyDto,
  UpsertApplicationDocumentBodyDto,
  UpdateAdmissionApplicationBodyDto,
  UpdateAdmissionEnquiryBodyDto,
  UpdateDocumentChecklistItemBodyDto,
  VerifyRejectApplicationDocumentBodyDto,
  WaitlistApplicationBodyDto,
  WaitlistResultDto,
} from "./admissions.dto";
import {
  parseConvertToStudent,
  parseCreateAdmissionApplication,
  parseCreateAdmissionEnquiry,
  parseCreateDocumentChecklistItem,
  parseListAdmissionFormFieldsQuery,
  parseListAdmissionApplicationsQuery,
  parseListAdmissionEnquiriesQuery,
  parseRecordRegistrationFee,
  parseUpdateDocumentChecklistItem,
  parseUpsertAdmissionFormField,
  parseUpsertApplicationDocument,
  parseUpdateAdmissionApplication,
  parseUpdateAdmissionEnquiry,
  parseVerifyRejectApplicationDocument,
  parseWaitlistApplication,
} from "./admissions.schemas";
import { AdmissionsService } from "./admissions.service";

@ApiTags(API_DOCS.TAGS.ADMISSIONS)
@ApiCookieAuth()
@UseGuards(
  SessionAuthGuard,
  TenantInstitutionGuard,
  PermissionGuard,
  ScopeGuard,
)
@Controller(API_ROUTES.ADMISSIONS)
export class AdmissionsController {
  constructor(private readonly admissionsService: AdmissionsService) {}

  @Get(API_ROUTES.FORM_FIELDS)
  @RequirePermission(PERMISSIONS.ADMISSIONS_READ)
  @ApiOperation({ summary: "List configured admission form fields" })
  @ApiOkResponse({ type: ListAdmissionFormFieldsResultDto })
  listAdmissionFormFields(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: ListAdmissionFormFieldsQueryDto,
  ) {
    const parsed = parseListAdmissionFormFieldsQuery(query);

    return this.admissionsService.listAdmissionFormFields(
      institution.id,
      parsed.scope,
    );
  }

  @Post(API_ROUTES.FORM_FIELDS)
  @RequirePermission(PERMISSIONS.ADMISSIONS_MANAGE)
  @ApiOperation({ summary: "Create an admission form field definition" })
  @ApiBody({ type: UpsertAdmissionFormFieldBodyDto })
  @ApiOkResponse({ type: AdmissionFormFieldDto })
  createAdmissionFormField(
    @CurrentInstitution() institution: TenantInstitution,
    @Body() body: UpsertAdmissionFormFieldBodyDto,
  ) {
    return this.admissionsService.createAdmissionFormField(
      institution.id,
      parseUpsertAdmissionFormField(body),
    );
  }

  @Patch(`${API_ROUTES.FORM_FIELDS}/:fieldId`)
  @RequirePermission(PERMISSIONS.ADMISSIONS_MANAGE)
  @ApiOperation({ summary: "Update an admission form field definition" })
  @ApiBody({ type: UpsertAdmissionFormFieldBodyDto })
  @ApiOkResponse({ type: AdmissionFormFieldDto })
  updateAdmissionFormField(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("fieldId") fieldId: string,
    @Body() body: UpsertAdmissionFormFieldBodyDto,
  ) {
    return this.admissionsService.updateAdmissionFormField(
      institution.id,
      fieldId,
      parseUpsertAdmissionFormField(body),
    );
  }

  @Get(API_ROUTES.ENQUIRIES)
  @RequirePermission(PERMISSIONS.ADMISSIONS_READ)
  @ApiOperation({ summary: "List admission enquiries for the current tenant" })
  @ApiOkResponse({ type: ListAdmissionEnquiriesResultDto })
  listAdmissionEnquiries(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Query() query: ListAdmissionEnquiriesQueryDto,
  ) {
    return this.admissionsService.listAdmissionEnquiries(
      institution.id,
      authSession,
      scopes,
      parseListAdmissionEnquiriesQuery(query),
    );
  }

  @Post(API_ROUTES.ENQUIRIES)
  @RequirePermission(PERMISSIONS.ADMISSIONS_MANAGE)
  @ApiOperation({ summary: "Create an admission enquiry" })
  @ApiBody({ type: CreateAdmissionEnquiryBodyDto })
  @ApiOkResponse({ type: AdmissionEnquiryDto })
  createAdmissionEnquiry(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Body() body: CreateAdmissionEnquiryBodyDto,
  ) {
    return this.admissionsService.createAdmissionEnquiry(
      institution.id,
      authSession,
      scopes,
      parseCreateAdmissionEnquiry(body),
    );
  }

  @Get(`${API_ROUTES.ENQUIRIES}/:enquiryId`)
  @RequirePermission(PERMISSIONS.ADMISSIONS_READ)
  @ApiOperation({ summary: "Get an admission enquiry" })
  @ApiOkResponse({ type: AdmissionEnquiryDto })
  getAdmissionEnquiry(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("enquiryId") enquiryId: string,
  ) {
    return this.admissionsService.getAdmissionEnquiry(
      institution.id,
      enquiryId,
      authSession,
      scopes,
    );
  }

  @Patch(`${API_ROUTES.ENQUIRIES}/:enquiryId`)
  @RequirePermission(PERMISSIONS.ADMISSIONS_MANAGE)
  @ApiOperation({ summary: "Update an admission enquiry" })
  @ApiBody({ type: UpdateAdmissionEnquiryBodyDto })
  @ApiOkResponse({ type: AdmissionEnquiryDto })
  updateAdmissionEnquiry(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("enquiryId") enquiryId: string,
    @Body() body: UpdateAdmissionEnquiryBodyDto,
  ) {
    return this.admissionsService.updateAdmissionEnquiry(
      institution.id,
      enquiryId,
      authSession,
      scopes,
      parseUpdateAdmissionEnquiry(body),
    );
  }

  @Get(API_ROUTES.APPLICATIONS)
  @RequirePermission(PERMISSIONS.ADMISSIONS_READ)
  @ApiOperation({
    summary: "List admission applications for the current tenant",
  })
  @ApiOkResponse({ type: ListAdmissionApplicationsResultDto })
  listAdmissionApplications(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Query() query: ListAdmissionApplicationsQueryDto,
  ) {
    return this.admissionsService.listAdmissionApplications(
      institution.id,
      authSession,
      scopes,
      parseListAdmissionApplicationsQuery(query),
    );
  }

  @Post(API_ROUTES.APPLICATIONS)
  @RequirePermission(PERMISSIONS.ADMISSIONS_MANAGE)
  @ApiOperation({ summary: "Create an admission application" })
  @ApiBody({ type: CreateAdmissionApplicationBodyDto })
  @ApiOkResponse({ type: AdmissionApplicationDto })
  createAdmissionApplication(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Body() body: CreateAdmissionApplicationBodyDto,
  ) {
    return this.admissionsService.createAdmissionApplication(
      institution.id,
      authSession,
      scopes,
      parseCreateAdmissionApplication(body),
    );
  }

  @Get(`${API_ROUTES.APPLICATIONS}/:applicationId`)
  @RequirePermission(PERMISSIONS.ADMISSIONS_READ)
  @ApiOperation({ summary: "Get an admission application" })
  @ApiOkResponse({ type: AdmissionApplicationDto })
  getAdmissionApplication(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("applicationId") applicationId: string,
  ) {
    return this.admissionsService.getAdmissionApplication(
      institution.id,
      applicationId,
      authSession,
      scopes,
    );
  }

  @Patch(`${API_ROUTES.APPLICATIONS}/:applicationId`)
  @RequirePermission(PERMISSIONS.ADMISSIONS_MANAGE)
  @ApiOperation({ summary: "Update an admission application" })
  @ApiBody({ type: UpdateAdmissionApplicationBodyDto })
  @ApiOkResponse({ type: AdmissionApplicationDto })
  updateAdmissionApplication(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("applicationId") applicationId: string,
    @Body() body: UpdateAdmissionApplicationBodyDto,
  ) {
    return this.admissionsService.updateAdmissionApplication(
      institution.id,
      applicationId,
      authSession,
      scopes,
      parseUpdateAdmissionApplication(body),
    );
  }

  // ── Document checklist ───────────────────────────────────────────────────

  @Get(API_ROUTES.DOCUMENT_CHECKLIST)
  @RequirePermission(PERMISSIONS.ADMISSIONS_READ)
  @ApiOperation({ summary: "List document checklist items for institution" })
  @ApiOkResponse({ type: ListDocumentChecklistResultDto })
  listDocumentChecklist(
    @CurrentInstitution() institution: TenantInstitution,
  ) {
    return this.admissionsService.listDocumentChecklist(institution.id);
  }

  @Post(API_ROUTES.DOCUMENT_CHECKLIST)
  @RequirePermission(PERMISSIONS.ADMISSIONS_MANAGE)
  @ApiOperation({ summary: "Create a document checklist item" })
  @ApiBody({ type: CreateDocumentChecklistItemBodyDto })
  @ApiOkResponse({ type: DocumentChecklistItemDto })
  createDocumentChecklistItem(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: CreateDocumentChecklistItemBodyDto,
  ) {
    return this.admissionsService.createDocumentChecklistItem(
      institution.id,
      authSession,
      parseCreateDocumentChecklistItem(body),
    );
  }

  @Patch(`${API_ROUTES.DOCUMENT_CHECKLIST}/:itemId`)
  @RequirePermission(PERMISSIONS.ADMISSIONS_MANAGE)
  @ApiOperation({ summary: "Update a document checklist item" })
  @ApiBody({ type: UpdateDocumentChecklistItemBodyDto })
  @ApiOkResponse({ type: DocumentChecklistItemDto })
  updateDocumentChecklistItem(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @Param("itemId") itemId: string,
    @Body() body: UpdateDocumentChecklistItemBodyDto,
  ) {
    return this.admissionsService.updateDocumentChecklistItem(
      institution.id,
      itemId,
      authSession,
      parseUpdateDocumentChecklistItem(body),
    );
  }

  // ── Application documents ─────────────────────────────────────────────────

  @Get(`${API_ROUTES.APPLICATIONS}/:applicationId/${API_ROUTES.APPLICATION_DOCUMENTS}`)
  @RequirePermission(PERMISSIONS.ADMISSIONS_READ)
  @ApiOperation({ summary: "List documents for an application" })
  @ApiOkResponse({ type: ListApplicationDocumentsResultDto })
  listApplicationDocuments(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("applicationId") applicationId: string,
  ) {
    return this.admissionsService.listApplicationDocuments(
      institution.id,
      applicationId,
      authSession,
      scopes,
    );
  }

  @Post(`${API_ROUTES.APPLICATIONS}/:applicationId/${API_ROUTES.APPLICATION_DOCUMENTS}`)
  @RequirePermission(PERMISSIONS.ADMISSIONS_MANAGE)
  @ApiOperation({ summary: "Add or update a document on an application" })
  @ApiBody({ type: UpsertApplicationDocumentBodyDto })
  @ApiOkResponse({ type: ApplicationDocumentDto })
  upsertApplicationDocument(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("applicationId") applicationId: string,
    @Body() body: UpsertApplicationDocumentBodyDto,
  ) {
    return this.admissionsService.upsertApplicationDocument(
      institution.id,
      applicationId,
      authSession,
      scopes,
      parseUpsertApplicationDocument(body),
    );
  }

  @Patch(`${API_ROUTES.APPLICATIONS}/:applicationId/${API_ROUTES.APPLICATION_DOCUMENTS}/:documentId`)
  @RequirePermission(PERMISSIONS.ADMISSIONS_MANAGE)
  @ApiOperation({ summary: "Verify or reject an application document" })
  @ApiBody({ type: VerifyRejectApplicationDocumentBodyDto })
  @ApiOkResponse({ type: ApplicationDocumentDto })
  verifyRejectApplicationDocument(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @Param("documentId") documentId: string,
    @Body() body: VerifyRejectApplicationDocumentBodyDto,
  ) {
    return this.admissionsService.verifyRejectApplicationDocument(
      institution.id,
      documentId,
      authSession,
      parseVerifyRejectApplicationDocument(body),
    );
  }

  // ── Convert to student ────────────────────────────────────────────────────

  @Post(`${API_ROUTES.APPLICATIONS}/:applicationId/${API_ROUTES.CONVERT_TO_STUDENT}`)
  @RequirePermission(PERMISSIONS.ADMISSIONS_MANAGE)
  @ApiOperation({ summary: "Convert an approved application to a student record" })
  @ApiBody({ type: ConvertToStudentBodyDto })
  @ApiOkResponse({ type: ConvertToStudentResultDto })
  convertToStudent(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("applicationId") applicationId: string,
    @Body() body: ConvertToStudentBodyDto,
  ) {
    return this.admissionsService.convertToStudent(
      institution.id,
      applicationId,
      authSession,
      scopes,
      parseConvertToStudent(body),
    );
  }

  // ── Waitlist ──────────────────────────────────────────────────────────────

  @Post(`${API_ROUTES.APPLICATIONS}/:applicationId/${API_ROUTES.WAITLIST}`)
  @RequirePermission(PERMISSIONS.ADMISSIONS_MANAGE)
  @ApiOperation({ summary: "Place an application on the waitlist" })
  @ApiBody({ type: WaitlistApplicationBodyDto })
  @ApiOkResponse({ type: WaitlistResultDto })
  waitlistApplication(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("applicationId") applicationId: string,
    @Body() body: WaitlistApplicationBodyDto,
  ) {
    return this.admissionsService.waitlistApplication(
      institution.id,
      applicationId,
      authSession,
      scopes,
      parseWaitlistApplication(body),
    );
  }

  @Post(API_ROUTES.PROMOTE)
  @RequirePermission(PERMISSIONS.ADMISSIONS_MANAGE)
  @ApiOperation({ summary: "Promote the next waitlisted application to approved" })
  @ApiOkResponse({ type: PromoteWaitlistResultDto })
  promoteNextWaitlisted(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
  ) {
    return this.admissionsService.promoteNextWaitlisted(
      institution.id,
      authSession,
      scopes,
    );
  }

  // ── Registration fee ──────────────────────────────────────────────────────

  @Post(`${API_ROUTES.APPLICATIONS}/:applicationId/${API_ROUTES.REGISTRATION_FEE}`)
  @RequirePermission(PERMISSIONS.ADMISSIONS_MANAGE)
  @ApiOperation({ summary: "Record registration fee payment on an application" })
  @ApiBody({ type: RecordRegistrationFeeBodyDto })
  @ApiOkResponse({ type: RegistrationFeeResultDto })
  recordRegistrationFee(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("applicationId") applicationId: string,
    @Body() body: RecordRegistrationFeeBodyDto,
  ) {
    return this.admissionsService.recordRegistrationFee(
      institution.id,
      applicationId,
      authSession,
      scopes,
      parseRecordRegistrationFee(body),
    );
  }
}
