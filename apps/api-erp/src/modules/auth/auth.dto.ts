import { ApiProperty } from "@nestjs/swagger";

export class SignUpBodyDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  mobile!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  password!: string;
}

export class SignInBodyDto {
  @ApiProperty()
  identifier!: string;

  @ApiProperty()
  password!: string;
}

export class AuthUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  mobile!: string;

  @ApiProperty()
  email!: string;
}

export class AuthSessionDto {
  @ApiProperty({ type: () => AuthUserDto })
  user!: AuthUserDto;

  @ApiProperty({
    type: String,
    format: "date-time",
  })
  expiresAt!: string;
}
