import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DATABASE } from "@repo/backend-core";
import {
  and,
  asc,
  desc,
  eq,
  member,
  ptmSessions,
  ptmSlots,
  user,
  type AppDatabase,
} from "@repo/database";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@repo/contracts";
import { randomUUID } from "node:crypto";
import { AuditService } from "../audit/audit.service";
import type { AuthenticatedSession } from "../auth/auth.types";

@Injectable()
export class PtmService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly auditService: AuditService,
  ) {}

  async listSessions(institutionId: string) {
    const rows = await this.db
      .select()
      .from(ptmSessions)
      .where(eq(ptmSessions.institutionId, institutionId))
      .orderBy(desc(ptmSessions.ptmDate));

    return rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  async createSession(
    institutionId: string,
    session: AuthenticatedSession,
    dto: {
      title: string;
      description?: string;
      ptmDate: string;
      startTime: string;
      endTime: string;
      slotDurationMinutes?: number;
      campusId?: string;
    },
  ) {
    const id = randomUUID();
    await this.db.insert(ptmSessions).values({
      id,
      institutionId,
      campusId: dto.campusId ?? null,
      title: dto.title,
      description: dto.description ?? null,
      ptmDate: dto.ptmDate,
      startTime: dto.startTime,
      endTime: dto.endTime,
      slotDurationMinutes: dto.slotDurationMinutes ?? 15,
      status: "scheduled",
    });

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.CREATE,
      entityType: AUDIT_ENTITY_TYPES.CALENDAR_EVENT,
      entityId: id,
      entityLabel: dto.title,
      summary: `Created PTM session "${dto.title}" on ${dto.ptmDate}`,
    });

    return { id };
  }

  async updateSession(
    institutionId: string,
    sessionId: string,
    session: AuthenticatedSession,
    dto: {
      title?: string;
      description?: string;
      status?: "scheduled" | "in_progress" | "completed" | "cancelled";
    },
  ) {
    const existing = await this.db
      .select()
      .from(ptmSessions)
      .where(
        and(
          eq(ptmSessions.id, sessionId),
          eq(ptmSessions.institutionId, institutionId),
        ),
      )
      .then((rows) => rows[0]);

    if (!existing) throw new NotFoundException("PTM session not found.");

    await this.db
      .update(ptmSessions)
      .set({
        title: dto.title ?? existing.title,
        description:
          dto.description !== undefined
            ? dto.description
            : existing.description,
        status: dto.status ?? existing.status,
      })
      .where(eq(ptmSessions.id, sessionId));

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.CALENDAR_EVENT,
      entityId: sessionId,
      entityLabel: dto.title ?? existing.title,
      summary: `Updated PTM session "${dto.title ?? existing.title}"`,
    });

    return { id: sessionId };
  }

  async listSlots(institutionId: string, ptmSessionId: string) {
    const teacherUser = user;

    const rows = await this.db
      .select({
        id: ptmSlots.id,
        ptmSessionId: ptmSlots.ptmSessionId,
        teacherMembershipId: ptmSlots.teacherMembershipId,
        teacherName: teacherUser.name,
        studentMembershipId: ptmSlots.studentMembershipId,
        parentMembershipId: ptmSlots.parentMembershipId,
        startTime: ptmSlots.startTime,
        endTime: ptmSlots.endTime,
        status: ptmSlots.status,
        feedback: ptmSlots.feedback,
        attendanceMarked: ptmSlots.attendanceMarked,
      })
      .from(ptmSlots)
      .innerJoin(member, eq(ptmSlots.teacherMembershipId, member.id))
      .innerJoin(teacherUser, eq(member.userId, teacherUser.id))
      .where(
        and(
          eq(ptmSlots.ptmSessionId, ptmSessionId),
          eq(ptmSlots.institutionId, institutionId),
        ),
      )
      .orderBy(asc(ptmSlots.startTime));

    return rows;
  }

  async bookSlot(
    institutionId: string,
    slotId: string,
    dto: {
      studentMembershipId: string;
      parentMembershipId: string;
    },
  ) {
    const slot = await this.db
      .select()
      .from(ptmSlots)
      .where(
        and(eq(ptmSlots.id, slotId), eq(ptmSlots.institutionId, institutionId)),
      )
      .then((rows) => rows[0]);

    if (!slot) throw new NotFoundException("PTM slot not found.");
    if (slot.status !== "available") {
      throw new BadRequestException("This slot is not available for booking.");
    }

    await this.db
      .update(ptmSlots)
      .set({
        studentMembershipId: dto.studentMembershipId,
        parentMembershipId: dto.parentMembershipId,
        status: "booked",
      })
      .where(eq(ptmSlots.id, slotId));

    return { id: slotId };
  }

  async recordFeedback(
    institutionId: string,
    slotId: string,
    dto: {
      feedback: string;
      attendanceMarked: boolean;
    },
  ) {
    const slot = await this.db
      .select()
      .from(ptmSlots)
      .where(
        and(eq(ptmSlots.id, slotId), eq(ptmSlots.institutionId, institutionId)),
      )
      .then((rows) => rows[0]);

    if (!slot) throw new NotFoundException("PTM slot not found.");

    await this.db
      .update(ptmSlots)
      .set({
        feedback: dto.feedback,
        attendanceMarked: dto.attendanceMarked,
        status: "completed",
      })
      .where(eq(ptmSlots.id, slotId));

    return { id: slotId };
  }

  async generateSlots(
    institutionId: string,
    ptmSessionId: string,
    teacherMembershipIds: string[],
  ) {
    const ptmSession = await this.db
      .select()
      .from(ptmSessions)
      .where(
        and(
          eq(ptmSessions.id, ptmSessionId),
          eq(ptmSessions.institutionId, institutionId),
        ),
      )
      .then((rows) => rows[0]);

    if (!ptmSession) throw new NotFoundException("PTM session not found.");

    const slotDuration = ptmSession.slotDurationMinutes;
    const startMinutes = parseTimeToMinutes(ptmSession.startTime);
    const endMinutes = parseTimeToMinutes(ptmSession.endTime);

    const slots: Array<{
      id: string;
      ptmSessionId: string;
      institutionId: string;
      teacherMembershipId: string;
      startTime: string;
      endTime: string;
      status: "available";
    }> = [];

    for (const teacherId of teacherMembershipIds) {
      let current = startMinutes;
      while (current + slotDuration <= endMinutes) {
        slots.push({
          id: randomUUID(),
          ptmSessionId,
          institutionId,
          teacherMembershipId: teacherId,
          startTime: minutesToTime(current),
          endTime: minutesToTime(current + slotDuration),
          status: "available",
        });
        current += slotDuration;
      }
    }

    if (slots.length > 0) {
      await this.db.insert(ptmSlots).values(slots);
    }

    return { created: slots.length };
  }
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
