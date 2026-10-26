import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Trim } from '../../common/transforms';

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
  @IsDateString()
  time?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateBannerDto extends PartialType(CreateBannerDto) {}
