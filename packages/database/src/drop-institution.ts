/**
 * One-off script to cleanly delete an institution and all its data.
 * Usage: bun --env-file=.env.local src/drop-institution.ts <institution-slug>
 *
 * Deletes in dependency order to satisfy FK constraints.
 * Does NOT delete the user account — only the institution and its data.
 */

import { eq, inArray } from "drizzle-orm";
import {
  academicYears,
  attendanceRecords,
  campusMemberships,
  classSections,
  examMarks,
  examTerms,
  feeAssignments,
  feePayments,
  feeStructures,
  membershipRoleScopes,
  membershipRoles,
  roles,
  schoolClasses,
  studentCurrentEnrollments,
  studentGuardianLinks,
  students,
} from "./schema";
import { campus, member, organization, session } from "./schema/auth";
import { createDatabase, createPostgresClient } from "./client";

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: bun src/drop-institution.ts <institution-slug>");
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const client = createPostgresClient(databaseUrl);
const db = createDatabase(client);

async function run() {
  // 1. Resolve institution
  const [org] = await db
    .select({ id: organization.id, name: organization.name })
    .from(organization)
    .where(eq(organization.slug, slug));

  if (!org) {
    console.error(`No institution found with slug "${slug}"`);
    process.exit(1);
  }

  console.log(`Deleting institution: ${org.name} (${org.id})`);

  await db.transaction(async (tx) => {
    // 2. Resolve members for this institution
    const institutionMembers = await tx
      .select({ id: member.id })
      .from(member)
      .where(eq(member.organizationId, org.id));
    const memberIds = institutionMembers.map((m) => m.id);

    // 3. Resolve membershipRoles for those members
    const mRoles =
      memberIds.length > 0
        ? await tx
            .select({ id: membershipRoles.id })
            .from(membershipRoles)
            .where(inArray(membershipRoles.membershipId, memberIds))
        : [];
    const mRoleIds = mRoles.map((r) => r.id);

    // 4. Resolve student membershipIds for guardian links (no institutionId on that table)
    const institutionStudents = await tx
      .select({ membershipId: students.membershipId })
      .from(students)
      .where(eq(students.institutionId, org.id));
    const studentMembershipIds = institutionStudents.map((s) => s.membershipId);

    // 6. Resolve classes
    const institutionClasses = await tx
      .select({ id: schoolClasses.id })
      .from(schoolClasses)
      .where(eq(schoolClasses.institutionId, org.id));
    const classIds = institutionClasses.map((c) => c.id);

    // --- Delete transactional records first ---

    // fee payments
    const assignmentIds = (
      await tx
        .select({ id: feeAssignments.id })
        .from(feeAssignments)
        .where(eq(feeAssignments.institutionId, org.id))
    ).map((a) => a.id);

    if (assignmentIds.length > 0) {
      await tx
        .delete(feePayments)
        .where(inArray(feePayments.feeAssignmentId, assignmentIds));
    }

    // fee assignments
    await tx
      .delete(feeAssignments)
      .where(eq(feeAssignments.institutionId, org.id));

    // exam marks
    const termIds = (
      await tx
        .select({ id: examTerms.id })
        .from(examTerms)
        .where(eq(examTerms.institutionId, org.id))
    ).map((t) => t.id);

    if (termIds.length > 0) {
      await tx.delete(examMarks).where(inArray(examMarks.examTermId, termIds));
    }

    // attendance records
    if (classIds.length > 0) {
      const sectionIds = (
        await tx
          .select({ id: classSections.id })
          .from(classSections)
          .where(inArray(classSections.classId, classIds))
      ).map((s) => s.id);

      if (sectionIds.length > 0) {
        await tx
          .delete(attendanceRecords)
          .where(inArray(attendanceRecords.sectionId, sectionIds));
      }
    }

    // student enrollments (has institutionId)
    await tx
      .delete(studentCurrentEnrollments)
      .where(eq(studentCurrentEnrollments.institutionId, org.id));

    // guardian links (no institutionId — delete via student membershipIds)
    if (studentMembershipIds.length > 0) {
      await tx
        .delete(studentGuardianLinks)
        .where(
          inArray(
            studentGuardianLinks.studentMembershipId,
            studentMembershipIds,
          ),
        );
    }

    // students
    await tx.delete(students).where(eq(students.institutionId, org.id));

    // exam terms, fee structures, academic years
    await tx.delete(examTerms).where(eq(examTerms.institutionId, org.id));
    await tx
      .delete(feeStructures)
      .where(eq(feeStructures.institutionId, org.id));
    await tx
      .delete(academicYears)
      .where(eq(academicYears.institutionId, org.id));

    // class sections then classes
    if (classIds.length > 0) {
      await tx
        .delete(classSections)
        .where(inArray(classSections.classId, classIds));
    }
    await tx
      .delete(schoolClasses)
      .where(eq(schoolClasses.institutionId, org.id));

    // membership role scopes, then membership roles
    if (mRoleIds.length > 0) {
      await tx
        .delete(membershipRoleScopes)
        .where(inArray(membershipRoleScopes.membershipRoleId, mRoleIds));
    }
    if (memberIds.length > 0) {
      await tx
        .delete(membershipRoles)
        .where(inArray(membershipRoles.membershipId, memberIds));
    }

    // campus memberships, then members
    if (memberIds.length > 0) {
      await tx
        .delete(campusMemberships)
        .where(inArray(campusMemberships.membershipId, memberIds));
    }
    await tx.delete(member).where(eq(member.organizationId, org.id));

    // campuses
    await tx.delete(campus).where(eq(campus.organizationId, org.id));

    // institution-scoped custom roles (system roles have institutionId = NULL)
    await tx.delete(roles).where(eq(roles.institutionId, org.id));

    // clear active org/campus references in sessions before deleting org
    await tx
      .update(session)
      .set({ activeOrganizationId: null, activeCampusId: null })
      .where(eq(session.activeOrganizationId, org.id));

    // finally the organization
    await tx.delete(organization).where(eq(organization.id, org.id));
  });

  console.log(`✓ Institution "${slug}" deleted successfully.`);
  await client.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
