import { PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { Trim, TrimToNull } from '../../common/transforms';

export class CreateBannerDto {
  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'Banner name is required' })
  @MaxLength(100)
  name: string;

  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'Description is required' })
  @MaxLength(500)
  description: string;

  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'Banner image is required' })
  img: string;

  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Position must be 1 or greater' })
  position: number;

  @IsOptional()
  @TrimToNull()
  @IsString()
  @MaxLength(40, { message: 'Label must be 40 characters or fewer' })
  tag?: string | null;

  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value.map((v) => (typeof v === 'string' ? v.trim() : v)).filter((v) => v !== '') : value))
  @IsArray()
  @ArrayMaxSize(4, { message: 'Add at most 4 highlights' })
  @IsString({ each: true })
  @MaxLength(60, { each: true, message: 'Each highlight must be 60 characters or fewer' })
  highlights?: string[];

  @IsOptional()
  @TrimToNull()
  @IsString()
  @MaxLength(40, { message: 'Button text must be 40 characters or fewer' })
  cta_label?: string | null;

  @IsOptional()
  @TrimToNull()
  @IsString()
  @MaxLength(300)
  @Matches(/^(\/(?!\/)|https?:\/\/)\S*$/, { message: 'Button link must be a site path like /contact or a full https:// URL' })
  cta_link?: string | null;

  @IsOptional()
  @IsDateString()
  time?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateBannerDto extends PartialType(CreateBannerDto) {}
