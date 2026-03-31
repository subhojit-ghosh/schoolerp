import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { API_DOCS, API_ROUTES, PERMISSIONS } from "../../constants";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermission } from "../auth/require-permission.decorator";
import { CurrentSession } from "../auth/current-session.decorator";
import type { AuthenticatedSession } from "../auth/auth.types";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
import {
  BookDto,
  BookListResultDto,
  BorrowingHistoryQueryParamsDto,
  CollectFineBodyDto,
  CreateBookBodyDto,
  CreateReservationBodyDto,
  IssueBookBodyDto,
  LibraryDashboardDto,
  ListBooksQueryParamsDto,
  ListReservationsQueryParamsDto,
  ListTransactionsQueryParamsDto,
  ReservationDto,
  ReservationListResultDto,
  ReturnBookBodyDto,
  TransactionDto,
  TransactionListResultDto,
  UpdateBookBodyDto,
} from "./library.dto";
import {
  parseBorrowingHistory,
  parseCollectFine,
  parseCreateBook,
  parseCreateReservation,
  parseIssueBook,
  parseListBooks,
  parseListReservations,
  parseListTransactions,
  parseReturnBook,
  parseUpdateBook,
} from "./library.schemas";
import { LibraryService } from "./library.service";

@ApiTags(API_DOCS.TAGS.LIBRARY)
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, TenantInstitutionGuard, PermissionGuard)
@Controller(API_ROUTES.LIBRARY)
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  // ── Books ─────────────────────────────────────────────────────────────────

  @Get(API_ROUTES.LIBRARY_BOOKS)
  @RequirePermission(PERMISSIONS.LIBRARY_READ)
  @ApiOperation({ summary: "List library books" })
  @ApiOkResponse({ type: BookListResultDto })
  async listBooks(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: ListBooksQueryParamsDto,
  ) {
    const parsed = parseListBooks(query);
    return this.libraryService.listBooks(institution.id, parsed);
  }

  @Post(API_ROUTES.LIBRARY_BOOKS)
  @RequirePermission(PERMISSIONS.LIBRARY_MANAGE)
  @ApiOperation({ summary: "Add a book to the library" })
  @ApiCreatedResponse({ type: BookDto })
  async createBook(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: CreateBookBodyDto,
  ) {
    const dto = parseCreateBook(body);
    return this.libraryService.createBook(institution.id, session, dto);
  }

  @Put(`${API_ROUTES.LIBRARY_BOOKS}/:bookId`)
  @RequirePermission(PERMISSIONS.LIBRARY_MANAGE)
  @ApiOperation({ summary: "Update a library book" })
  @ApiOkResponse({ type: BookDto })
  async updateBook(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("bookId") bookId: string,
    @Body() body: UpdateBookBodyDto,
  ) {
    const dto = parseUpdateBook(body);
    return this.libraryService.updateBook(institution.id, bookId, session, dto);
  }

  // ── Transactions ──────────────────────────────────────────────────────────

  @Get(API_ROUTES.LIBRARY_TRANSACTIONS)
  @RequirePermission(PERMISSIONS.LIBRARY_READ)
  @ApiOperation({ summary: "List library transactions" })
  @ApiOkResponse({ type: TransactionListResultDto })
  async listTransactions(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: ListTransactionsQueryParamsDto,
  ) {
    const parsed = parseListTransactions(query);
    return this.libraryService.listTransactions(institution.id, parsed);
  }

  @Post(API_ROUTES.LIBRARY_TRANSACTIONS)
  @RequirePermission(PERMISSIONS.LIBRARY_MANAGE)
  @ApiOperation({ summary: "Issue a book to a member" })
  @ApiCreatedResponse({ type: TransactionDto })
  async issueBook(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: IssueBookBodyDto,
  ) {
    const dto = parseIssueBook(body);
    return this.libraryService.issueBook(institution.id, session, dto);
  }

  @Post(
    `${API_ROUTES.LIBRARY_TRANSACTIONS}/:transactionId/${API_ROUTES.RETURN}`,
  )
  @RequirePermission(PERMISSIONS.LIBRARY_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Return a borrowed book" })
  @ApiOkResponse({ type: TransactionDto })
  async returnBook(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("transactionId") transactionId: string,
    @Body() body: ReturnBookBodyDto,
  ) {
    const dto = parseReturnBook(body);
    return this.libraryService.returnBook(
      institution.id,
      transactionId,
      session,
      dto,
    );
  }

  // ── Fine collection ────────────────────────────────────────────────────────

  @Post(`${API_ROUTES.LIBRARY_TRANSACTIONS}/:transactionId/${API_ROUTES.FINE}`)
  @RequirePermission(PERMISSIONS.LIBRARY_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Collect or waive fine on a transaction" })
  @ApiOkResponse({ type: TransactionDto })
  async collectFine(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("transactionId") transactionId: string,
    @Body() body: CollectFineBodyDto,
  ) {
    const dto = parseCollectFine(body);
    return this.libraryService.collectFine(
      institution.id,
      transactionId,
      session,
      dto,
    );
  }

  // ── Reservations ───────────────────────────────────────────────────────────

  @Get(API_ROUTES.RESERVATIONS)
  @RequirePermission(PERMISSIONS.LIBRARY_READ)
  @ApiOperation({ summary: "List book reservations" })
  @ApiOkResponse({ type: ReservationListResultDto })
  async listReservations(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: ListReservationsQueryParamsDto,
  ) {
    const parsed = parseListReservations(query);
    return this.libraryService.listReservations(institution.id, parsed);
  }

  @Post(API_ROUTES.RESERVATIONS)
  @RequirePermission(PERMISSIONS.LIBRARY_MANAGE)
  @ApiOperation({ summary: "Reserve a book" })
  @ApiCreatedResponse({ type: ReservationDto })
  async createReservation(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: CreateReservationBodyDto,
  ) {
    const dto = parseCreateReservation(body);
    return this.libraryService.createReservation(institution.id, session, dto);
  }

  @Post(`${API_ROUTES.RESERVATIONS}/:reservationId/${API_ROUTES.FULFILL}`)
  @RequirePermission(PERMISSIONS.LIBRARY_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Fulfill a book reservation" })
  @ApiOkResponse({ type: ReservationDto })
  async fulfillReservation(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("reservationId") reservationId: string,
  ) {
    return this.libraryService.fulfillReservation(
      institution.id,
      reservationId,
      session,
    );
  }

  @Post(`${API_ROUTES.RESERVATIONS}/:reservationId/${API_ROUTES.CANCEL}`)
  @RequirePermission(PERMISSIONS.LIBRARY_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Cancel a book reservation" })
  @ApiOkResponse({ type: ReservationDto })
  async cancelReservation(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("reservationId") reservationId: string,
  ) {
    return this.libraryService.cancelReservation(
      institution.id,
      reservationId,
      session,
    );
  }

  // ── Borrowing history ────────────────────────────────────────────────────

  @Get(`${API_ROUTES.BORROWING_HISTORY}/:memberId`)
  @RequirePermission(PERMISSIONS.LIBRARY_READ)
  @ApiOperation({ summary: "Get borrowing history for a member" })
  @ApiOkResponse({ type: TransactionListResultDto })
  async memberBorrowingHistory(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("memberId") memberId: string,
    @Query() query: BorrowingHistoryQueryParamsDto,
  ) {
    const parsed = parseBorrowingHistory(query);
    return this.libraryService.memberBorrowingHistory(
      institution.id,
      memberId,
      parsed,
    );
  }

  // ── Overdue detection ────────────────────────────────────────────────────

  @Get(API_ROUTES.OVERDUE)
  @RequirePermission(PERMISSIONS.LIBRARY_READ)
  @ApiOperation({ summary: "List all overdue transactions" })
  @ApiOkResponse({ type: [TransactionDto] })
  async listOverdue(@CurrentInstitution() institution: TenantInstitution) {
    return this.libraryService.listOverdueTransactions(institution.id);
  }

  @Post(API_ROUTES.OVERDUE)
  @RequirePermission(PERMISSIONS.LIBRARY_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mark all past-due transactions as overdue" })
  async markOverdue(@CurrentInstitution() institution: TenantInstitution) {
    return this.libraryService.markOverdue(institution.id);
  }

  // ── Dashboard ────────────────────────────────────────────────────────────

  @Get(API_ROUTES.DASHBOARD)
  @RequirePermission(PERMISSIONS.LIBRARY_READ)
  @ApiOperation({ summary: "Library dashboard statistics" })
  @ApiOkResponse({ type: LibraryDashboardDto })
  async dashboard(@CurrentInstitution() institution: TenantInstitution) {
    return this.libraryService.getDashboard(institution.id);
  }
}
