import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { DATABASE } from "@repo/backend-core";
import {
  DOMAIN_EVENT_STATUS,
  type DomainEventType,
} from "@repo/contracts";
import {
  and,
  asc,
  count,
  desc,
  domainEvents,
  eq,
  lte,
  or,
  sql,
  type AppDatabase,
  type SQL,
} from "@repo/database";
import { randomUUID } from "node:crypto";
import { SORT_ORDERS } from "../../constants";
import {
  resolvePagination,
  resolveTablePageSize,
  type PaginatedResult,
} from "../../lib/list-query";
import type { ListDomainEventsQuery } from "./domain-events.schemas";
import { sortableDomainEventColumns } from "./domain-events.schemas";

const POLL_INTERVAL_MS = 10_000; // 10 seconds
const BATCH_SIZE = 20;

type EventWriter = Pick<AppDatabase, "insert">;

type EventListener = (event: {
  id: string;
  institutionId: string;
  eventType: DomainEventType;
  payload: Record<string, unknown>;
}) => Promise<void>;

@Injectable()
export class DomainEventsService {
  private readonly logger = new Logger(DomainEventsService.name);
  private readonly listeners = new Map<string, EventListener[]>();
  private processing = false;

  constructor(@Inject(DATABASE) private readonly db: AppDatabase) {}

  /**
   * Register a listener for a specific event type.
   * Called by workflow modules at bootstrap time.
   */
  registerListener(eventType: DomainEventType, listener: EventListener) {
    const existing = this.listeners.get(eventType) ?? [];
    existing.push(listener);
    this.listeners.set(eventType, existing);
    this.logger.log(`Registered listener for event type: ${eventType}`);
  }

  /**
   * Publish a domain event. If a transaction is provided, the event
   * is inserted within that transaction (same DB write as the business op).
   */
  async publish(
    institutionId: string,
    eventType: DomainEventType,
    payload: Record<string, unknown>,
    tx?: EventWriter,
  ): Promise<string> {
    const id = randomUUID();
    const writer = tx ?? this.db;

    await writer.insert(domainEvents).values({
      id,
      institutionId,
      eventType,
      payload,
      status: DOMAIN_EVENT_STATUS.PENDING,
      attempts: 0,
      maxAttempts: 3,
    });

    return id;
  }

  /**
   * Polls for pending events and processes them.
   * Runs on a fixed interval via @nestjs/schedule.
   */
  @Interval(POLL_INTERVAL_MS)
  async processPendingEvents(): Promise<void> {
    // Guard against overlapping polls
    if (this.processing) return;
    this.processing = true;

    try {
      const now = new Date();

      const pendingEvents = await this.db
        .select()
        .from(domainEvents)
        .where(
          and(
            eq(domainEvents.status, DOMAIN_EVENT_STATUS.PENDING),
            or(
              sql`${domainEvents.scheduledFor} IS NULL`,
              lte(domainEvents.scheduledFor, now),
            ),
          ),
        )
        .orderBy(asc(domainEvents.createdAt))
        .limit(BATCH_SIZE);

      for (const event of pendingEvents) {
        await this.processEvent(event);
      }
    } catch (error) {
      this.logger.error(
        `Error polling pending events: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      this.processing = false;
    }
  }

  /**
   * Re-queue failed events that haven't exceeded maxAttempts.
   */
  async retryFailedEvents(): Promise<number> {
    const result = await this.db
      .update(domainEvents)
      .set({
        status: DOMAIN_EVENT_STATUS.PENDING,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(domainEvents.status, DOMAIN_EVENT_STATUS.FAILED),
          sql`${domainEvents.attempts} < ${domainEvents.maxAttempts}`,
        ),
      )
      .returning({ id: domainEvents.id });

    return result.length;
  }

  /**
   * Manually retry a single event by ID.
   */
  async retryEvent(
    institutionId: string,
    eventId: string,
  ): Promise<{ id: string; status: string }> {
    const [event] = await this.db
      .select()
      .from(domainEvents)
      .where(
        and(
          eq(domainEvents.id, eventId),
          eq(domainEvents.institutionId, institutionId),
        ),
      );

    if (!event) {
      throw new NotFoundException("Domain event not found");
    }

    if (event.status !== DOMAIN_EVENT_STATUS.FAILED) {
      throw new ConflictException(
        "Only failed events can be manually retried",
      );
    }

    await this.db
      .update(domainEvents)
      .set({
        status: DOMAIN_EVENT_STATUS.PENDING,
        updatedAt: new Date(),
      })
      .where(eq(domainEvents.id, eventId));

    return { id: eventId, status: DOMAIN_EVENT_STATUS.PENDING };
  }

  /**
   * Paginated list of domain events for admin debugging.
   */
  async listEvents(
    institutionId: string,
    query: ListDomainEventsQuery,
  ): Promise<PaginatedResult<{
    id: string;
    institutionId: string;
    eventType: string;
    payload: Record<string, unknown>;
    status: string;
    attempts: number;
    maxAttempts: number;
    lastError: string | null;
    processedAt: string | null;
    scheduledFor: string | null;
    createdAt: string;
    updatedAt: string;
  }>> {
    const pageSize = resolveTablePageSize(query.limit);
    const sortKey = query.sort ?? sortableDomainEventColumns.createdAt;
    const sortDirection = query.order === SORT_ORDERS.ASC ? asc : desc;

    const conditions: SQL[] = [
      eq(domainEvents.institutionId, institutionId),
    ];

    if (query.eventType) {
      conditions.push(
        sql`${domainEvents.eventType} = ${query.eventType}`,
      );
    }

    if (query.status) {
      conditions.push(
        sql`${domainEvents.status} = ${query.status}`,
      );
    }

    if (query.search) {
      conditions.push(
        sql`${domainEvents.eventType} ILIKE ${"%" + query.search + "%"}`,
      );
    }

    const where = and(...conditions)!;

    const [totalRow] = await this.db
      .select({ count: count() })
      .from(domainEvents)
      .where(where);

    const total = totalRow?.count ?? 0;
    const pagination = resolvePagination(total, query.page, pageSize);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sortableColumns: Record<string, any> = {
      [sortableDomainEventColumns.createdAt]: domainEvents.createdAt,
      [sortableDomainEventColumns.eventType]: domainEvents.eventType,
      [sortableDomainEventColumns.status]: domainEvents.status,
    };

    const rows = await this.db
      .select()
      .from(domainEvents)
      .where(where)
      .orderBy(
        sortDirection(sortableColumns[sortKey]),
        desc(domainEvents.createdAt),
      )
      .limit(pageSize)
      .offset(pagination.offset);

    return {
      rows: rows.map((row) => ({
        id: row.id,
        institutionId: row.institutionId,
        eventType: row.eventType,
        payload: (row.payload ?? {}) as Record<string, unknown>,
        status: row.status,
        attempts: row.attempts,
        maxAttempts: row.maxAttempts,
        lastError: row.lastError ?? null,
        processedAt: row.processedAt?.toISOString() ?? null,
        scheduledFor: row.scheduledFor?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
      total,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
    };
  }

  private async processEvent(event: typeof domainEvents.$inferSelect) {
    const listeners = this.listeners.get(event.eventType) ?? [];

    if (listeners.length === 0) {
      // No listeners registered — mark as processed immediately
      await this.db
        .update(domainEvents)
        .set({
          status: DOMAIN_EVENT_STATUS.PROCESSED,
          processedAt: new Date(),
          attempts: event.attempts + 1,
          updatedAt: new Date(),
        })
        .where(eq(domainEvents.id, event.id));
      return;
    }

    // Mark as processing
    await this.db
      .update(domainEvents)
      .set({
        status: DOMAIN_EVENT_STATUS.PROCESSING,
        attempts: event.attempts + 1,
        updatedAt: new Date(),
      })
      .where(eq(domainEvents.id, event.id));

    try {
      for (const listener of listeners) {
        await listener({
          id: event.id,
          institutionId: event.institutionId,
          eventType: event.eventType as DomainEventType,
          payload: (event.payload ?? {}) as Record<string, unknown>,
        });
      }

      await this.db
        .update(domainEvents)
        .set({
          status: DOMAIN_EVENT_STATUS.PROCESSED,
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(domainEvents.id, event.id));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      const newStatus =
        event.attempts + 1 >= event.maxAttempts
          ? DOMAIN_EVENT_STATUS.FAILED
          : DOMAIN_EVENT_STATUS.PENDING;

      await this.db
        .update(domainEvents)
        .set({
          status: newStatus,
          lastError: errorMessage,
          updatedAt: new Date(),
        })
        .where(eq(domainEvents.id, event.id));

      this.logger.warn(
        `Event ${event.id} (${event.eventType}) failed attempt ${event.attempts + 1}: ${errorMessage}`,
      );
    }
  }
}
