import { PartialType } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Length, MinLength } from 'class-validator';
import { PASSWORD_MIN_LENGTH } from '../../common/passwords';
import { Trim, TrimLower } from '../../common/transforms';
import { AdminRole } from '../entities/admin.entity';

export class CreateAdminDto {
  @Trim()
  @IsString()
  @Length(2, 100)
  name: string;

  @TrimLower()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  phone: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, { message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` })
  password: string;

  @IsOptional()
  @Trim()
  @IsString()
  img?: string;

  @IsOptional()
  @IsEnum(AdminRole, { message: 'Role must be admin or superadmin' })
  role?: AdminRole;
}

export class UpdateAdminDto extends PartialType(CreateAdminDto) {}
