import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class DeleteManyDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one id is required' })
  @IsUUID('4', { each: true })
  ids: string[];
}
