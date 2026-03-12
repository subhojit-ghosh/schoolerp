import { ApiProperty } from "@nestjs/swagger";

export class TenantBrandingDto {
  @ApiProperty()
  institutionName!: string;

  @ApiProperty()
  shortName!: string;

  @ApiProperty()
  tenantSlug!: string;

  @ApiProperty({ nullable: true })
  logoUrl!: string | null;

  @ApiProperty({ nullable: true })
  faviconUrl!: string | null;

  @ApiProperty()
  primaryColor!: string;

  @ApiProperty()
  accentColor!: string;

  @ApiProperty()
  sidebarColor!: string;
}
