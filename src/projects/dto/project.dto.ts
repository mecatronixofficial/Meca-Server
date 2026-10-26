import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUrl, IsUUID, MaxLength } from 'class-validator';
import { Trim } from '../../common/transforms';

export class CreateProjectDto {
  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'Project name is required' })
  project_name: string;

  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'Project image is required' })
  project_image: string;

  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'Short description is required' })
  @MaxLength(250)
  short_description: string;

  @Trim()
  @IsUrl({ require_protocol: false }, { message: 'Please enter a valid project URL' })
  project_url: string;

  @IsUUID('4', { message: 'Invalid client reference' })
  client_id: string;

  @IsUUID('4', { message: 'Invalid work reference' })
  work_id: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
