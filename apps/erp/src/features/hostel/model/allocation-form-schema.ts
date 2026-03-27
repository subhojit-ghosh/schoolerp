import { z } from "zod";

export const allocationFormSchema = z.object({
  roomId: z.string().min(1, "Select a room"),
  studentId: z.string().min(1, "Select a student"),
  bedNumber: z.string().trim().min(1, "Bed number is required").max(20),
  startDate: z.string().min(1, "Start date is required"),
});

export type AllocationFormValues = z.infer<typeof allocationFormSchema>;

export const ALLOCATION_DEFAULT_VALUES: AllocationFormValues = {
  roomId: "",
  studentId: "",
  bedNumber: "",
  startDate: new Date().toISOString().split("T")[0]!,
};
