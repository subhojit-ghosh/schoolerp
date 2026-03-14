import { ApiProperty } from "@nestjs/swagger";

export class TenantBrandingDto {
  institutionName!: string;
  shortName!: string;
  tenantSlug!: string;

  @ApiProperty({ nullable: true })
  logoUrl!: string | null;

  @ApiProperty({ nullable: true })
  faviconUrl!: string | null;
  primaryColor!: string;
  accentColor!: string;
  sidebarColor!: string;
}
