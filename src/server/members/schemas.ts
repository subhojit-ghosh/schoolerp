import { z } from "zod";
import { zfd } from "zod-form-data";
import { V } from "@/constants";

export const createMemberSchema = z.object({
  name: V.name,
  email: V.email,
  password: V.password,
  roleId: z.string().min(1, "Role is required"),
});

export const createMemberFormSchema = zfd.formData({
  name: zfd.text(createMemberSchema.shape.name),
  email: zfd.text(createMemberSchema.shape.email),
  password: zfd.text(createMemberSchema.shape.password),
  roleId: zfd.text(createMemberSchema.shape.roleId),
});

export const updateMemberRoleSchema = z.object({
  memberId: z.uuid(),
  roleId: z.string().min(1),
});

export const memberIdSchema = z.object({
  memberId: z.uuid(),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
