import { ANNOUNCEMENT_AUDIENCE } from "@repo/contracts";
import { z } from "zod";

export const ANNOUNCEMENT_AUDIENCE_OPTIONS = [
  { label: "Everyone", value: ANNOUNCEMENT_AUDIENCE.ALL },
  { label: "Staff", value: ANNOUNCEMENT_AUDIENCE.STAFF },
  { label: "Guardians", value: ANNOUNCEMENT_AUDIENCE.GUARDIANS },
  { label: "Students", value: ANNOUNCEMENT_AUDIENCE.STUDENTS },
] as const;

export const announcementFormSchema = z.object({
  title: z.string().trim().min(1, "Announcement title is required"),
  summary: z.string().trim(),
  body: z.string().trim().min(1, "Announcement body is required"),
  audience: z.enum([
    ANNOUNCEMENT_AUDIENCE.ALL,
    ANNOUNCEMENT_AUDIENCE.STAFF,
    ANNOUNCEMENT_AUDIENCE.GUARDIANS,
    ANNOUNCEMENT_AUDIENCE.STUDENTS,
  ]),
  publishNow: z.boolean(),
});

export type AnnouncementFormValues = z.infer<typeof announcementFormSchema>;

export const DEFAULT_ANNOUNCEMENT_FORM_VALUES: AnnouncementFormValues = {
  title: "",
  summary: "",
  body: "",
  audience: ANNOUNCEMENT_AUDIENCE.ALL,
  publishNow: false,
};
