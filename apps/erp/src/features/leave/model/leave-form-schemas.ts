import { z } from "zod";

export const LEAVE_CATEGORIES = [
  { value: "casual", label: "Casual Leave" },
  { value: "sick", label: "Sick Leave" },
  { value: "earned", label: "Earned Leave" },
  { value: "comp_off", label: "Compensatory Off" },
  { value: "maternity", label: "Maternity Leave" },
  { value: "paternity", label: "Paternity Leave" },
  { value: "other", label: "Other" },
] as const;

export const leaveTypeFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  maxDaysPerYear: z.number().int().positive().nullable().optional(),
  isPaid: z.boolean(),
  carryForwardDays: z.number().int().min(0),
  isHalfDayAllowed: z.boolean(),
  leaveCategory: z.enum([
    "casual",
    "sick",
    "earned",
    "comp_off",
    "maternity",
    "paternity",
    "other",
  ]),
});

export type LeaveTypeFormValues = z.infer<typeof leaveTypeFormSchema>;

export const DEFAULT_LEAVE_TYPE_FORM_VALUES: LeaveTypeFormValues = {
  name: "",
  maxDaysPerYear: undefined,
  isPaid: true,
  carryForwardDays: 0,
  isHalfDayAllowed: false,
  leaveCategory: "other",
};

export const leaveApplicationFormSchema = z
  .object({
    leaveTypeId: z.string().min(1, "Leave type is required"),
    fromDate: z.string().min(1, "From date is required"),
    toDate: z.string().min(1, "To date is required"),
    isHalfDay: z.boolean(),
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
    isHalfDay: false,
    reason: "",
  };
