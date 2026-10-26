import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ListQueryDto } from '../../common/pagination';
import { Trim, TrimLower } from '../../common/transforms';

export class CreateReviewDto {
  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'User name is required' })
  user_name: string;

  @TrimLower()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  user_email: string;

  @IsOptional()
  @TrimLower()
  @IsString()
  company_name?: string;

  @Type(() => Number)
  @IsInt({ message: 'Rating must be a whole number from 1 to 5' })
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(500, { message: 'Comment cannot exceed 500 characters' })
  comment?: string;
}

/** Admins may also override the verification flag when editing. */
export class UpdateReviewDto extends PartialType(CreateReviewDto) {
  @IsOptional()
  @IsBoolean()
  is_verified?: boolean;
}

export class ReviewQueryDto extends ListQueryDto {
  /** Filter by verification status. */
  @IsOptional()
  @IsIn(['true', 'false'])
  verified?: 'true' | 'false';
}
