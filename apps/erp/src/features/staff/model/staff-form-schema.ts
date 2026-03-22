import { z } from "zod";
import type { components } from "@/lib/api/generated/schema";

const MOBILE_MIN_LENGTH = 10;
const PASSWORD_MIN_LENGTH = 8;

export const STAFF_STATUS_OPTIONS = [
  "active",
  "inactive",
  "suspended",
] as const;

export const STAFF_GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
] as const;

export const BLOOD_GROUP_OPTIONS = [
  { value: "A+", label: "A+" },
  { value: "A-", label: "A-" },
  { value: "B+", label: "B+" },
  { value: "B-", label: "B-" },
  { value: "AB+", label: "AB+" },
  { value: "AB-", label: "AB-" },
  { value: "O+", label: "O+" },
  { value: "O-", label: "O-" },
] as const;

export const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contractual", label: "Contractual" },
] as const;

const staffProfileSchema = z.object({
  employeeId: z.string().trim().optional().or(z.literal("")),
  designation: z.string().trim().optional().or(z.literal("")),
  department: z.string().trim().optional().or(z.literal("")),
  dateOfJoining: z.string().optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.enum(["male", "female", "other"]).optional().or(z.literal("")),
  bloodGroup: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .optional()
    .or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  emergencyContactName: z.string().trim().optional().or(z.literal("")),
  emergencyContactMobile: z.string().trim().optional().or(z.literal("")),
  qualification: z.string().trim().optional().or(z.literal("")),
  experienceYears: z.string().optional().or(z.literal("")),
  employmentType: z
    .enum(["full_time", "part_time", "contractual"])
    .optional()
    .or(z.literal("")),
});

const staffBaseSchema = z.object({
  name: z.string().trim().min(1, "Staff name is required"),
  mobile: z.string().trim().min(MOBILE_MIN_LENGTH, "Staff mobile is required"),
  email: z.email().optional().or(z.literal("")),
  status: z.enum(STAFF_STATUS_OPTIONS),
  profile: staffProfileSchema,
});

export const staffFormSchema = staffBaseSchema;

export const staffCreateFormSchema = staffBaseSchema.extend({
  temporaryPassword: z
    .string()
    .min(
      PASSWORD_MIN_LENGTH,
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    ),
});

export type StaffFormValues = z.infer<typeof staffFormSchema>;
export type StaffCreateFormValues = z.infer<typeof staffCreateFormSchema>;
export type StaffProfileFormValues = z.infer<typeof staffProfileSchema>;
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

export const EMPTY_STAFF_PROFILE: StaffProfileFormValues = {
  employeeId: "",
  designation: "",
  department: "",
  dateOfJoining: "",
  dateOfBirth: "",
  gender: "",
  bloodGroup: "",
  address: "",
  emergencyContactName: "",
  emergencyContactMobile: "",
  qualification: "",
  experienceYears: "",
  employmentType: "",
};
