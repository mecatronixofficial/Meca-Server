import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsInt, IsOptional, Matches, Max, Min } from 'class-validator';
import { ListQueryDto } from '../../common/pagination';

const toBoolean = ({ value }: { value: unknown }) => (value === 'true' ? true : value === 'false' ? false : value);

/** Kural list filters. Always paginated (default page 1, 20 per page). `search` matches a kural number or any text. */
export class KuralListQueryDto extends ListQueryDto {
  /** Only kurals of this chapter (adhigaram), 1-133. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(133)
  chapter?: number;

  /** Only kurals of this section (paal): 1 Virtue, 2 Wealth, 3 Love. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3)
  paal?: number;

  /** `true` for highlighted kurals only. */
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  highlighted?: boolean;
}

export class DailyKuralQueryDto {
  /** Day to show (YYYY-MM-DD); defaults to today in India. */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  @IsDateString({ strict: true })
  date?: string;
}

export class SetHighlightDto {
  /** Show this kural in the website's highlights. */
  @IsBoolean()
  is_highlighted: boolean;
}
