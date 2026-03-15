import { SetMetadata } from "@nestjs/common";
import { PERMISSION_METADATA_KEY, type PermissionSlug } from "../../constants";

export const RequirePermission = (...permissions: PermissionSlug[]) =>
  SetMetadata(PERMISSION_METADATA_KEY, permissions);
