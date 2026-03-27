import { z } from "zod";

export const buildingFormSchema = z.object({
  name: z.string().trim().min(1, "Building name is required").max(200),
  buildingType: z.enum(["boys", "girls", "co_ed"], {
    message: "Select a building type",
  }),
  campusId: z.string().optional().or(z.literal("")),
  wardenMembershipId: z.string().optional().or(z.literal("")),
  capacity: z.coerce.number().int().min(0).default(0),
  description: z.string().max(1000).optional().or(z.literal("")),
});

export type BuildingFormValues = z.infer<typeof buildingFormSchema>;

export const BUILDING_DEFAULT_VALUES: BuildingFormValues = {
  name: "",
  buildingType: "boys",
  campusId: "",
  wardenMembershipId: "",
  capacity: 0,
  description: "",
};
