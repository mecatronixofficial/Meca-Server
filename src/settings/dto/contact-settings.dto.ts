import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Trim, TrimLower } from '../../common/transforms';

/** Platforms the website has icons for. Keep in sync with Meca-UI src/components/ui/SocialIcon.tsx. */
export const SOCIAL_PLATFORMS = ['linkedin', 'instagram', 'facebook', 'youtube', 'github', 'twitter'] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const BUSINESS_DAYS = ['Mon-Fri', 'Mon-Sat', 'Mon-Sun'] as const;

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const webUrl = { require_protocol: true, protocols: ['http', 'https'] };

export class ContactEmailDto {
  /** e.g. "General enquiries", "Support". */
  @Trim()
  @IsString()
  @MaxLength(60)
  label: string;

  @TrimLower()
  @IsEmail({}, { message: 'Each email must be a valid email address' })
  @MaxLength(254)
  email: string;
}

export class ContactPhoneDto {
  @Trim()
  @IsString()
  @MaxLength(60)
  label: string;

  /** As shown on the site, e.g. "+91 83004 54800". */
  @Trim()
  @Matches(/^\+?[\d\s()-]{7,20}$/, { message: 'Each phone number must be 7–20 digits (spaces, +, - and brackets allowed)' })
  number: string;

  /** Used for the website's WhatsApp links (the first phone marked WhatsApp). */
  @IsBoolean()
  whatsapp: boolean;
}

export class SocialLinkDto {
  @IsIn(SOCIAL_PLATFORMS, { message: 'Choose a supported social platform' })
  platform: SocialPlatform;

  @Trim()
  @IsUrl(webUrl, { message: 'Each social link must be a full URL starting with https://' })
  @MaxLength(300)
  url: string;
}

export class AddressDto {
  /** e.g. "Mecatronix Studio", "Chennai office". */
  @Trim()
  @IsString()
  @MaxLength(80)
  label: string;

  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'Street address is required' })
  @MaxLength(200)
  street: string;

  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'City is required' })
  @MaxLength(80)
  city: string;

  @Trim()
  @IsString()
  @MaxLength(80)
  state: string;

  @Trim()
  @Matches(/^[A-Za-z0-9 -]{0,12}$/, { message: 'Postal code can only contain letters, digits, spaces and hyphens' })
  pincode: string;

  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'Country is required' })
  @MaxLength(60)
  country: string;

  /** Google Maps share link; optional. */
  @Trim()
  @ValidateIf((_, value) => value !== '' && value !== undefined && value !== null)
  @IsUrl(webUrl, { message: 'Map link must be a full URL starting with https://' })
  @MaxLength(300)
  map_url: string;
}

export class BusinessHoursDto {
  @IsIn(BUSINESS_DAYS, { message: 'Choose the working days' })
  days: (typeof BUSINESS_DAYS)[number];

  @Matches(TIME, { message: 'Opening time must look like 10:00' })
  open: string;

  @Matches(TIME, { message: 'Closing time must look like 19:00' })
  close: string;
}

/** Everything the website shows about how to reach Mecatronix. The first email, phone and address are primary. */
export class ContactSettingsDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Add at least one email address' })
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => ContactEmailDto)
  emails: ContactEmailDto[];

  @IsArray()
  @ArrayMinSize(1, { message: 'Add at least one phone number' })
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => ContactPhoneDto)
  phones: ContactPhoneDto[];

  @IsArray()
  @ArrayMaxSize(SOCIAL_PLATFORMS.length)
  @ValidateNested({ each: true })
  @Type(() => SocialLinkDto)
  socials: SocialLinkDto[];

  @IsArray()
  @ArrayMinSize(1, { message: 'Add at least one address' })
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  addresses: AddressDto[];

  @ValidateNested()
  @Type(() => BusinessHoursDto)
  hours: BusinessHoursDto;
}
