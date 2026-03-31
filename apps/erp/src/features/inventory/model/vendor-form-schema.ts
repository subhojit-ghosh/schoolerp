import { z } from "zod";

const VENDOR_NAME_MAX = 200;
const VENDOR_FIELD_MAX = 500;
const GST_LENGTH = 15;
const PHONE_MIN = 10;

export const vendorFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Vendor name is required")
    .max(VENDOR_NAME_MAX),
  contactPerson: z.string().max(VENDOR_FIELD_MAX).optional().or(z.literal("")),
  phone: z
    .string()
    .min(PHONE_MIN, "Phone must be at least 10 digits")
    .max(VENDOR_FIELD_MAX)
    .optional()
    .or(z.literal("")),
  email: z
    .email("Invalid email")
    .max(VENDOR_FIELD_MAX)
    .optional()
    .or(z.literal("")),
  address: z.string().max(VENDOR_FIELD_MAX).optional().or(z.literal("")),
  gstNumber: z
    .string()
    .length(GST_LENGTH, "GST number must be exactly 15 characters")
    .optional()
    .or(z.literal("")),
});

export type VendorFormValues = z.infer<typeof vendorFormSchema>;

export const VENDOR_DEFAULT_VALUES: VendorFormValues = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  gstNumber: "",
};
