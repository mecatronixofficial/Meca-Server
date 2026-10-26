import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Trim } from '../../common/transforms';

export class BlogSectionDto {
  @IsOptional() @Trim() @IsString() heading?: string;
  @IsOptional() @Trim() @IsString() content?: string;
  @IsOptional() @Trim() @IsString() image?: string;
}

export class CreateBlogDto {
  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'Blog name is required' })
  blog_name: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one image must be uploaded' })
  @IsString({ each: true })
  blog_images: string[];

  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'Short description is required' })
  @MaxLength(250)
  short_description: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlogSectionDto)
  blog_descriptions?: BlogSectionDto[];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateBlogDto extends PartialType(CreateBlogDto) {}
