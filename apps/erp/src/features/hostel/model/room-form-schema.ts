import { z } from "zod";

export const roomFormSchema = z.object({
  buildingId: z.string().min(1, "Select a building"),
  roomNumber: z.string().trim().min(1, "Room number is required").max(50),
  floor: z.coerce.number().int().min(0).default(0),
  roomType: z.enum(["single", "double", "dormitory"], {
    message: "Select a room type",
  }),
  capacity: z.coerce.number().int().min(1).default(1),
});

export type RoomFormValues = z.infer<typeof roomFormSchema>;

export const ROOM_DEFAULT_VALUES: RoomFormValues = {
  buildingId: "",
  roomNumber: "",
  floor: 0,
  roomType: "double",
  capacity: 2,
};
