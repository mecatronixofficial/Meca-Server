import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsOptional, IsString, IsUrl, MaxLength, ValidateNested } from 'class-validator';

class ScreenshotDto {
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true, require_tld: false })
  src: string;

  @IsString()
  @MaxLength(200)
  alt: string;
}

class VideoDto {
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true, require_tld: false })
  src: string;

  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true, require_tld: false })
  poster?: string;
}

export class SaveProjectMediaDto {
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => ScreenshotDto)
  images: ScreenshotDto[];

  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => VideoDto)
  videos: VideoDto[];
}

