import { z } from "zod";

export const leaveTypeFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  maxDaysPerYear: z.number().int().positive().nullable().optional(),
  isPaid: z.boolean(),
});

export type LeaveTypeFormValues = z.infer<typeof leaveTypeFormSchema>;

export const DEFAULT_LEAVE_TYPE_FORM_VALUES: LeaveTypeFormValues = {
  name: "",
  maxDaysPerYear: undefined,
  isPaid: true,
};

export const leaveApplicationFormSchema = z
  .object({
    leaveTypeId: z.string().min(1, "Leave type is required"),
    fromDate: z.string().min(1, "From date is required"),
    toDate: z.string().min(1, "To date is required"),
    reason: z.string().trim().max(2000).optional(),
  })
  .refine(
    (data) => !data.fromDate || !data.toDate || data.fromDate <= data.toDate,
    {
      message: "To date must be on or after from date.",
      path: ["toDate"],
    },
  );

export type LeaveApplicationFormValues = z.infer<
  typeof leaveApplicationFormSchema
>;

export const DEFAULT_LEAVE_APPLICATION_FORM_VALUES: LeaveApplicationFormValues =
  {
    leaveTypeId: "",
    fromDate: "",
    toDate: "",
    reason: "",
  };
