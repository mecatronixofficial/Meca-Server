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

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();
    const error = this.describe(exception);

    if (error.status >= 500) {
      this.logger.error(`${request.method} ${request.url}`, exception instanceof Error ? exception.stack : String(exception));
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

    return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Internal server error' };
  }
}
