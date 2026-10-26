import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { PASSWORD_MIN_LENGTH } from '../../common/passwords';
import { TrimLower } from '../../common/transforms';

export class LoginDto {
  @TrimLower()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Current password is required' })
  oldPassword: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, { message: `New password must be at least ${PASSWORD_MIN_LENGTH} characters` })
  newPassword: string;
}

export class ForgotPasswordDto {
  @TrimLower()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;
}

export class VerifyResetTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'Token is required' })
  token: string;
}

export class ResetPasswordDto extends VerifyResetTokenDto {
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, { message: `New password must be at least ${PASSWORD_MIN_LENGTH} characters` })
  newPassword: string;
}
