import { z } from "zod";

export const initialSuperAdminSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type InitialSuperAdminValues = z.infer<typeof initialSuperAdminSchema>;
