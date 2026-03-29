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
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@repo/contracts";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, SORT_ORDERS } from "../../constants";
import { resolveTablePageSize, resolvePagination } from "../../lib/list-query";
import type { AuthenticatedSession } from "../auth/auth.types";
import { AuditService } from "../audit/audit.service";
import type {
  CreateBookDto,
  IssueBookDto,
  ListBooksQueryDto,
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
}
