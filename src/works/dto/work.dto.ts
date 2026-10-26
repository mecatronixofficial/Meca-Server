import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, ValidateIf, ValidateNested } from 'class-validator';
import { Trim } from '../../common/transforms';

export class WorkSectionDto {
  @Trim() @IsString() @IsNotEmpty() heading: string;
  @Trim() @IsString() @IsNotEmpty() details: string;
  @Trim() @IsString() @IsNotEmpty() img: string;
}

export class CreateWorkDto {
  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(100)
  title: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one info section is required' })
  @ValidateNested({ each: true })
  @Type(() => WorkSectionDto)
  info: WorkSectionDto[];

  /** Optional; send null to unlink the project. */
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID('4', { message: 'Invalid project reference.' })
  project_id?: string | null;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateWorkDto extends PartialType(CreateWorkDto) {}
