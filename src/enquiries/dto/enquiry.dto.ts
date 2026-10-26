import { OmitType, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ListQueryDto } from '../../common/pagination';
import { Trim, TrimLower } from '../../common/transforms';

export class CreateEnquiryDto {
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(150)
  name?: string;

  @TrimLower()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(150)
  company_name?: string;

  /** Legacy alias for `company_name` sent by the public contact form. */
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(150)
  company?: string;

  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'Message is required' })
  @MaxLength(1000)
  message: string;
}

export class UpdateEnquiryDto extends PartialType(OmitType(CreateEnquiryDto, ['company'] as const)) {
  @IsOptional()
  @IsBoolean()
  is_opened?: boolean;
}

export class EnquiryQueryDto extends ListQueryDto {
  /** Filter by whether the enquiry has been opened. */
  @IsOptional()
  @IsIn(['true', 'false'])
  opened?: 'true' | 'false';
}
