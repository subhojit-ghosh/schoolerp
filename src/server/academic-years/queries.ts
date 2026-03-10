import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { academicYears } from "@/db/schema";
import { STATUS } from "@/constants";

export type AcademicYearRow = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status: (typeof STATUS.ACADEMIC_YEAR)[keyof typeof STATUS.ACADEMIC_YEAR];
  createdAt: Date;
};

export async function listAcademicYears(institutionId: string): Promise<AcademicYearRow[]> {
  const rows = await db
    .select({
      id: academicYears.id,
      name: academicYears.name,
      startDate: academicYears.startDate,
      endDate: academicYears.endDate,
      isCurrent: academicYears.isCurrent,
      status: academicYears.status,
      createdAt: academicYears.createdAt,
    })
    .from(academicYears)
    .where(
      and(
        eq(academicYears.institutionId, institutionId),
        isNull(academicYears.deletedAt),
      ),
    )
    .orderBy(desc(academicYears.isCurrent), desc(academicYears.startDate));

  return rows.map((row) => ({
    ...row,
    status: row.status,
  }));
}
