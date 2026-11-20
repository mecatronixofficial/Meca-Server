import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Trim } from '../../common/transforms';

/**
 * One group of the website's "Technology" list, e.g. Frontend: Next.js, React.
 * The website shows each technology's official logo when it knows it (Meca-UI
 * src/components/ui/brand-logos.ts, matched by name), and a neutral icon otherwise.
 */
export class TechGroupDto {
  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'Each group needs a name, e.g. "Frontend"' })
  @MaxLength(40)
  category: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Each group needs at least one technology' })
  @ArrayMaxSize(12)
  @Trim()
  @IsString({ each: true })
  @IsNotEmpty({ each: true, message: 'Technology names cannot be empty' })
  @MaxLength(40, { each: true })
  items: string[];
}

/** The website's "Technology" list (home page, hero and About page), in display order. */
export class TechStackDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Add at least one technology group' })
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => TechGroupDto)
  groups: TechGroupDto[];
}
