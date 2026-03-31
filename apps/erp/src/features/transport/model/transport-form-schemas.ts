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

// ── Driver ────────────────────────────────────────────────────────────────

const DRIVER_NAME_MAX = 200;
const MOBILE_MAX = 20;
const LICENSE_MAX = 50;
const ADDRESS_MAX = 500;

export const driverFormSchema = z.object({
  name: z.string().trim().min(1, "Driver name is required").max(DRIVER_NAME_MAX),
  mobile: z.string().trim().min(1, "Mobile number is required").max(MOBILE_MAX),
  licenseNumber: z.string().trim().max(LICENSE_MAX).optional(),
  licenseExpiry: z.string().trim().optional(),
  address: z.string().trim().max(ADDRESS_MAX).optional(),
  emergencyContact: z.string().trim().max(MOBILE_MAX).optional(),
});

export type DriverFormValues = z.infer<typeof driverFormSchema>;

export const DEFAULT_DRIVER_FORM_VALUES: DriverFormValues = {
  name: "",
  mobile: "",
  licenseNumber: "",
  licenseExpiry: "",
  address: "",
  emergencyContact: "",
};

// ── Maintenance Log ───────────────────────────────────────────────────────

const DESCRIPTION_MAX = 1000;
const VENDOR_MAX = 200;

export const maintenanceLogFormSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  maintenanceType: z.enum(["regular", "repair", "inspection"], {
    error: "Maintenance type is required",
  }),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(DESCRIPTION_MAX),
  costInPaise: z.number().int().nonnegative().optional(),
  maintenanceDate: z.string().min(1, "Maintenance date is required"),
  nextDueDate: z.string().trim().optional(),
  vendorName: z.string().trim().max(VENDOR_MAX).optional(),
});

export type MaintenanceLogFormValues = z.infer<typeof maintenanceLogFormSchema>;

export const DEFAULT_MAINTENANCE_LOG_FORM_VALUES: MaintenanceLogFormValues = {
  vehicleId: "",
  maintenanceType: "regular",
  description: "",
  costInPaise: undefined,
  maintenanceDate: "",
  nextDueDate: "",
  vendorName: "",
};
