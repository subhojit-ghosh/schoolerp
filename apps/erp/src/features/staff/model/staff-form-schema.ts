import { z } from "zod";
import type { components } from "@/lib/api/generated/schema";

const MOBILE_MIN_LENGTH = 10;
const PASSWORD_MIN_LENGTH = 8;

export const STAFF_STATUS_OPTIONS = [
  "active",
  "inactive",
  "suspended",
] as const;

const staffBaseSchema = z.object({
  name: z.string().trim().min(1, "Staff name is required"),
  mobile: z.string().trim().min(MOBILE_MIN_LENGTH, "Staff mobile is required"),
  email: z.email().optional().or(z.literal("")),
  status: z.enum(STAFF_STATUS_OPTIONS),
});

export const staffFormSchema = staffBaseSchema;

export const staffCreateFormSchema = staffBaseSchema.extend({
  temporaryPassword: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`),
});

export type StaffFormValues = z.infer<typeof staffFormSchema>;
export type StaffCreateFormValues = z.infer<typeof staffCreateFormSchema>;
export type StaffRecord = components["schemas"]["StaffDto"];
export type StaffRoleOption = components["schemas"]["StaffRoleDto"];
export type StaffRoleAssignment =
  components["schemas"]["StaffRoleAssignmentDto"];

export type StaffRoleAssignmentDraft = {
  roleId: string;
  campusId: string;
  classId: string;
  sectionId: string;
};

export const EMPTY_STAFF_ROLE_ASSIGNMENT_DRAFT: StaffRoleAssignmentDraft = {
  roleId: "",
  campusId: "",
  classId: "",
  sectionId: "",
};
