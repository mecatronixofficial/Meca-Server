import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ok } from '../api-response';

/** Wraps raw handler return values in the standard envelope; already-wrapped values pass through. */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next
      .handle()
      .pipe(map((value) => (value && typeof value === 'object' && 'success' in value ? value : ok('Request completed successfully', value))));
  }
}
