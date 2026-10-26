import { IsEmail } from 'class-validator';
import { TrimLower } from '../../common/transforms';

export class SubscribeDto {
  @TrimLower()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;
}
