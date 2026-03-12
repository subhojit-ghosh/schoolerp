import { BadRequestException } from "@nestjs/common";
import { z } from "zod";

export const createCampusSchema = z.object({
  name: z.string().trim().min(1, "Campus name is required"),
  slug: z.string().trim().optional(),
  code: z.string().trim().optional(),
  isDefault: z.boolean().optional(),
});

export type CreateCampusDto = z.infer<typeof createCampusSchema>;

export function parseCreateCampus(value: unknown) {
  const result = createCampusSchema.safeParse(value);

  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }

  return result.data;
}
