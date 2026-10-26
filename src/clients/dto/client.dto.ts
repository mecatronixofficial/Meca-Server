import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Trim, TrimLower } from '../../common/transforms';

export class CompanyDto {
  @TrimLower()
  @IsString()
  @IsNotEmpty({ message: 'Company name is required' })
  name: string;

  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'Company image is required' })
  img: string;

  @Trim()
  @IsUrl({ require_protocol: false }, { message: 'Please enter a valid URL' })
  url: string;

  @TrimLower()
  @IsString()
  @IsNotEmpty({ message: 'Industry is required' })
  industry: string;

  @Type(() => Number)
  @IsInt({ message: 'Enter a valid 4-digit year' })
  @Min(1800)
  @Max(new Date().getFullYear())
  year: number;
}

export class CreateClientDto {
  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'Client name is required' })
  client_name: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one company is required' })
  @ValidateNested({ each: true })
  @Type(() => CompanyDto)
  companies: CompanyDto[];

  @IsOptional()
  @TrimLower()
  @IsArray()
  @IsEmail({}, { each: true, message: 'Please enter a valid email address' })
  client_emails?: string[];

  @IsOptional()
  @Trim()
  @IsArray()
  @Matches(/^[0-9]{7,15}$/, { each: true, message: 'Please enter a valid phone number' })
  client_phones?: string[];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateClientDto extends PartialType(CreateClientDto) {}
