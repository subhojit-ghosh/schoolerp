import { z } from "zod";

// ── Route ──────────────────────────────────────────────────────────────────

export const routeFormSchema = z.object({
  name: z.string().trim().min(1, "Route name is required").max(200),
  description: z.string().trim().max(500).optional(),
  campusId: z.string().optional(),
});

export type RouteFormValues = z.infer<typeof routeFormSchema>;

export const DEFAULT_ROUTE_FORM_VALUES: RouteFormValues = {
  name: "",
  description: "",
  campusId: "",
};

// ── Stop ───────────────────────────────────────────────────────────────────

export const stopFormSchema = z.object({
  name: z.string().trim().min(1, "Stop name is required").max(200),
  sequenceNumber: z
    .number({ error: "Sequence must be a number" })
    .int()
    .positive("Sequence must be a positive number"),
  pickupTime: z.string().trim().max(10).optional(),
  dropTime: z.string().trim().max(10).optional(),
});

export type StopFormValues = z.infer<typeof stopFormSchema>;

export const DEFAULT_STOP_FORM_VALUES: StopFormValues = {
  name: "",
  sequenceNumber: 1,
  pickupTime: "",
  dropTime: "",
};

// ── Vehicle ────────────────────────────────────────────────────────────────

export const vehicleFormSchema = z.object({
  registrationNumber: z
    .string()
    .trim()
    .min(1, "Registration number is required")
    .max(50),
  type: z.enum(["bus", "van", "auto"], {
    error: "Vehicle type is required",
  }),
  capacity: z
    .number({ error: "Capacity must be a number" })
    .int()
    .positive("Capacity must be a positive number"),
  driverName: z.string().trim().max(200).optional(),
  driverContact: z.string().trim().max(20).optional(),
  routeId: z.string().optional(),
});

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

export const DEFAULT_VEHICLE_FORM_VALUES: VehicleFormValues = {
  registrationNumber: "",
  type: "bus",
  capacity: 40,
  driverName: "",
  driverContact: "",
  routeId: "",
};

// ── Assignment ─────────────────────────────────────────────────────────────

export const assignmentFormSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  routeId: z.string().min(1, "Route is required"),
  stopId: z.string().min(1, "Stop is required"),
  assignmentType: z.enum(["pickup", "dropoff", "both"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
});

export type AssignmentFormValues = z.infer<typeof assignmentFormSchema>;

export const DEFAULT_ASSIGNMENT_FORM_VALUES: AssignmentFormValues = {
  studentId: "",
  routeId: "",
  stopId: "",
  assignmentType: "both" as const,
  startDate: "",
  endDate: "",
};
