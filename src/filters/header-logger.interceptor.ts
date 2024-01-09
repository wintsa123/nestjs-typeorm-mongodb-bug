// response-header-logger.interceptor.ts

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class ResponseHeaderLoggerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap((response) => {
        console.log(response)
        const httpResponse = context.switchToHttp().getResponse();
        const headers = httpResponse.getHeaders();

        console.log('Response Headers:', headers);
      }),
    );
  }
}
