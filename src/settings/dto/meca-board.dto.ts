import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Trim } from '../../common/transforms';

/** A site path ("/preview", not "//host") or a full http(s) URL. */
export const BOARD_LINK = /^(\/(?!\/)[\w\-./?=&#%~]*|https?:\/\/[^\s]+)$/;

/**
 * MECA's board: the 3D assistant raises a handwritten board (e.g. "Preview your website for free",
 * with "free" highlighted) and shakes it when the site opens, then again every `interval_minutes`.
 * Clicking the board opens `link`.
 */
export class MecaBoardDto {
  @IsBoolean()
  enabled: boolean;

  @Trim()
  @IsString()
  @MinLength(3, { message: 'Board text must be at least 3 characters' })
  @MaxLength(60, { message: 'Board text can be at most 60 characters' })
  text: string;

  /** Word or phrase of `text` to highlight; blank for none. */
  @Trim()
  @IsString()
  @MaxLength(20, { message: 'The highlighted word can be at most 20 characters' })
  highlight: string;

  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'Board link is required' })
  @MaxLength(300)
  @Matches(BOARD_LINK, { message: 'Board link must be a site path like /preview or a full URL starting with https://' })
  link: string;

  /** Minutes between appearances after the first one (when the site opens). */
  @Type(() => Number)
  @IsInt({ message: 'Interval must be a whole number of minutes' })
  @Min(1, { message: 'Interval must be at least 1 minute' })
  @Max(60, { message: 'Interval can be at most 60 minutes' })
  interval_minutes: number;
}
