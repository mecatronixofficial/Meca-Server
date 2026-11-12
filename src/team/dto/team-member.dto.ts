import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';
import { Trim, TrimToNull } from '../../common/transforms';

export class CreateTeamMemberDto {
  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(100)
  name: string;

  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'Role is required' })
  @MaxLength(80)
  role: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(600, { message: 'Bio must be 600 characters or fewer' })
  bio?: string;

  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'Photo is required' })
  photo: string;

  @IsOptional()
  @TrimToNull()
  @IsString()
  @MaxLength(300)
  @Matches(/^https:\/\/([a-z0-9-]+\.)?linkedin\.com\/\S+$/i, { message: 'LinkedIn must be a https://linkedin.com/… profile link' })
  linkedin?: string | null;

  @IsOptional()
  @TrimToNull()
  @IsEmail({}, { message: 'Enter a valid email address' })
  @MaxLength(150)
  email?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Position must be 1 or greater' })
  position?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateTeamMemberDto extends PartialType(CreateTeamMemberDto) {}
