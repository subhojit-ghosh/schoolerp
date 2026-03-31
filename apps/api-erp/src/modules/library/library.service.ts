import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DATABASE } from "@repo/backend-core";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  libraryBooks,
  libraryReservations,
  libraryTransactions,
  member,
  ne,
  or,
  sql,
  staffProfiles,
  type AppDatabase,
  user,
  alias,
} from "@repo/database";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  LIBRARY_RESERVATION_STATUS,
} from "@repo/contracts";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, SORT_ORDERS } from "../../constants";
import { resolveTablePageSize, resolvePagination } from "../../lib/list-query";
import type { AuthenticatedSession } from "../auth/auth.types";
import { AuditService } from "../audit/audit.service";
import type {
  BorrowingHistoryQueryDto,
  CollectFineDto,
  CreateBookDto,
  CreateReservationDto,
  IssueBookDto,
  ListBooksQueryDto,
  ListReservationsQueryDto,
  ListTransactionsQueryDto,
  ReturnBookDto,
  UpdateBookDto,
} from "./library.schemas";

const bookMember = alias(member, "book_member");
const bookUser = alias(user, "book_user");

const bookSortColumns = {
  title: libraryBooks.title,
  author: libraryBooks.author,
  createdAt: libraryBooks.createdAt,
  availableCopies: libraryBooks.availableCopies,
} as const;

const txSortColumns = {
  issuedAt: libraryTransactions.issuedAt,
  dueDate: libraryTransactions.dueDate,
  status: libraryTransactions.status,
} as const;

const reservationSortColumns = {
  createdAt: libraryReservations.createdAt,
  queuePosition: libraryReservations.queuePosition,
} as const;

const reservationMember = alias(member, "res_member");
const reservationUser = alias(user, "res_user");

@Injectable()
export class LibraryService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly auditService: AuditService,
  ) {}

  // ── Books ─────────────────────────────────────────────────────────────────

  async listBooks(institutionId: string, query: ListBooksQueryDto) {
    const page = query.page ?? 1;
    const pageSize = resolveTablePageSize(query.limit);
    const sortField = query.sort ?? "createdAt";
    const sortOrder = query.order ?? SORT_ORDERS.DESC;
    const sortCol = bookSortColumns[sortField] ?? libraryBooks.createdAt;
    const orderFn = sortOrder === SORT_ORDERS.ASC ? asc : desc;

    const filters = [
      eq(libraryBooks.institutionId, institutionId),
      ...(query.status
        ? [eq(libraryBooks.status, query.status)]
        : [ne(libraryBooks.status, "inactive")]),
      ...(query.q
        ? [
            or(
              ilike(libraryBooks.title, `%${query.q}%`),
              ilike(libraryBooks.author, `%${query.q}%`),
              ilike(libraryBooks.isbn, `%${query.q}%`),
            ),
          ]
        : []),
    ];

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(libraryBooks)
      .where(and(...filters));

    const pagination = resolvePagination(total, page, pageSize);

    const rows = await this.db
      .select()
      .from(libraryBooks)
      .where(and(...filters))
      .orderBy(orderFn(sortCol))
      .limit(pageSize)
      .offset(pagination.offset);

    return {
      rows: rows.map((b) => ({
        id: b.id,
        title: b.title,
        author: b.author ?? null,
        isbn: b.isbn ?? null,
        publisher: b.publisher ?? null,
        genre: b.genre ?? null,
        totalCopies: b.totalCopies,
        availableCopies: b.availableCopies,
        status: b.status,
        createdAt: b.createdAt.toISOString(),
      })),
      total,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
    };
  }

  async createBook(
    institutionId: string,
    session: AuthenticatedSession,
    dto: CreateBookDto,
  ) {
    const id = randomUUID();
    await this.db.insert(libraryBooks).values({
      id,
      institutionId,
      title: dto.title,
      author: dto.author ?? null,
      isbn: dto.isbn ?? null,
      publisher: dto.publisher ?? null,
      genre: dto.genre ?? null,
      totalCopies: dto.totalCopies ?? 1,
      availableCopies: dto.totalCopies ?? 1,
    });

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.CREATE,
      entityType: AUDIT_ENTITY_TYPES.LIBRARY_BOOK,
      entityId: id,
      entityLabel: dto.title,
      summary: `Created library book "${dto.title}"`,
    });

    return { id };
  }

  async updateBook(
    institutionId: string,
    bookId: string,
    session: AuthenticatedSession,
    dto: UpdateBookDto,
  ) {
    const [existing] = await this.db
      .select()
      .from(libraryBooks)
      .where(
        and(
          eq(libraryBooks.id, bookId),
          eq(libraryBooks.institutionId, institutionId),
        ),
      );

    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.LIBRARY.BOOK_NOT_FOUND);
    }

    // If decreasing totalCopies, ensure availableCopies stays non-negative
    let newAvailableCopies = existing.availableCopies;
    if (dto.totalCopies !== undefined) {
      const issuedCopies = existing.totalCopies - existing.availableCopies;
      newAvailableCopies = Math.max(0, dto.totalCopies - issuedCopies);
    }

    await this.db
      .update(libraryBooks)
      .set({
        title: dto.title ?? existing.title,
        author: dto.author !== undefined ? dto.author : existing.author,
        isbn: dto.isbn !== undefined ? dto.isbn : existing.isbn,
        publisher:
          dto.publisher !== undefined ? dto.publisher : existing.publisher,
        genre: dto.genre !== undefined ? dto.genre : existing.genre,
        totalCopies: dto.totalCopies ?? existing.totalCopies,
        availableCopies: newAvailableCopies,
        status: dto.status ?? existing.status,
      })
      .where(eq(libraryBooks.id, bookId));

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.LIBRARY_BOOK,
      entityId: bookId,
      entityLabel: dto.title ?? existing.title,
      summary: `Updated library book "${dto.title ?? existing.title}"`,
    });

    return { id: bookId };
  }

  // ── Transactions ──────────────────────────────────────────────────────────

  async listTransactions(
    institutionId: string,
    query: ListTransactionsQueryDto,
  ) {
    const page = query.page ?? 1;
    const pageSize = resolveTablePageSize(query.limit);
    const sortField = query.sort ?? "issuedAt";
    const sortOrder = query.order ?? SORT_ORDERS.DESC;
    const sortCol = txSortColumns[sortField] ?? libraryTransactions.issuedAt;
    const orderFn = sortOrder === SORT_ORDERS.ASC ? asc : desc;

    const filters = [
      eq(libraryTransactions.institutionId, institutionId),
      ...(query.status ? [eq(libraryTransactions.status, query.status)] : []),
      ...(query.memberId
        ? [eq(libraryTransactions.memberId, query.memberId)]
        : []),
      ...(query.bookId ? [eq(libraryTransactions.bookId, query.bookId)] : []),
      ...(query.q
        ? [
            or(
              ilike(libraryBooks.title, `%${query.q}%`),
              ilike(bookUser.name, `%${query.q}%`),
            ),
          ]
        : []),
    ];

    const baseQuery = this.db
      .select({ total: count() })
      .from(libraryTransactions)
      .innerJoin(libraryBooks, eq(libraryTransactions.bookId, libraryBooks.id))
      .innerJoin(bookMember, eq(libraryTransactions.memberId, bookMember.id))
      .innerJoin(bookUser, eq(bookMember.userId, bookUser.id))
      .where(and(...filters));

    const [{ total }] = await baseQuery;
    const pagination = resolvePagination(total, page, pageSize);

    const rows = await this.db
      .select({
        id: libraryTransactions.id,
        bookId: libraryTransactions.bookId,
        bookTitle: libraryBooks.title,
        bookIsbn: libraryBooks.isbn,
        memberId: libraryTransactions.memberId,
        memberName: bookUser.name,
        memberEmployeeId: staffProfiles.employeeId,
        issuedAt: libraryTransactions.issuedAt,
        dueDate: libraryTransactions.dueDate,
        returnedAt: libraryTransactions.returnedAt,
        fineAmount: libraryTransactions.fineAmount,
        finePaid: libraryTransactions.finePaid,
        status: libraryTransactions.status,
        createdAt: libraryTransactions.createdAt,
      })
      .from(libraryTransactions)
      .innerJoin(libraryBooks, eq(libraryTransactions.bookId, libraryBooks.id))
      .innerJoin(bookMember, eq(libraryTransactions.memberId, bookMember.id))
      .innerJoin(bookUser, eq(bookMember.userId, bookUser.id))
      .leftJoin(
        staffProfiles,
        eq(staffProfiles.membershipId, libraryTransactions.memberId),
      )
      .where(and(...filters))
      .orderBy(orderFn(sortCol))
      .limit(pageSize)
      .offset(pagination.offset);

    return {
      rows: rows.map((r) => ({
        id: r.id,
        bookId: r.bookId,
        bookTitle: r.bookTitle,
        bookIsbn: r.bookIsbn ?? null,
        memberId: r.memberId,
        memberName: r.memberName,
        memberEmployeeId: r.memberEmployeeId ?? null,
        issuedAt: r.issuedAt.toISOString(),
        dueDate: r.dueDate,
        returnedAt: r.returnedAt?.toISOString() ?? null,
        fineAmount: r.fineAmount,
        finePaid: r.finePaid,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
    };
  }

  async issueBook(
    institutionId: string,
    session: AuthenticatedSession,
    dto: IssueBookDto,
  ) {
    // Validate book
    const [book] = await this.db
      .select()
      .from(libraryBooks)
      .where(
        and(
          eq(libraryBooks.id, dto.bookId),
          eq(libraryBooks.institutionId, institutionId),
        ),
      );

    if (!book) {
      throw new NotFoundException(ERROR_MESSAGES.LIBRARY.BOOK_NOT_FOUND);
    }
    if (book.status === "inactive") {
      throw new ConflictException(ERROR_MESSAGES.LIBRARY.BOOK_INACTIVE);
    }
    if (book.availableCopies <= 0) {
      throw new ConflictException(ERROR_MESSAGES.LIBRARY.NO_COPIES_AVAILABLE);
    }

    // Validate member belongs to institution
    const [memberRecord] = await this.db
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.id, dto.memberId),
          eq(member.organizationId, institutionId),
        ),
      );

    if (!memberRecord) {
      throw new NotFoundException(ERROR_MESSAGES.LIBRARY.MEMBER_NOT_FOUND);
    }

    const id = randomUUID();

    await this.db.transaction(async (tx) => {
      await tx.insert(libraryTransactions).values({
        id,
        institutionId,
        bookId: dto.bookId,
        memberId: dto.memberId,
        dueDate: dto.dueDate,
      });

      await tx
        .update(libraryBooks)
        .set({ availableCopies: sql`${libraryBooks.availableCopies} - 1` })
        .where(eq(libraryBooks.id, dto.bookId));
    });

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.EXECUTE,
      entityType: AUDIT_ENTITY_TYPES.LIBRARY_TRANSACTION,
      entityId: id,
      entityLabel: book.title,
      summary: `Issued "${book.title}" to member`,
    });

    return { id };
  }

  async returnBook(
    institutionId: string,
    transactionId: string,
    session: AuthenticatedSession,
    dto: ReturnBookDto,
  ) {
    const [tx] = await this.db
      .select()
      .from(libraryTransactions)
      .where(
        and(
          eq(libraryTransactions.id, transactionId),
          eq(libraryTransactions.institutionId, institutionId),
        ),
      );

    if (!tx) {
      throw new NotFoundException(ERROR_MESSAGES.LIBRARY.TRANSACTION_NOT_FOUND);
    }
    if (tx.status === "returned") {
      throw new ConflictException(ERROR_MESSAGES.LIBRARY.ALREADY_RETURNED);
    }

    await this.db.transaction(async (dbTx) => {
      await dbTx
        .update(libraryTransactions)
        .set({
          status: "returned",
          returnedAt: new Date(),
          fineAmount: dto.fineAmount ?? 0,
        })
        .where(eq(libraryTransactions.id, transactionId));

      await dbTx
        .update(libraryBooks)
        .set({ availableCopies: sql`${libraryBooks.availableCopies} + 1` })
        .where(eq(libraryBooks.id, tx.bookId));
    });

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.EXECUTE,
      entityType: AUDIT_ENTITY_TYPES.LIBRARY_TRANSACTION,
      entityId: transactionId,
      entityLabel: transactionId,
      summary: `Book returned`,
    });

    return { id: transactionId };
  }

  // Mark overdue transactions (called by a periodic check or manually)
  async markOverdue(institutionId: string) {
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    const result = await this.db
      .update(libraryTransactions)
      .set({ status: "overdue" })
      .where(
        and(
          eq(libraryTransactions.institutionId, institutionId),
          eq(libraryTransactions.status, "issued"),
          sql`${libraryTransactions.dueDate} < ${today}`,
        ),
      );

    return result;
  }

  // ── Fine collection ────────────────────────────────────────────────────────

  async collectFine(
    institutionId: string,
    transactionId: string,
    session: AuthenticatedSession,
    dto: CollectFineDto,
  ) {
    const [tx] = await this.db
      .select()
      .from(libraryTransactions)
      .where(
        and(
          eq(libraryTransactions.id, transactionId),
          eq(libraryTransactions.institutionId, institutionId),
        ),
      );

    if (!tx) {
      throw new NotFoundException(ERROR_MESSAGES.LIBRARY.TRANSACTION_NOT_FOUND);
    }
    if (tx.finePaid) {
      throw new ConflictException(
        ERROR_MESSAGES.LIBRARY_DEPTH.FINE_ALREADY_PAID,
      );
    }

    await this.db
      .update(libraryTransactions)
      .set({
        finePaid: true,
        fineAmount: dto.waive ? 0 : tx.fineAmount,
      })
      .where(eq(libraryTransactions.id, transactionId));

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.EXECUTE,
      entityType: AUDIT_ENTITY_TYPES.LIBRARY_FINE,
      entityId: transactionId,
      entityLabel: transactionId,
      summary: dto.waive
        ? `Waived fine on transaction ${transactionId}`
        : `Collected fine of ${tx.fineAmount} on transaction ${transactionId}`,
    });

    return { id: transactionId };
  }

  // ── Reservations ───────────────────────────────────────────────────────────

  async createReservation(
    institutionId: string,
    session: AuthenticatedSession,
    dto: CreateReservationDto,
  ) {
    // Validate book
    const [book] = await this.db
      .select()
      .from(libraryBooks)
      .where(
        and(
          eq(libraryBooks.id, dto.bookId),
          eq(libraryBooks.institutionId, institutionId),
        ),
      );

    if (!book) {
      throw new NotFoundException(ERROR_MESSAGES.LIBRARY.BOOK_NOT_FOUND);
    }

    // Validate member
    const [memberRecord] = await this.db
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.id, dto.memberId),
          eq(member.organizationId, institutionId),
        ),
      );

    if (!memberRecord) {
      throw new NotFoundException(ERROR_MESSAGES.LIBRARY.MEMBER_NOT_FOUND);
    }

    // Check for existing pending reservation
    const [existing] = await this.db
      .select({ id: libraryReservations.id })
      .from(libraryReservations)
      .where(
        and(
          eq(libraryReservations.institutionId, institutionId),
          eq(libraryReservations.bookId, dto.bookId),
          eq(libraryReservations.memberId, dto.memberId),
          eq(
            libraryReservations.status,
            LIBRARY_RESERVATION_STATUS.PENDING,
          ),
        ),
      );

    if (existing) {
      throw new ConflictException(
        ERROR_MESSAGES.LIBRARY_DEPTH.ALREADY_RESERVED,
      );
    }

    // Determine queue position
    const [{ maxPos }] = await this.db
      .select({ maxPos: sql<number>`coalesce(max(${libraryReservations.queuePosition}), 0)` })
      .from(libraryReservations)
      .where(
        and(
          eq(libraryReservations.institutionId, institutionId),
          eq(libraryReservations.bookId, dto.bookId),
          eq(
            libraryReservations.status,
            LIBRARY_RESERVATION_STATUS.PENDING,
          ),
        ),
      );

    const id = randomUUID();
    await this.db.insert(libraryReservations).values({
      id,
      institutionId,
      bookId: dto.bookId,
      memberId: dto.memberId,
      queuePosition: maxPos + 1,
    });

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.CREATE,
      entityType: AUDIT_ENTITY_TYPES.LIBRARY_RESERVATION,
      entityId: id,
      entityLabel: book.title,
      summary: `Reserved "${book.title}" for member, queue position ${maxPos + 1}`,
    });

    return { id, queuePosition: maxPos + 1 };
  }

  async listReservations(
    institutionId: string,
    query: ListReservationsQueryDto,
  ) {
    const page = query.page ?? 1;
    const pageSize = resolveTablePageSize(query.limit);
    const sortField = query.sort ?? "createdAt";
    const sortOrder = query.order ?? SORT_ORDERS.DESC;
    const sortCol =
      reservationSortColumns[sortField] ?? libraryReservations.createdAt;
    const orderFn = sortOrder === SORT_ORDERS.ASC ? asc : desc;

    const filters = [
      eq(libraryReservations.institutionId, institutionId),
      ...(query.status
        ? [eq(libraryReservations.status, query.status)]
        : []),
      ...(query.bookId
        ? [eq(libraryReservations.bookId, query.bookId)]
        : []),
      ...(query.memberId
        ? [eq(libraryReservations.memberId, query.memberId)]
        : []),
      ...(query.q
        ? [
            or(
              ilike(libraryBooks.title, `%${query.q}%`),
              ilike(reservationUser.name, `%${query.q}%`),
            ),
          ]
        : []),
    ];

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(libraryReservations)
      .innerJoin(
        libraryBooks,
        eq(libraryReservations.bookId, libraryBooks.id),
      )
      .innerJoin(
        reservationMember,
        eq(libraryReservations.memberId, reservationMember.id),
      )
      .innerJoin(
        reservationUser,
        eq(reservationMember.userId, reservationUser.id),
      )
      .where(and(...filters));

    const pagination = resolvePagination(total, page, pageSize);

    const rows = await this.db
      .select({
        id: libraryReservations.id,
        bookId: libraryReservations.bookId,
        bookTitle: libraryBooks.title,
        memberId: libraryReservations.memberId,
        memberName: reservationUser.name,
        queuePosition: libraryReservations.queuePosition,
        status: libraryReservations.status,
        fulfilledAt: libraryReservations.fulfilledAt,
        cancelledAt: libraryReservations.cancelledAt,
        createdAt: libraryReservations.createdAt,
      })
      .from(libraryReservations)
      .innerJoin(
        libraryBooks,
        eq(libraryReservations.bookId, libraryBooks.id),
      )
      .innerJoin(
        reservationMember,
        eq(libraryReservations.memberId, reservationMember.id),
      )
      .innerJoin(
        reservationUser,
        eq(reservationMember.userId, reservationUser.id),
      )
      .where(and(...filters))
      .orderBy(orderFn(sortCol))
      .limit(pageSize)
      .offset(pagination.offset);

    return {
      rows: rows.map((r) => ({
        id: r.id,
        bookId: r.bookId,
        bookTitle: r.bookTitle,
        memberId: r.memberId,
        memberName: r.memberName,
        queuePosition: r.queuePosition,
        status: r.status,
        fulfilledAt: r.fulfilledAt?.toISOString() ?? null,
        cancelledAt: r.cancelledAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
    };
  }

  async fulfillReservation(
    institutionId: string,
    reservationId: string,
    session: AuthenticatedSession,
  ) {
    const [reservation] = await this.db
      .select()
      .from(libraryReservations)
      .where(
        and(
          eq(libraryReservations.id, reservationId),
          eq(libraryReservations.institutionId, institutionId),
        ),
      );

    if (!reservation) {
      throw new NotFoundException(
        ERROR_MESSAGES.LIBRARY_DEPTH.RESERVATION_NOT_FOUND,
      );
    }
    if (reservation.status === LIBRARY_RESERVATION_STATUS.FULFILLED) {
      throw new ConflictException(
        ERROR_MESSAGES.LIBRARY_DEPTH.RESERVATION_FULFILLED,
      );
    }
    if (reservation.status === LIBRARY_RESERVATION_STATUS.CANCELLED) {
      throw new ConflictException(
        ERROR_MESSAGES.LIBRARY_DEPTH.RESERVATION_CANCELLED,
      );
    }

    await this.db
      .update(libraryReservations)
      .set({
        status: LIBRARY_RESERVATION_STATUS.FULFILLED,
        fulfilledAt: new Date(),
      })
      .where(eq(libraryReservations.id, reservationId));

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.LIBRARY_RESERVATION,
      entityId: reservationId,
      entityLabel: reservationId,
      summary: `Fulfilled reservation ${reservationId}`,
    });

    return { id: reservationId };
  }

  async cancelReservation(
    institutionId: string,
    reservationId: string,
    session: AuthenticatedSession,
  ) {
    const [reservation] = await this.db
      .select()
      .from(libraryReservations)
      .where(
        and(
          eq(libraryReservations.id, reservationId),
          eq(libraryReservations.institutionId, institutionId),
        ),
      );

    if (!reservation) {
      throw new NotFoundException(
        ERROR_MESSAGES.LIBRARY_DEPTH.RESERVATION_NOT_FOUND,
      );
    }
    if (reservation.status === LIBRARY_RESERVATION_STATUS.FULFILLED) {
      throw new ConflictException(
        ERROR_MESSAGES.LIBRARY_DEPTH.RESERVATION_FULFILLED,
      );
    }
    if (reservation.status === LIBRARY_RESERVATION_STATUS.CANCELLED) {
      throw new ConflictException(
        ERROR_MESSAGES.LIBRARY_DEPTH.RESERVATION_CANCELLED,
      );
    }

    await this.db
      .update(libraryReservations)
      .set({
        status: LIBRARY_RESERVATION_STATUS.CANCELLED,
        cancelledAt: new Date(),
      })
      .where(eq(libraryReservations.id, reservationId));

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.LIBRARY_RESERVATION,
      entityId: reservationId,
      entityLabel: reservationId,
      summary: `Cancelled reservation ${reservationId}`,
    });

    return { id: reservationId };
  }

  // ── Borrowing history ────────────────────────────────────────────────────

  async memberBorrowingHistory(
    institutionId: string,
    memberId: string,
    query: BorrowingHistoryQueryDto,
  ) {
    // Validate member
    const [memberRecord] = await this.db
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.id, memberId),
          eq(member.organizationId, institutionId),
        ),
      );

    if (!memberRecord) {
      throw new NotFoundException(ERROR_MESSAGES.LIBRARY.MEMBER_NOT_FOUND);
    }

    const page = query.page ?? 1;
    const pageSize = resolveTablePageSize(query.limit);
    const sortField = query.sort ?? "issuedAt";
    const sortOrder = query.order ?? SORT_ORDERS.DESC;
    const sortCol = txSortColumns[sortField] ?? libraryTransactions.issuedAt;
    const orderFn = sortOrder === SORT_ORDERS.ASC ? asc : desc;

    const filters = [
      eq(libraryTransactions.institutionId, institutionId),
      eq(libraryTransactions.memberId, memberId),
    ];

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(libraryTransactions)
      .where(and(...filters));

    const pagination = resolvePagination(total, page, pageSize);

    const rows = await this.db
      .select({
        id: libraryTransactions.id,
        bookId: libraryTransactions.bookId,
        bookTitle: libraryBooks.title,
        bookIsbn: libraryBooks.isbn,
        issuedAt: libraryTransactions.issuedAt,
        dueDate: libraryTransactions.dueDate,
        returnedAt: libraryTransactions.returnedAt,
        fineAmount: libraryTransactions.fineAmount,
        finePaid: libraryTransactions.finePaid,
        status: libraryTransactions.status,
        createdAt: libraryTransactions.createdAt,
      })
      .from(libraryTransactions)
      .innerJoin(libraryBooks, eq(libraryTransactions.bookId, libraryBooks.id))
      .where(and(...filters))
      .orderBy(orderFn(sortCol))
      .limit(pageSize)
      .offset(pagination.offset);

    return {
      rows: rows.map((r) => ({
        id: r.id,
        bookId: r.bookId,
        bookTitle: r.bookTitle,
        bookIsbn: r.bookIsbn ?? null,
        issuedAt: r.issuedAt.toISOString(),
        dueDate: r.dueDate,
        returnedAt: r.returnedAt?.toISOString() ?? null,
        fineAmount: r.fineAmount,
        finePaid: r.finePaid,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
    };
  }

  // ── Overdue detection ────────────────────────────────────────────────────

  async listOverdueTransactions(institutionId: string) {
    const today = new Date().toISOString().split("T")[0];

    const rows = await this.db
      .select({
        id: libraryTransactions.id,
        bookId: libraryTransactions.bookId,
        bookTitle: libraryBooks.title,
        bookIsbn: libraryBooks.isbn,
        memberId: libraryTransactions.memberId,
        memberName: bookUser.name,
        memberEmployeeId: staffProfiles.employeeId,
        issuedAt: libraryTransactions.issuedAt,
        dueDate: libraryTransactions.dueDate,
        fineAmount: libraryTransactions.fineAmount,
        finePaid: libraryTransactions.finePaid,
        status: libraryTransactions.status,
        createdAt: libraryTransactions.createdAt,
      })
      .from(libraryTransactions)
      .innerJoin(libraryBooks, eq(libraryTransactions.bookId, libraryBooks.id))
      .innerJoin(bookMember, eq(libraryTransactions.memberId, bookMember.id))
      .innerJoin(bookUser, eq(bookMember.userId, bookUser.id))
      .leftJoin(
        staffProfiles,
        eq(staffProfiles.membershipId, libraryTransactions.memberId),
      )
      .where(
        and(
          eq(libraryTransactions.institutionId, institutionId),
          or(
            eq(libraryTransactions.status, "overdue"),
            and(
              eq(libraryTransactions.status, "issued"),
              sql`${libraryTransactions.dueDate} < ${today}`,
            ),
          ),
        ),
      )
      .orderBy(asc(libraryTransactions.dueDate));

    return rows.map((r) => ({
      id: r.id,
      bookId: r.bookId,
      bookTitle: r.bookTitle,
      bookIsbn: r.bookIsbn ?? null,
      memberId: r.memberId,
      memberName: r.memberName,
      memberEmployeeId: r.memberEmployeeId ?? null,
      issuedAt: r.issuedAt.toISOString(),
      dueDate: r.dueDate,
      fineAmount: r.fineAmount,
      finePaid: r.finePaid,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  // ── Dashboard ────────────────────────────────────────────────────────────

  async getDashboard(institutionId: string) {
    const today = new Date().toISOString().split("T")[0];

    // Total books stats
    const [bookStats] = await this.db
      .select({
        totalBooks: count(),
        totalCopies: sql<number>`coalesce(sum(${libraryBooks.totalCopies}), 0)`,
        availableCopies: sql<number>`coalesce(sum(${libraryBooks.availableCopies}), 0)`,
      })
      .from(libraryBooks)
      .where(
        and(
          eq(libraryBooks.institutionId, institutionId),
          eq(libraryBooks.status, "active"),
        ),
      );

    // Issued today
    const [{ issuedToday }] = await this.db
      .select({ issuedToday: count() })
      .from(libraryTransactions)
      .where(
        and(
          eq(libraryTransactions.institutionId, institutionId),
          sql`${libraryTransactions.issuedAt}::date = ${today}`,
        ),
      );

    // Returned today
    const [{ returnedToday }] = await this.db
      .select({ returnedToday: count() })
      .from(libraryTransactions)
      .where(
        and(
          eq(libraryTransactions.institutionId, institutionId),
          eq(libraryTransactions.status, "returned"),
          sql`${libraryTransactions.returnedAt}::date = ${today}`,
        ),
      );

    // Overdue count
    const [{ overdueCount }] = await this.db
      .select({ overdueCount: count() })
      .from(libraryTransactions)
      .where(
        and(
          eq(libraryTransactions.institutionId, institutionId),
          or(
            eq(libraryTransactions.status, "overdue"),
            and(
              eq(libraryTransactions.status, "issued"),
              sql`${libraryTransactions.dueDate} < ${today}`,
            ),
          ),
        ),
      );

    // Pending reservations
    const [{ pendingReservations }] = await this.db
      .select({ pendingReservations: count() })
      .from(libraryReservations)
      .where(
        and(
          eq(libraryReservations.institutionId, institutionId),
          eq(
            libraryReservations.status,
            LIBRARY_RESERVATION_STATUS.PENDING,
          ),
        ),
      );

    // Popular books (top 5 by issue count in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const popularBooks = await this.db
      .select({
        bookId: libraryTransactions.bookId,
        title: libraryBooks.title,
        issueCount: count(),
      })
      .from(libraryTransactions)
      .innerJoin(libraryBooks, eq(libraryTransactions.bookId, libraryBooks.id))
      .where(
        and(
          eq(libraryTransactions.institutionId, institutionId),
          sql`${libraryTransactions.issuedAt} >= ${thirtyDaysAgo}`,
        ),
      )
      .groupBy(libraryTransactions.bookId, libraryBooks.title)
      .orderBy(desc(count()))
      .limit(5);

    // Recent transactions (last 10)
    const recentTransactions = await this.db
      .select({
        id: libraryTransactions.id,
        bookTitle: libraryBooks.title,
        memberName: bookUser.name,
        status: libraryTransactions.status,
        issuedAt: libraryTransactions.issuedAt,
      })
      .from(libraryTransactions)
      .innerJoin(libraryBooks, eq(libraryTransactions.bookId, libraryBooks.id))
      .innerJoin(bookMember, eq(libraryTransactions.memberId, bookMember.id))
      .innerJoin(bookUser, eq(bookMember.userId, bookUser.id))
      .where(eq(libraryTransactions.institutionId, institutionId))
      .orderBy(desc(libraryTransactions.createdAt))
      .limit(10);

    return {
      totalBooks: bookStats.totalBooks,
      totalCopies: Number(bookStats.totalCopies),
      availableCopies: Number(bookStats.availableCopies),
      issuedToday,
      returnedToday,
      overdueCount,
      pendingReservations,
      popularBooks: popularBooks.map((p) => ({
        bookId: p.bookId,
        title: p.title,
        issueCount: p.issueCount,
      })),
      recentTransactions: recentTransactions.map((t) => ({
        id: t.id,
        bookTitle: t.bookTitle,
        memberName: t.memberName,
        status: t.status,
        issuedAt: t.issuedAt.toISOString(),
      })),
    };
  }
}
