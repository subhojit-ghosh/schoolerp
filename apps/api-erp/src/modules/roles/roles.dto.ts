import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class RolePermissionDto {
  id!: string;
  slug!: string;
}

export class RoleDto {
  id!: string;
  name!: string;
  slug!: string;

  @ApiProperty({ enum: ["platform", "system", "institution"] })
  roleType!: string;

  isSystem!: boolean;
  isConfigurable!: boolean;

  @ApiProperty({ type: RolePermissionDto, isArray: true })
  permissions!: RolePermissionDto[];
}

export class PermissionDto {
  id!: string;
  slug!: string;
}

export class CreateRoleBodyDto {
  name!: string;

  @ApiProperty({ type: String, isArray: true })
  permissionIds!: string[];
}

export class UpdateRoleBodyDto {
  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional({ type: String, isArray: true })
  permissionIds?: string[];
}
