import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

interface ErrorShape {
  status: number;
  message: string;
  errors?: string[];
}

/** PostgreSQL error codes we translate into client errors instead of 500s. */
const PG_ERRORS: Record<string, ErrorShape> = {
  '23505': { status: HttpStatus.CONFLICT, message: 'A record with the same unique value already exists' },
  '23503': { status: HttpStatus.CONFLICT, message: 'This record is referenced by other records' },
  '23514': { status: HttpStatus.BAD_REQUEST, message: 'A value is outside the allowed range' },
  '22P02': { status: HttpStatus.BAD_REQUEST, message: 'Invalid identifier or value format' },
};

const DATABASE_UNAVAILABLE: ErrorShape = {
  status: HttpStatus.SERVICE_UNAVAILABLE,
  message: 'The database is busy or unreachable right now. Please try again in a moment.',
};

const SCHEMA_OUT_OF_DATE: ErrorShape = {
  status: HttpStatus.INTERNAL_SERVER_ERROR,
  message: 'The database is missing a table or column this version of the API needs. Run the database migrations, then try again.',
};

/** PostgreSQL classes 08 (connection), 53 (out of resources, e.g. 53300 too many connections) and 57P01–57P03 (restarting). */
const PG_UNAVAILABLE = /^(08|53|57P0[1-3])/;
const NETWORK_CODES = new Set(['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN', 'EPIPE']);
/** node-postgres pool and socket failures that arrive without a code. */
const UNAVAILABLE_MESSAGE = /timeout exceeded when trying to connect|connection terminated|too many clients|remaining connection slots|connection refused/i;

/**
 * Database failures with an action for whoever reads them: "try again" for capacity and
 * connection problems, "run migrations" for a missing table or column. Details stay in the log.
 */
function describeDatabaseError(exception: unknown): ErrorShape | undefined {
  const { code, message } = (exception ?? {}) as { code?: unknown; message?: unknown };
  const pgCode = typeof code === 'string' ? code : '';
  if (pgCode === '42P01' || pgCode === '42703') return SCHEMA_OUT_OF_DATE;
  if (PG_UNAVAILABLE.test(pgCode) || NETWORK_CODES.has(pgCode)) return DATABASE_UNAVAILABLE;
  if (typeof message === 'string' && UNAVAILABLE_MESSAGE.test(message)) return DATABASE_UNAVAILABLE;
  return undefined;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();
    const error = this.describe(exception);

    if (error.status >= 500) {
      const detail = exception as { message?: unknown; code?: unknown } | null | undefined;
      const message = typeof detail?.message === 'string' ? detail.message : String(exception);
      const code = typeof detail?.code === 'string' ? ` [${detail.code}]` : '';
      this.logger.error(`${request.method} ${request.url}: ${message}${code}`, exception instanceof Error ? exception.stack : undefined);
    }

    response.status(error.status).json({
      success: false,
      message: error.message,
      ...(error.errors ? { errors: error.errors } : {}),
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private describe(exception: unknown): ErrorShape {
    if (exception instanceof HttpException) {
      const detail = exception.getResponse();
      const raw = typeof detail === 'string' ? detail : ((detail as { message?: string | string[] }).message ?? exception.message);
      // class-validator returns an array of messages; keep a single readable string for existing clients.
      return Array.isArray(raw)
        ? { status: exception.getStatus(), message: raw.join(', '), errors: raw }
        : { status: exception.getStatus(), message: raw };
    }

    if (exception instanceof QueryFailedError) {
      const code = (exception as QueryFailedError & { code?: string }).code;
      if (code && PG_ERRORS[code]) return PG_ERRORS[code];
    }

    // Errors raised by Express body-parser before Nest routing (bad JSON, payload too large).
    const parserError = exception as { type?: string; status?: number };
    if (parserError?.type === 'entity.parse.failed') return { status: HttpStatus.BAD_REQUEST, message: 'Invalid JSON format in request body.' };
    if (parserError?.type === 'entity.too.large') return { status: HttpStatus.PAYLOAD_TOO_LARGE, message: 'Request body is too large.' };

    return describeDatabaseError(exception) ?? { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Internal server error' };
  }
}
