import { ArrayMinSize, IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Trim } from '../../common/transforms';

export class CreateVoucherDto {
  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  title: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  img?: string[];

  @IsOptional()
  @Trim()
  @IsArray()
  @IsString({ each: true })
  heading?: string[];

  @Trim()
  @IsArray()
  @ArrayMinSize(1, { message: 'Message is required' })
  @IsString({ each: true })
  msg: string[];
}
