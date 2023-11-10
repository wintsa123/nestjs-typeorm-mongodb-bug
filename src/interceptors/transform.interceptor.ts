import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = _context.switchToHttp().getRequest();
    const isValidateEndpoint = request.url.includes('/validate');
    if (isValidateEndpoint) {
      // 如果是 /validate 接口，返回特殊响应
      return next.handle(); // 在这里可以直接返回特殊的响应
    }

    return next.handle().pipe(
      map((data: any) => {

        return {
          data: instanceToPlain(data),
          code: 0,
          message: '请求成功',
        };
      })
    );
  }
}
