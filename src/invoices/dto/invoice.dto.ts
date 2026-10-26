import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ListQueryDto } from '../../common/pagination';
import { Trim, TrimLower } from '../../common/transforms';
import { InvoiceStatus } from '../entities/invoice.entity';

export class InvoiceItemDto {
  /** Rows with an empty description are dropped, so blank rows from the editor are harmless. */
  @IsOptional()
  @Trim()
  @IsString()
  desc?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  qty: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  rate: number;
}

/** Used for both create and edit: an edit replaces the invoice contents. */
export class SaveInvoiceDto {
  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'Invoice number is required' })
  invoiceNo: string;

  @IsDateString({}, { message: 'Invoice date is required' })
  invoiceDate: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsDateString()
  dueDate?: string | null;

  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'Client name is required' })
  clientName: string;

  @IsOptional()
  @TrimLower()
  @ValidateIf((_, value) => value !== '')
  @IsEmail({}, { message: 'Client email must be a valid email address' })
  clientEmail?: string;

  @IsOptional()
  @Trim()
  @IsString()
  clientPhone?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one invoice item is required' })
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageCount?: number;

  @IsOptional()
  @Trim()
  @IsString()
  notes?: string;
}

export class InvoiceQueryDto extends ListQueryDto {
  /** Filter by invoice status. */
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;
}
