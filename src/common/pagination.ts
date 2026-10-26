import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Brackets, ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { Trim } from './transforms';

export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 20;

/**
 * Query string for list endpoints. Pagination is opt-in: without `page`/`limit` a list endpoint
 * returns a plain array (the original response shape); with either, it returns `{ items, meta }`.
 */
export class ListQueryDto {
  /** 1-based page number. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  /** Items per page (max 100, default 20). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit?: number;

  /** Case-insensitive text search over the list's main text columns. */
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  search?: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

export type ListResult<T> = T[] | Paginated<T>;

const escapeLike = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`);

/** Adds `(col1 ILIKE %search% OR col2 ILIKE ...)` for the given qualified columns, e.g. `b.blog_name`. */
export function applySearch<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>, columns: string[], search?: string): SelectQueryBuilder<T> {
  if (!search) return qb;
  return qb.andWhere(
    new Brackets((where) => {
      for (const column of columns) where.orWhere(`${column} ILIKE :search`, { search: `%${escapeLike(search)}%` });
    }),
  );
}

/** Runs the query as a page when `page`/`limit` is given, otherwise returns every row. */
export async function paginate<T extends ObjectLiteral>(qb: SelectQueryBuilder<T>, query: ListQueryDto): Promise<ListResult<T>> {
  if (query.page === undefined && query.limit === undefined) return qb.getMany();
  const page = query.page ?? 1;
  const limit = query.limit ?? DEFAULT_PAGE_SIZE;
  const [items, total] = await qb
    .skip((page - 1) * limit)
    .take(limit)
    .getManyAndCount();
  return { items, meta: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) } };
}
