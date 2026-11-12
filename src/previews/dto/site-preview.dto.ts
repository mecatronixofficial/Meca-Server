import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ListQueryDto } from '../../common/pagination';
import { Trim, TrimLower } from '../../common/transforms';

/** Industry templates the public site can render. Keep in sync with Meca-UI src/data/templates.ts. */
export const PREVIEW_INDUSTRIES = [
  'medical',
  'textile',
  'ecommerce',
  'crm',
  'erp',
  'saas',
  'education',
  'real-estate',
  'restaurant',
  'logistics',
  'manufacturing',
  'finance',
  'fitness',
  'hotel',
  'automotive',
  'construction',
] as const;

/** Multipart forms send arrays as a JSON string (or repeated fields); accept both. */
const toStringArray = () =>
  Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value !== 'string' || !value.trim()) return [];
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch {
      return [value];
    }
  });

/** Public form: the visitor's brand details (the logo arrives as a multipart file). */
export class CreateSitePreviewDto {
  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'Company name is required' })
  @MaxLength(120)
  company_name: string;

  @IsIn(PREVIEW_INDUSTRIES, { message: 'Please choose an industry' })
  industry: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(160)
  tagline?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(600)
  description?: string;

  @TrimLower()
  @Matches(/^#[0-9a-f]{6}$/, { message: 'Brand colour must be a hex colour like #e10600' })
  brand_color: string;

  @IsOptional()
  @toStringArray()
  @Trim()
  @IsArray()
  @ArrayMaxSize(6)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  services?: string[];

  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'Your name is required' })
  @MaxLength(100)
  contact_name: string;

  @TrimLower()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(254)
  email: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  city?: string;
}

/** Admin: follow-up status and notes. */
export class UpdateSitePreviewDto {
  @IsOptional()
  @IsBoolean()
  is_contacted?: boolean;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class SitePreviewQueryDto extends ListQueryDto {
  @IsOptional()
  @IsIn(['true', 'false'])
  contacted?: 'true' | 'false';

  @IsOptional()
  @IsIn(PREVIEW_INDUSTRIES)
  industry?: string;
}
