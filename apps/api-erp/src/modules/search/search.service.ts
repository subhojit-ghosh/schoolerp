import { Inject, Injectable } from "@nestjs/common";
import { DATABASE } from "@repo/backend-core";
import {
  and,
  eq,
  ilike,
  isNull,
  member,
  or,
  sql,
  staffProfiles,
  students,
  user,
  feePayments,
  feeAssignments,
  type AppDatabase,
} from "@repo/database";

const SEARCH_LIMIT = 8;

type SearchResultItem = {
  type: "student" | "staff" | "guardian" | "receipt";
  id: string;
  title: string;
  subtitle: string | null;
  url: string;
};

@Injectable()
export class SearchService {
  constructor(@Inject(DATABASE) private readonly db: AppDatabase) {}

  async globalSearch(
    institutionId: string,
    query: string,
  ): Promise<{ results: SearchResultItem[] }> {
    const q = query.trim();
    if (!q || q.length < 2) {
      return { results: [] };
    }

    const pattern = `%${q}%`;

    const [studentResults, staffResults, receiptResults] = await Promise.all([
      this.searchStudents(institutionId, pattern),
      this.searchStaff(institutionId, pattern),
      this.searchReceipts(institutionId, q),
    ]);

    return {
      results: [...studentResults, ...staffResults, ...receiptResults].slice(
        0,
        20,
      ),
    };
  }

  private async searchStudents(
    institutionId: string,
    pattern: string,
  ): Promise<SearchResultItem[]> {
    const rows = await this.db
      .select({
        id: students.id,
        firstName: students.firstName,
        lastName: students.lastName,
        admissionNumber: students.admissionNumber,
      })
      .from(students)
      .where(
        and(
          eq(students.institutionId, institutionId),
          isNull(students.deletedAt),
          or(
            ilike(students.firstName, pattern),
            ilike(students.admissionNumber, pattern),
            sql`concat(${students.firstName}, ' ', coalesce(${students.lastName}, '')) ilike ${pattern}`,
          ),
        ),
      )
      .limit(SEARCH_LIMIT);

    return rows.map((r) => ({
      type: "student" as const,
      id: r.id,
      title: [r.firstName, r.lastName].filter(Boolean).join(" "),
      subtitle: `Adm. No. ${r.admissionNumber}`,
      url: `/students/${r.id}`,
    }));
  }

  private async searchStaff(
    institutionId: string,
    pattern: string,
  ): Promise<SearchResultItem[]> {
    const rows = await this.db
      .select({
        membershipId: member.id,
        name: user.name,
        employeeId: staffProfiles.employeeId,
        designation: staffProfiles.designation,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .leftJoin(staffProfiles, eq(staffProfiles.membershipId, member.id))
      .where(
        and(
          eq(member.organizationId, institutionId),
          eq(member.memberType, "staff"),
          eq(member.status, "active"),
          or(
            ilike(user.name, pattern),
            ilike(staffProfiles.employeeId, pattern),
          ),
        ),
      )
      .limit(SEARCH_LIMIT);

    return rows.map((r) => ({
      type: "staff" as const,
      id: r.membershipId,
      title: r.name,
      subtitle: r.employeeId
        ? `Employee ID: ${r.employeeId}`
        : (r.designation ?? null),
      url: `/staff/${r.membershipId}`,
    }));
  }

  private async searchReceipts(
    institutionId: string,
    query: string,
  ): Promise<SearchResultItem[]> {
    const rows = await this.db
      .select({
        paymentId: feePayments.id,
        receiptNumber: feePayments.receiptNumber,
        amountInPaise: feePayments.amountInPaise,
        feeAssignmentId: feePayments.feeAssignmentId,
      })
      .from(feePayments)
      .innerJoin(
        feeAssignments,
        eq(feePayments.feeAssignmentId, feeAssignments.id),
      )
      .where(
        and(
          eq(feeAssignments.institutionId, institutionId),
          ilike(feePayments.receiptNumber, `%${query}%`),
        ),
      )
      .limit(SEARCH_LIMIT);

    return rows.map((r) => ({
      type: "receipt" as const,
      id: r.paymentId,
      title: `Receipt #${r.receiptNumber ?? r.paymentId.slice(0, 8)}`,
      subtitle: `${(r.amountInPaise / 100).toFixed(0)}`,
      url: `/fees/assignments/${r.feeAssignmentId}/receipt`,
    }));
  }
}
